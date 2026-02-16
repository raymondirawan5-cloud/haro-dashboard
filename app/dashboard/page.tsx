export default function DashboardPage() {
  return (
    <section>
      <h2>Mission Control</h2>
      <p className="muted">
        Starter shell preserved during Next.js migration. Use legacy server for interactive drag/drop
        task updates if needed.
      </p>
      <div className="grid two">
        <article className="panel">
          <h3>Tasks Board</h3>
          <p className="muted">Kanban data source: workspace/.openclaw/tasks.json</p>
        </article>
        <article className="panel">
          <h3>Activity Feed</h3>
          <p className="muted">Worklog source remains available via legacy Express server.</p>
        </article>
      </div>
    </section>
  );
}
