"use client";

type Experience = {
  id: string;
  title: string;
  metadata: Record<string, unknown>;
  stale?: boolean;
};

const statusOptions = ["queued", "scheduled", "completed"] as const;

export default function ExperienceQueue({
  experiences,
  onStatus,
}: {
  experiences: Experience[];
  onStatus: (id: string, status: string) => Promise<void>;
}) {
  return (
    <article className="panel ambient-edge">
      <h3>Experience Queue</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {experiences.map((item) => {
          const status = String(item.metadata.status || "queued");
          return (
            <div key={item.id} className="small" style={{ border: "1px solid #1f2937", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{item.title}</strong>
                {item.stale ? <span className="badge">STALE</span> : null}
              </div>
              <p className="muted" style={{ margin: "6px 0" }}>
                {String(item.metadata.category || "other")} · {String(item.metadata.priority || "medium")}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {statusOptions.map((opt) => (
                  <button
                    key={opt}
                    className="nav-link"
                    onClick={() => onStatus(item.id, opt)}
                    style={{ opacity: status === opt ? 1 : 0.6 }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
