import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import {
  buildSentimentAnalysisPrompt,
  SENTIMENT_PRIORITY_SYSTEM_PROMPT,
} from "./prompts";

const sentimentAnalysisSchema = z.object({
  sentiment: z.enum([
    "very-negative",
    "negative",
    "neutral",
    "positive",
    "very-positive",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  summary: z.string(),
  signals: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    const googleApiKey = (
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      ""
    ).trim();

    if (!googleApiKey) {
      return Response.json(
        {
          error:
            "Missing Google API key. Set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY in .env.local and restart dev server.",
        },
        { status: 500 },
      );
    }

    const google = createGoogleGenerativeAI({ apiKey: googleApiKey });

    const payload: unknown = await request.json();

    const conversationHistory =
      typeof payload === "object" &&
      payload !== null &&
      "conversationHistory" in payload
        ? (payload as { conversationHistory: unknown }).conversationHistory
        : payload;

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      system: SENTIMENT_PRIORITY_SYSTEM_PROMPT,
      prompt: buildSentimentAnalysisPrompt(conversationHistory),
      schema: sentimentAnalysisSchema,
    });

    return Response.json({ analysis: object });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      { error: "Failed to analyze sentiment and priority", message },
      { status: 500 },
    );
  }
}
