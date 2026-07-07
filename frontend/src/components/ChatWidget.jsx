import { useState } from "react";
import GemmaBadge from "./GemmaBadge.jsx";

export default function ChatWidget({ messages, onSend, sending }) {
  const [draft, setDraft] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    onSend(draft.trim());
    setDraft("");
  }

  return (
    <div className="chat-widget">
      <div className="chat-widget__log">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message chat-message--${m.role}`}>
            {m.role === "assistant" && <GemmaBadge classification={m.classification} />}
            <div className="chat-message__bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message__bubble chat-message__bubble--pending">Thinking…</div>
          </div>
        )}
      </div>
      <form className="chat-widget__input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about onboarding, resource sharing, mentorship…"
        />
        <button type="submit" className="btn btn--primary" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  );
}
