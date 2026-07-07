const SENTIMENTS_BY_MODE = {
  mixed: ["Engaged", "Skeptical", "Curious", "Neutral", "Nodding"],
  curious: ["Engaged", "Curious", "Nodding", "Asking follow-up"],
  tough: ["Skeptical", "Pushing back", "Unconvinced", "Interrupting"],
};

const SENTIMENT_TONE = {
  Engaged: "positive",
  Curious: "positive",
  Nodding: "positive",
  "Asking follow-up": "positive",
  Neutral: "neutral",
  Skeptical: "negative",
  "Pushing back": "negative",
  Unconvinced: "negative",
  Interrupting: "negative",
};

export default function AudiencePanel({ audienceMode, reactions }) {
  const pool = SENTIMENTS_BY_MODE[audienceMode] || SENTIMENTS_BY_MODE.mixed;

  return (
    <div className="audience-panel">
      <div className="audience-panel__header">
        <span>AI Audience — {audienceMode} mode</span>
      </div>
      <div className="audience-panel__reactions">
        {reactions.length === 0 && (
          <p className="audience-panel__hint">
            Reactions will appear here as the session runs. Possible tags in this mode:{" "}
            {pool.join(", ")}.
          </p>
        )}
        {reactions.map((r, i) => (
          <span key={i} className={`sentiment-tag sentiment-tag--${SENTIMENT_TONE[r.tag]}`}>
            {r.tag} <em>{r.at}</em>
          </span>
        ))}
      </div>
    </div>
  );
}
