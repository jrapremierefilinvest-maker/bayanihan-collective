import { useState } from "react";
import { api } from "../api/client.js";
import ChatWidget from "../components/ChatWidget.jsx";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Welcome to the Bayanihan Collective! I'm the Member Concierge — ask me about onboarding, resource sharing, project matching, or mentorship.",
  classification: null,
};

export default function MemberConcierge() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend(text) {
    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setSending(true);
    setError(null);

    try {
      const history = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const { reply, classification } = await api.sendConciergeMessage(text, history.slice(0, -1));
      setMessages((prev) => [...prev, { role: "assistant", content: reply, classification }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="view">
      <h1 className="view__title">Member Concierge</h1>
      <p className="view__subtitle">
        Two-layer AI: Gemma (Fireworks AI) classifies intent, then Claude generates the response.
      </p>
      {error && <p className="error-banner">{error}</p>}
      <div className="panel panel--chat">
        <ChatWidget messages={messages} onSend={handleSend} sending={sending} />
      </div>
    </div>
  );
}
