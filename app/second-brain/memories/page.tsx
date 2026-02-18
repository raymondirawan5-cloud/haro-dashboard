"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/client-api-base";
import SearchBox from "@/components/SearchBox";

type MemoryItem = { id: string; title: string; path: string; preview: string };

export default function MemoriesPage() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/second-brain/memories"))
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((i) => `${i.title} ${i.preview} ${i.path}`.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <section>
      <h2>Second Brain · Memories</h2>
      <SearchBox value={query} onChange={setQuery} placeholder="Filter memories..." />
      <div className="stack">
        {filtered.map((item) => (
          <article key={item.id} className="panel">
            <h3>{item.title}</h3>
            <p className="muted small">{item.path}</p>
            <p>{item.preview || "(empty)"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
