import { z } from "zod";

type GoogleSearchInput = {
  query: string;
  limit: number;
};

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

const vectorApiResponseSchema = z.union([
  z.array(vectorMatchSchema),
  z.object({ matches: z.array(vectorMatchSchema) }),
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

async function fetchVectorMatches({
  query,
  topK,
}: Pick<VectorSearchInput, "query" | "topK">): Promise<VectorSearchMatch[]> {
  const vectorSearchUrl =
    process.env.VECTOR_SEARCH_URL || "http://172.24.2.23:8000/query";

  if (!vectorSearchUrl) {
    throw new Error("VECTOR_SEARCH_URL is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(vectorSearchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, topK }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Vector search API failed with status ${response.status}`,
      );
    }

    const payload: unknown = await response.json();
    const parsed = vectorApiResponseSchema.parse(payload);

    return Array.isArray(parsed) ? parsed : parsed.matches;
  } finally {
    clearTimeout(timeout);
  }
}

async function runGoogleSearch({ query, limit }: GoogleSearchInput) {
  return {
    provider: "google-search-placeholder",
    query,
    limit,
    items: [
      {
        title: "Placeholder search result",
        url: "https://example.com",
        snippet:
          "Replace runGoogleSearch with a real Google Search integration.",
      },
    ],
  };
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
  } catch {
    allMatches = placeholderVectorMatches;
    provider = "vector-search-placeholder";
  }

  const matches = allMatches.filter((match) => match.score >= scoreThreshold);

  return {
    provider,
    query,
    topK,
    scoreThreshold,
    matches,
    textChunks: matches.map((match) => match.text),
  };
}

export const chatTools = {
  googleSearch: {
    description: "Searches the web for recent information.",
    inputSchema: z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(10).default(5),
    }),
    execute: async ({ query, limit }: GoogleSearchInput) => {
      return runGoogleSearch({ query, limit });
    },
  },
  vectorSearch: {
    description:
      "Searches the knowledge base for semantically relevant documents.",
    inputSchema: z.object({
      query: z.string().min(1),
      topK: z.number().int().min(1).max(20).default(5),
      scoreThreshold: z.number().min(0).max(1).default(0.75),
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
