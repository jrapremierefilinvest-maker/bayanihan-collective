const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

const INTENTS = [
  "onboarding_inquiry",
  "resource_sharing",
  "project_matching",
  "mentorship_request",
  "general_question",
];

// Naive keyword fallback so the demo still works without a Fireworks key.
function classifyLocally(message) {
  const text = message.toLowerCase();
  if (/(join|new member|welcome|onboard)/.test(text)) {
    return { intent: "onboarding_inquiry", confidence: 0.82 };
  }
  if (/(resource|compute|dataset|gpu|share)/.test(text)) {
    return { intent: "resource_sharing", confidence: 0.78 };
  }
  if (/(match|collaborat|pair|team up|partner)/.test(text)) {
    return { intent: "project_matching", confidence: 0.75 };
  }
  if (/(mentor|guidance|review my|teach me)/.test(text)) {
    return { intent: "mentorship_request", confidence: 0.8 };
  }
  return { intent: "general_question", confidence: 0.6 };
}

/**
 * Classifies intent using Gemma on Fireworks AI. Falls back to a local
 * keyword classifier when FIREWORKS_API_KEY is not configured, so the
 * demo runs without live credentials.
 */
export async function classifyIntent(message) {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) {
    return { ...classifyLocally(message), source: "local-fallback" };
  }

  const model = process.env.FIREWORKS_GEMMA_MODEL || "accounts/fireworks/models/gemma2-9b-it";
  const prompt = `Classify the user's message into exactly one intent from this list: ${INTENTS.join(
    ", "
  )}. Respond with strict JSON only: {"intent": "...", "confidence": 0.0-1.0}.\n\nMessage: "${message}"`;

  try {
    const response = await fetch(FIREWORKS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fireworks API returned ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");

    if (!INTENTS.includes(parsed.intent)) {
      return { ...classifyLocally(message), source: "local-fallback" };
    }

    return {
      intent: parsed.intent,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
      source: "fireworks-gemma",
    };
  } catch (err) {
    console.error("Fireworks classification failed, using local fallback:", err.message);
    return { ...classifyLocally(message), source: "local-fallback" };
  }
}
