import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { getSystemPrompt } from "./prompts";
import { chatTools } from "./tools";

export async function POST(request: Request) {
  const { messages } = await request.json();

  console.log("[chat] incoming messages:", JSON.stringify(messages, null, 2));

  const modelMessages = await convertToModelMessages(messages);

  console.log(
    "[chat] converted modelMessages:",
    JSON.stringify(modelMessages, null, 2),
  );

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `${getSystemPrompt("default")}

For any customer support, policy, FAQ, return, shipping, payment, or warranty question, call the vectorSearch tool first before answering.
Base answers on retrieved chunks and avoid guessing policy details.`,
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
