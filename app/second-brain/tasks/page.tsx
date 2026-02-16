"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBox from "@/components/SearchBox";

type Column = { id: string; title: string };
type Card = {
  id: string;
  title: string;
  details?: string;
  project?: string;
  columnId: string;
  priority?: number;
};

export default function TasksPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/second-brain/tasks")
      .then((r) => r.json())
      .then((d) => {
        setColumns(d.columns || []);
        setCards(d.cards || []);
      })
      .catch(() => {
        setColumns([]);
        setCards([]);
      });
  }, []);

  const filteredCards = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return cards;
    return cards.filter((c) => `${c.title} ${c.details || ""} ${c.project || ""}`.toLowerCase().includes(q));
  }, [cards, query]);

  const byCol = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const col of columns) map.set(col.id, []);
    for (const card of filteredCards) {
      const list = map.get(card.columnId) || [];
      list.push(card);
      map.set(card.columnId, list);
    }
    return map;
  }, [columns, filteredCards]);

  return (
    <section>
      <h2>Second Brain · Tasks</h2>
      <SearchBox value={query} onChange={setQuery} placeholder="Filter task cards..." />
      <div className="kanban">
        {columns.map((col) => (
          <article key={col.id} className="panel">
            <h3>
              {col.title} <span className="muted">({(byCol.get(col.id) || []).length})</span>
            </h3>
            <div className="stack">
              {(byCol.get(col.id) || []).map((card) => (
                <div key={card.id} className="card">
                  <strong>{card.title}</strong>
                  <p className="muted small">{card.project || "no-project"}</p>
                  {card.details ? <p>{card.details}</p> : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
