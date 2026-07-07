export default function GemmaBadge({ classification }) {
  if (!classification) return null;
  const pct = Math.round((classification.confidence || 0) * 100);
  const sourceLabel =
    classification.source === "fireworks-gemma" ? "Gemma (Fireworks)" : "Gemma (local fallback)";

  return (
    <div className="gemma-badge">
      <span className="gemma-badge__dot" />
      {sourceLabel} classified: <strong>{classification.intent}</strong> ({pct}%) → routing to
      Claude
    </div>
  );
}
