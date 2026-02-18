"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import SearchBox from "@/components/SearchBox";

type Column = { id: string; title: string };
type Card = {
  id: string;
  title: string;
  details?: string;
  project?: string;
  columnId: string;
  priority?: number;
  dueDate?: string;
};

type EditState = {
  title: string;
  status: string;
  dueDate: string;
};

export default function TasksPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [query, setQuery] = useState("");

  const [quickTitle, setQuickTitle] = useState("");
  const [quickDetails, setQuickDetails] = useState("");
  const [quickStatus, setQuickStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ title: "", status: "", dueDate: "" });
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const col of columns) counts.set(col.id, 0);
    for (const card of cards) counts.set(card.columnId, (counts.get(card.columnId) || 0) + 1);
    return counts;
  }, [cards, columns]);

  async function onCreateTask(e: FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/second-brain/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: quickTitle,
          details: quickDetails,
          status: quickStatus || undefined,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setCards(data.cards || []);
      setColumns(data.columns || []);
      setQuickTitle("");
      setQuickDetails("");
      setQuickStatus("");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(card: Card) {
    setEditingId(card.id);
    setEditState({ title: card.title, status: card.columnId, dueDate: card.dueDate || "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState({ title: "", status: "", dueDate: "" });
  }

  async function saveEdit(cardId: string) {
    if (!editState.title.trim()) return;
    setSavingId(cardId);
    try {
      const response = await fetch("/api/second-brain/tasks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cardId,
          title: editState.title,
          status: editState.status,
          dueDate: editState.dueDate || null,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setCards(data.cards || []);
      setColumns(data.columns || []);
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section>
      <h2>Second Brain · Tasks</h2>

      <form onSubmit={onCreateTask} className="panel quick-add-form">
        <div className="decision-header">
          <strong>Quick add</strong>
          <span className="muted small">Total cards: {cards.length}</span>
        </div>
        <div className="quick-add-grid">
          <input value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} placeholder="Task title" required />
          <select value={quickStatus} onChange={(e) => setQuickStatus(e.target.value)}>
            <option value="">Default status</option>
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={quickDetails}
          onChange={(e) => setQuickDetails(e.target.value)}
          placeholder="Optional description"
          rows={2}
        />
        <div className="inline-actions">
          <button type="submit" disabled={submitting || !quickTitle.trim()}>
            {submitting ? "Adding..." : "Add task"}
          </button>
        </div>
      </form>

      <SearchBox value={query} onChange={setQuery} placeholder="Filter task cards..." />

      <div className="task-status-strip">
        {columns.map((col) => (
          <div key={col.id} className="panel task-status-pill">
            <span>{col.title}</span>
            <strong>{statusCounts.get(col.id) || 0}</strong>
          </div>
        ))}
      </div>

      <div className="kanban polished" style={{ marginTop: 12 }}>
        {columns.map((col) => (
          <article key={col.id} className="panel task-column">
            <h3>
              {col.title} <span className="muted">({(byCol.get(col.id) || []).length})</span>
            </h3>
            <div className="stack">
              {(byCol.get(col.id) || []).map((card) => {
                const isEditing = editingId === card.id;
                return (
                  <div key={card.id} className="card task-card">
                    {isEditing ? (
                      <div className="stack compact">
                        <input
                          value={editState.title}
                          onChange={(e) => setEditState((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Task title"
                        />
                        <select
                          value={editState.status}
                          onChange={(e) => setEditState((prev) => ({ ...prev, status: e.target.value }))}
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={editState.dueDate}
                          onChange={(e) => setEditState((prev) => ({ ...prev, dueDate: e.target.value }))}
                        />
                        <div className="inline-actions">
                          <button
                            type="button"
                            onClick={() => saveEdit(card.id)}
                            disabled={savingId === card.id || !editState.title.trim()}
                          >
                            {savingId === card.id ? "Saving..." : "Save"}
                          </button>
                          <button type="button" onClick={cancelEdit} className="ghost-btn">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <strong>{card.title}</strong>
                        {card.details ? <p className="muted">{card.details}</p> : null}
                        <div className="task-card-meta">
                          <span className="muted small">{card.project || "no-project"}</span>
                          {card.dueDate ? <span className="muted small">Due: {card.dueDate}</span> : null}
                        </div>
                        <div className="inline-actions">
                          <button type="button" onClick={() => startEdit(card)} className="ghost-btn">
                            Quick edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
