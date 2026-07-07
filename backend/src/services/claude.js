const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are the Member Concierge for the Bayanihan Collective, a member-owned
cooperative for independent AI developers. You welcome new members, explain how mutual support,
resource-sharing, and project matching work, and answer general questions about cooperative
membership. You are not a freelance marketplace assistant — never suggest commission-based
matching or platform fees. Keep answers concise and friendly.`;

function localFallbackReply(message, intent) {
  const byIntent = {
    onboarding_inquiry:
      "Welcome to the Collective! As a new member you'll get access to the mutual support case system, the shared resource pool, and the mentorship directory. Want a walkthrough of any of those?",
    resource_sharing:
      "Members can request or contribute shared resources like compute credits, datasets, and templates through a resource-sharing case. Want me to point you to how to file one?",
    project_matching:
      "Project collaboration matching connects you with other members whose specialization complements yours. Tell me what you're working on and what skills you need.",
    mentorship_request:
      "Peer mentorship requests go through the same intake as other cases, just tagged routine priority. What skill area are you looking for a mentor in?",
    general_question:
      "Happy to help — could you say a bit more about what you're trying to do in the Collective?",
  };

  return byIntent[intent] || byIntent.general_question;
}

/**
 * Generates a conversational reply using Claude. Falls back to a canned,
 * intent-aware reply when ANTHROPIC_API_KEY is not configured, so the demo
 * runs without live credentials.
 */
export async function generateReply(message, { intent, history = [] } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { reply: localFallbackReply(message, intent), source: "local-fallback" };
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [
          ...history,
          { role: "user", content: `[Detected intent: ${intent}] ${message}` },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? localFallbackReply(message, intent);
    return { reply, source: "claude" };
  } catch (err) {
    console.error("Claude reply generation failed, using local fallback:", err.message);
    return { reply: localFallbackReply(message, intent), source: "local-fallback" };
  }
}
