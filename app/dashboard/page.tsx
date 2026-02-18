import { readExecutionEvidence } from "@/lib/execution-evidence";

export default function DashboardPage() {
  const evidence = readExecutionEvidence();

  return (
    <section>
      <h2>Mission Control</h2>
      <p className="muted">Execution evidence for the current proof window.</p>

      <div className="summary-grid">
        <article className="panel summary-card">
          <p className="muted small">Total commits</p>
          <p className="summary-value">{evidence.totalCommits}</p>
        </article>
        <article className="panel summary-card">
          <p className="muted small">Pushed commits</p>
          <p className="summary-value">{evidence.pushedCommits}</p>
        </article>
        <article className="panel summary-card">
          <p className="muted small">Window</p>
          <p className="summary-value">{evidence.windowHours ? `${evidence.windowHours}h` : "-"}</p>
        </article>
      </div>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Execution Evidence Panel</h3>
        <p className="muted small">Per repository shipped vs local-only commits. Updated: {evidence.generatedAt || "-"}</p>
        <div className="stack">
          {evidence.repos.map((repo) => (
            <div key={repo.name} className="card evidence-card">
              <div className="decision-header">
                <strong>{repo.name}</strong>
                <span className="muted small">{repo.branch}</span>
              </div>
              <div className="evidence-metrics">
                <span className="badge">Shipped: {repo.shippedCommits}</span>
                <span className="badge">Local-only: {repo.localOnlyCommits}</span>
              </div>
              {repo.shippedCommits === 0 ? <p className="small muted">Reason: {repo.shippedReason}</p> : null}
            </div>
          ))}
          {!evidence.repos.length ? <p className="muted small">No evidence file available yet.</p> : null}
        </div>
      </article>
    </section>
  );
}
