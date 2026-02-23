"use client";

type LogItem = {
  id: string;
  relation: string;
  created_at: string;
  from: { title?: string; id: string; type?: string };
  to: { title?: string; id: string; type?: string };
};

export default function ConversionLog({ logs }: { logs: LogItem[] }) {
  return (
    <article className="panel ambient-edge">
      <h3>Conversion Log</h3>
      <ul className="small muted" style={{ display: "grid", gap: 6, paddingLeft: 16 }}>
        {logs.map((log) => (
          <li key={log.id}>
            {log.from.title || log.from.id} → {log.relation} → {log.to.title || log.to.id}
          </li>
        ))}
      </ul>
    </article>
  );
}
