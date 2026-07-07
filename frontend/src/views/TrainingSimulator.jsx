import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import Timer from "../components/Timer.jsx";
import AudiencePanel from "../components/AudiencePanel.jsx";

const REACTION_POOL = {
  mixed: ["Engaged", "Skeptical", "Curious", "Neutral", "Nodding"],
  curious: ["Engaged", "Curious", "Nodding", "Asking follow-up"],
  tough: ["Skeptical", "Pushing back", "Unconvinced", "Interrupting"],
};

export default function TrainingSimulator() {
  const [modules, setModules] = useState([]);
  const [audienceModes, setAudienceModes] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("mixed");
  const [sessionActive, setSessionActive] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [qaBank, setQaBank] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reactionTimeoutRef = useRef(null);

  useEffect(() => {
    Promise.all([api.getTrainingModules(), api.getAudienceModes(), api.getSessionHistory()])
      .then(([moduleData, audienceData, historyData]) => {
        setModules(moduleData);
        setAudienceModes(audienceData);
        setHistory(historyData);
        if (moduleData.length) setSelectedModuleId(moduleData[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedModuleId) {
      api.getQaBank(selectedModuleId).then(setQaBank).catch((err) => setError(err.message));
    }
  }, [selectedModuleId]);

  useEffect(() => {
    if (!running) {
      clearTimeout(reactionTimeoutRef.current);
      return;
    }
    const scheduleReaction = () => {
      const pool = REACTION_POOL[selectedAudience] || REACTION_POOL.mixed;
      const tag = pool[Math.floor(Math.random() * pool.length)];
      setReactions((prev) => [
        ...prev.slice(-9),
        { tag, at: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }) },
      ]);
      reactionTimeoutRef.current = setTimeout(scheduleReaction, 2500 + Math.random() * 2500);
    };
    reactionTimeoutRef.current = setTimeout(scheduleReaction, 1500);
    return () => clearTimeout(reactionTimeoutRef.current);
  }, [running, selectedAudience]);

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  function startSession() {
    setSessionActive(true);
    setRunning(true);
    setElapsed(0);
    setReactions([]);
  }

  function togglePause() {
    setRunning((prev) => !prev);
  }

  async function endSession() {
    setRunning(false);
    setSessionActive(false);
    const sentimentSummary = reactions.length
      ? `${reactions.length} reactions logged, most recent: ${reactions[reactions.length - 1]?.tag}`
      : "No reactions logged";
    try {
      const saved = await api.logSession({
        moduleId: selectedModuleId,
        audienceMode: selectedAudience,
        durationSeconds: elapsed,
        sentimentSummary,
      });
      setHistory((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="loading-state">Loading training content…</p>;

  return (
    <div className="view">
      <h1 className="view__title">Training Simulator</h1>
      <p className="view__subtitle">
        "Welcome to the Collective" onboarding practice — rehearse explaining mutual support,
        resource contribution, and governance to prospective members.
      </p>

      {error && <p className="error-banner">{error}</p>}

      {!sessionActive && (
        <div className="panel">
          <h2 className="panel__title">Session Setup</h2>
          <div className="setup-row">
            <label>
              Module
              <select value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)}>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Audience Mode
              <select value={selectedAudience} onChange={(e) => setSelectedAudience(e.target.value)}>
                {audienceModes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedModule && (
            <div className="module-preview">
              <p>{selectedModule.summary}</p>
            </div>
          )}
          <button className="btn btn--primary" onClick={startSession} disabled={!selectedModuleId}>
            Start Practice Session
          </button>
        </div>
      )}

      {sessionActive && selectedModule && (
        <div className="panel">
          <div className="practice-header">
            <h2 className="panel__title">{selectedModule.title}</h2>
            <Timer running={running} onTick={setElapsed} />
          </div>
          <ul className="talking-points">
            {selectedModule.talkingPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          <div className="practice-controls">
            <button className="btn" onClick={togglePause}>
              {running ? "Pause" : "Resume"}
            </button>
            <button className="btn btn--danger" onClick={endSession}>
              End Session
            </button>
          </div>
          <AudiencePanel audienceMode={selectedAudience} reactions={reactions} />
        </div>
      )}

      <div className="panel">
        <h2 className="panel__title">Q&amp;A Bank</h2>
        <div className="qa-bank">
          {qaBank.map((qa) => (
            <details key={qa.id} className="qa-item">
              <summary>{qa.question}</summary>
              <p>{qa.suggestedAnswer}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel__title">Session History</h2>
        {history.length === 0 && <p className="empty-state">No practice sessions logged yet.</p>}
        {history.length > 0 && (
          <table className="history-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Audience</th>
                <th>Duration</th>
                <th>Summary</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{modules.find((m) => m.id === h.moduleId)?.title || h.moduleId}</td>
                  <td>{h.audienceMode}</td>
                  <td>{h.durationSeconds}s</td>
                  <td>{h.sentimentSummary}</td>
                  <td>{new Date(h.completedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
