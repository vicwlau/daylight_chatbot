"use client";

import { useState } from "react";

type SentimentAnalysis = {
  sentiment:
    | "very-negative"
    | "negative"
    | "neutral"
    | "positive"
    | "very-positive";
  priority: "low" | "medium" | "high" | "urgent";
  summary: string;
  signals: string[];
};

type SentimentAssessmentProps = {
  conversationHistory: unknown;
  hidden?: boolean;
};

export function SentimentAssessment({
  conversationHistory,
  hidden = false,
}: SentimentAssessmentProps) {
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hidden) {
    return null;
  }

  const onAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationHistory }),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof (payload as { message: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "Failed to analyze conversation.";

        throw new Error(message);
      }

      const result = (payload as { analysis?: SentimentAnalysis }).analysis;
      if (!result) {
        throw new Error("No analysis returned.");
      }

      setAnalysis(result);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unexpected error while analyzing sentiment.";
      setError(message);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-zinc-200/20 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-200">
          Conversation Sentiment
        </p>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : "Assess"}
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}

      {analysis ? (
        <div className="mt-2 space-y-1 text-xs text-zinc-200">
          <p>
            Sentiment:{" "}
            <span className="font-semibold">{analysis.sentiment}</span>
          </p>
          <p>
            Priority: <span className="font-semibold">{analysis.priority}</span>
          </p>
          <p>{analysis.summary}</p>
          {analysis.signals.length > 0 ? (
            <p className="text-zinc-300">
              Signals: {analysis.signals.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
