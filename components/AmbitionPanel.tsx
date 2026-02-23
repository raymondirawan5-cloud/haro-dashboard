"use client";

type Ambition = { id: string; title: string; metadata: Record<string, unknown> };

export default function AmbitionPanel({
  ambitions,
  selectedAmbitionId,
  onSelect,
}: {
  ambitions: Ambition[];
  selectedAmbitionId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <article className="panel ambient-edge">
      <h3>Identity Panel</h3>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
        <button className="nav-link" onClick={() => onSelect("")}>All</button>
        {ambitions.map((item) => (
          <button
            key={item.id}
            className="nav-link"
            onClick={() => onSelect(item.id)}
            style={{
              borderColor: selectedAmbitionId === item.id ? "#a78bfa" : undefined,
              boxShadow: selectedAmbitionId === item.id ? "0 0 14px rgba(167,139,250,.35)" : undefined,
              transition: "all 120ms ease",
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
    </article>
  );
}
