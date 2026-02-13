import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
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
    messages: modelMessages,
    tools: chatTools,
    stopWhen: stepCountIs(5),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
  });

  return result.toUIMessageStreamResponse();
}
