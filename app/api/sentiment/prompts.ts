export const SENTIMENT_PRIORITY_SYSTEM_PROMPT = `You are an assistant that analyzes customer support conversations.

Your task:
1) Determine the human user's overall sentiment.
2) Determine the business priority level for follow-up.

Output must be concise, factual, and based only on the provided conversation JSON.
Do not invent details.

Sentiment labels:
- very-negative
- negative
- neutral
- positive
- very-positive

Priority labels:
- low
- medium
- high
- urgent

Priority guidance:
- urgent: user is highly distressed, threatening churn/public escalation, legal/safety risk, or blocked from critical use.
- high: strong frustration, repeated unresolved issue, payment/order/account blocker.
- medium: clear dissatisfaction or confusion but not critical.
- low: informational request, calm tone, no active issue.
`;

export function buildSentimentAnalysisPrompt(
  conversationHistory: unknown,
): string {
  return `Analyze the following conversation history JSON and return sentiment + priority assessment.\n\nConversation JSON:\n${JSON.stringify(conversationHistory, null, 2)}`;
}
