const STATUS_OPTIONS = ["Waiting", "Under Review", "Escalated", "Resolved"];
const TIER_OPTIONS = ["Routine", "Escalate to Peer Mediator", "Escalate to Coop Board"];

function statusClass(status) {
  return `pill pill--status-${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function priorityClass(priority) {
  return `pill pill--priority-${priority.toLowerCase()}`;
}

export default function CaseTable({ cases, onStatusChange, onTierChange, onAction, actionLogs }) {
  if (!cases.length) {
    return <p className="empty-state">No cases match the current filters.</p>;
  }

  return (
    <div className="case-table__wrap">
      <table className="case-table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Developer</th>
            <th>Specialization</th>
            <th>Case Type</th>
            <th>Status</th>
            <th>Escalation Tier</th>
            <th>Mediator</th>
            <th>Due Date</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td className="case-table__id">{c.id}</td>
              <td>{c.developerName}</td>
              <td>{c.specialization}</td>
              <td>{c.caseType}</td>
              <td>
                <select
                  className={statusClass(c.status)}
                  value={c.status}
                  onChange={(e) => onStatusChange(c.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="pill pill--tier"
                  value={c.escalationTier}
                  onChange={(e) => onTierChange(c.id, e.target.value)}
                >
                  {TIER_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
              <td>{c.assignedMediator}</td>
              <td>{c.dueDate}</td>
              <td>
                <span className={priorityClass(c.priority)}>{c.priority}</span>
              </td>
              <td>
                <div className="case-table__actions">
                  <button title="Log a mock call" onClick={() => onAction(c.id, "call")}>
                    Call
                  </button>
                  <button title="Log a mock email" onClick={() => onAction(c.id, "email")}>
                    Email
                  </button>
                  <button title="Log a mock text" onClick={() => onAction(c.id, "text")}>
                    Text
                  </button>
                </div>
                {actionLogs[c.id]?.length > 0 && (
                  <div className="case-table__log">
                    Last: {actionLogs[c.id][actionLogs[c.id].length - 1].type} logged
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
