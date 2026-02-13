import { z } from "zod";

type VectorSearchInput = {
  query: string;
  topK: number;
  scoreThreshold: number;
};

export type VectorSearchMatch = {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
};

export type VectorSearchResponse = {
  provider: "vector-search-api" | "vector-search-placeholder";
  query: string;
  topK: number;
  scoreThreshold: number;
  matches: VectorSearchMatch[];
  textChunks: string[];
};

const vectorMatchSchema = z.object({
  id: z.string(),
  score: z.number(),
  text: z.string(),
  metadata: z.record(z.string(), z.unknown()).catch({}),
});

const vectorResultItemSchema = z.object({
  id: z.string().optional(),
  score: z.number(),
  text: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional().catch({}),
});

const vectorApiResponseSchema = z.union([
  z.array(vectorMatchSchema),
  z.object({ matches: z.array(vectorMatchSchema) }),
  z.object({
    query: z.string().optional(),
    results: z.array(vectorResultItemSchema),
  }),
]);

const placeholderVectorMatches: VectorSearchMatch[] = [
  {
    id: "doc_placeholder_1",
    score: 0.99,
    text: "Replace runVectorSearch with your vector DB retrieval logic.",
    metadata: { source: "placeholder" },
  },
  {
    id: "doc_placeholder_2",
    score: 0.62,
    text: "This is a lower confidence chunk that may be filtered out.",
    metadata: { source: "placeholder" },
  },
];

const isVectorDebugEnabled =
  process.env.VECTOR_SEARCH_DEBUG === "1" ||
  process.env.NODE_ENV === "development";

function logVectorDebug(message: string, data?: unknown) {
  if (!isVectorDebugEnabled) {
    return;
  }

  if (data === undefined) {
    console.log(`[vector-search] ${message}`);
    return;
  }

  console.log(`[vector-search] ${message}`, data);
}

async function fetchVectorMatches({
  query,
  topK,
}: Pick<VectorSearchInput, "query" | "topK">): Promise<VectorSearchMatch[]> {
  const vectorSearchUrl =
    process.env.VECTOR_SEARCH_URL ||
    "https://oidioid-blessedly-tifany.ngrok-free.dev/query";

  if (!vectorSearchUrl) {
    throw new Error("VECTOR_SEARCH_URL is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const startedAt = Date.now();

  const requestBody = {
    query,
    top_n: topK,
  };

  logVectorDebug("request:start", {
    url: vectorSearchUrl,
    body: requestBody,
  });

  try {
    const response = await fetch(vectorSearchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const durationMs = Date.now() - startedAt;
    const responseText = await response.text();

    logVectorDebug("request:response", {
      status: response.status,
      ok: response.ok,
      durationMs,
      contentType: response.headers.get("content-type"),
      bodyPreview: responseText.slice(0, 500),
    });

    if (!response.ok) {
      throw new Error(
        `Vector search API failed with status ${response.status}. Body preview: ${responseText.slice(0, 200)}`,
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Vector search API returned non-JSON response. Body preview: ${responseText.slice(0, 200)}`,
      );
    }

    const parsed = vectorApiResponseSchema.parse(payload);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if ("matches" in parsed) {
      return parsed.matches;
    }

    return parsed.results.map((result, index) => ({
      id: result.id ?? `result_${index}`,
      score: result.score,
      text: result.text,
      metadata: result.metadata ?? {},
    }));
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "Unknown error";
    logVectorDebug("request:error", {
      durationMs,
      message,
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function runVectorSearch({
  query,
  topK,
  scoreThreshold,
}: VectorSearchInput): Promise<VectorSearchResponse> {
  let allMatches: VectorSearchMatch[] = placeholderVectorMatches;
  let provider: VectorSearchResponse["provider"] = "vector-search-placeholder";

  try {
    allMatches = await fetchVectorMatches({ query, topK });
    provider = "vector-search-api";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logVectorDebug("fallback:placeholder", {
      reason: message,
    });
    allMatches = placeholderVectorMatches;
    provider = "vector-search-placeholder";
  }

  const matches = allMatches.filter((match) => match.score >= scoreThreshold);
  const finalMatches = matches.length > 0 ? matches : allMatches.slice(0, topK);

  return {
    provider,
    query,
    topK,
    scoreThreshold,
    matches: finalMatches,
    textChunks: finalMatches.map((match) => match.text),
  };
}

export const chatTools = {
  vectorSearch: {
    description:
      "Searches the knowledge base for semantically relevant documents.",
    inputSchema: z.object({
      query: z.string().min(1),
      topK: z.number().int().min(1).max(20).default(5),
      scoreThreshold: z.number().default(0),
    }),
    execute: async ({
      query,
      topK,
      scoreThreshold,
    }: VectorSearchInput): Promise<VectorSearchResponse> => {
      return runVectorSearch({ query, topK, scoreThreshold });
    },
  },
};
