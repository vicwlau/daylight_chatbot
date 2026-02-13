import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { buildPrompt } from "./prompts";
import { chatTools } from "./tools";

export async function POST(request: Request) {
  const googleApiKey =
    (
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

  const { messages } = await request.json();

  console.log("[chat] incoming messages:", JSON.stringify(messages, null, 2));

  const modelMessages = await convertToModelMessages(messages);

  console.log(
    "[chat] converted modelMessages:",
    JSON.stringify(modelMessages, null, 2),
  );

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildPrompt(["support", "shipping-returns"]),
    messages: modelMessages,
    tools: chatTools,
    stopWhen: stepCountIs(5),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
    onStepFinish: (step) => {
      console.log(
        "[chat] step toolCalls:",
        JSON.stringify(step.toolCalls, null, 2),
      );
    },
  });

  return result.toUIMessageStreamResponse();
}
