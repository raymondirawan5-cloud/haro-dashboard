import { readDecisionsIndex, readProofLatest, readToday } from "@/lib/mission-control-store";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const today = readToday();
  const decisions = Array.from(readDecisionsIndex().values());
  const proof = readProofLatest();

  const blocked = today.commitments.filter((item) => item.status === "blocked");
  const pendingDecisions = decisions.filter((item) => item.status === "pending");

  return (
    <section>
      <h2>Mission Control</h2>
      <p className="muted">Execution authority: today.json → tasks.json → decisions/*.json → proof/latest.json</p>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Today Commitments</h3>
        <p className="muted small">Date: {today.date}</p>
        <div className="stack">
          {today.commitments.map((item) => (
            <div key={item.id} className="card evidence-card">
              <div className="decision-header">
                <strong>{item.title}</strong>
                <span className="badge">{item.status}</span>
              </div>
              <p className="small muted">task_id: {item.task_id} · decision_id: {item.decision_id}</p>
            </div>
          ))}
          {!today.commitments.length ? <p className="muted small">No commitments.</p> : null}
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Blocked Commitments</h3>
        <div className="stack">
          {blocked.map((item) => (
            <div key={item.id} className="card evidence-card">
              <strong>{item.title}</strong>
              <p className="small muted">task_id: {item.task_id} · decision_id: {item.decision_id}</p>
            </div>
          ))}
          {!blocked.length ? <p className="muted small">No blocked commitments.</p> : null}
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Pending Decisions</h3>
        <div className="stack">
          {pendingDecisions.map((decision) => (
            <div key={decision.id} className="card evidence-card">
              <strong>{String(decision.title || decision.id)}</strong>
              <p className="small muted">decision_id: {decision.id}</p>
            </div>
          ))}
          {!pendingDecisions.length ? <p className="muted small">No pending decisions.</p> : null}
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Latest Proof Evidence</h3>
        <p className="muted small">generated_at: {proof.generated_at}</p>
        <p className="small muted">commits: {proof.commits.length} · deployments: {proof.deployments.length}</p>
        <div className="stack">
          {proof.task_proofs.map((item, idx) => (
            <div key={`${item.task_id}-${idx}`} className="card evidence-card">
              <strong>{item.task_id}</strong>
              <p className="small muted">{item.proof_type}: {item.reference}</p>
            </div>
          ))}
          {!proof.task_proofs.length ? <p className="muted small">No task proof entries.</p> : null}
        </div>
      </article>
    </section>
  );
}
