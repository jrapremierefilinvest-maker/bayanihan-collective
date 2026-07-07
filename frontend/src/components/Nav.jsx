const TABS = [
  { id: "dashboard", label: "Ops Dashboard" },
  { id: "training", label: "Training Simulator" },
  { id: "concierge", label: "Member Concierge" },
];

export default function Nav({ activeView, onNavigate }) {
  return (
    <header className="app-shell__header">
      <div className="app-shell__brand">
        <span className="app-shell__brand-mark">BC</span>
        <div>
          <div className="app-shell__brand-name">Bayanihan Collective</div>
          <div className="app-shell__brand-tagline">Cooperative ops for independent AI developers</div>
        </div>
      </div>
      <nav className="app-shell__nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`app-shell__nav-btn ${activeView === tab.id ? "is-active" : ""}`}
            onClick={() => onNavigate(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
