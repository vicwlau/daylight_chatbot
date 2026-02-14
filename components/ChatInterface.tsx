"use client";

import { FormEvent, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { SentimentAssessment } from "./SentimentAssessment";

const SHOW_SENTIMENT_ASSESSMENT = true;

export function ChatInterface() {
  const { messages, sendMessage, status, error } = useChat({
    experimental_throttle: 0,
  });
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return;
    }
    setInput("");
    await sendMessage({ text: trimmedInput });
  };

  return (
    <div className="rounded-2xl border border-zinc-200/20 bg-black/45 p-4 backdrop-blur-md sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daylight Chatbot</h2>
        <span className="text-xs uppercase tracking-wide text-zinc-300">
          Gemini
        </span>
      </div>

      <div className="flex h-[42vh] flex-col gap-3 overflow-y-auto rounded-xl border border-zinc-200/20 bg-black/25 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-300">
            Ask about frames, lenses, pricing, or support.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-amber-300 text-zinc-900"
                  : "mr-auto bg-zinc-100/20 text-zinc-100"
              }`}
            >
              {message.parts
                .filter((part) => part.type === "text")
                .map((part, index) => (
                  <p key={`${message.id}-${index}`}>{part.text}</p>
                ))}
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-amber-300">
          Something went wrong. Check your API route and key.
        </p>
      ) : null}

      {/* <SentimentAssessment
        conversationHistory={messages}
        hidden={!SHOW_SENTIMENT_ASSESSMENT}
      /> */}

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          name="prompt"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask Daylight AI..."
          className="flex-1 rounded-xl border border-zinc-100/20 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-300"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-amber-400 px-4 py-2 font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
