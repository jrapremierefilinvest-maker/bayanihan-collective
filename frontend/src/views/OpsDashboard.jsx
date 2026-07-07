import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import CaseTable from "../components/CaseTable.jsx";

const CASE_TYPES = [
  "All",
  "Payment Dispute",
  "Resource-Sharing Request",
  "Peer Mentorship Request",
  "Project Collaboration Matching",
  "Skill Certification Review",
  "Contract Dispute Mediation",
  "Client Complaint Escalation",
  "Resource Contribution Proposal",
];

const STATUS_FILTERS = ["All", "Waiting", "Under Review", "Escalated", "Resolved"];

export default function OpsDashboard() {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [actionLogs, setActionLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getCases(), api.getCaseStats()])
      .then(([caseData, statData]) => {
        setCases(caseData);
        setStats(statData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const statusOk = statusFilter === "All" || c.status === statusFilter;
      const typeOk = typeFilter === "All" || c.caseType === typeFilter;
      return statusOk && typeOk;
    });
  }, [cases, statusFilter, typeFilter]);

  async function handleStatusChange(id, status) {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    try {
      await api.updateCase(id, { status });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTierChange(id, escalationTier) {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, escalationTier } : c)));
    try {
      await api.updateCase(id, { escalationTier });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAction(id, type) {
    try {
      const entry = await api.logCaseAction(id, type);
      setActionLogs((prev) => ({ ...prev, [id]: [...(prev[id] || []), entry] }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="loading-state">Loading cases…</p>;

  return (
    <div className="view">
      <h1 className="view__title">Ops Dashboard</h1>
      <p className="view__subtitle">
        Case tracking for cooperative members — payment disputes, resource requests, mentorship,
        and more.
      </p>

      {error && <p className="error-banner">{error}</p>}

      {stats && (
        <div className="stat-row">
          <StatCard label="Total Cases" value={stats.total} />
          <StatCard label="Waiting" value={stats.waiting} tone="waiting" />
          <StatCard label="Escalated" value={stats.escalated} tone="escalated" />
          <StatCard label="Resolved" value={stats.resolved} tone="resolved" />
        </div>
      )}

      <div className="filter-row">
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Case Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {CASE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <CaseTable
        cases={filteredCases}
        onStatusChange={handleStatusChange}
        onTierChange={handleTierChange}
        onAction={handleAction}
        actionLogs={actionLogs}
      />
    </div>
  );
}
