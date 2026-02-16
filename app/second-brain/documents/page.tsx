"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBox from "@/components/SearchBox";

type DocItem = {
  id: string;
  title: string;
  path: string;
  source: "workspace" | "repo";
  preview: string;
};

export default function DocumentsPage() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/second-brain/documents")
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
      <h2>Second Brain · Documents</h2>
      <SearchBox value={query} onChange={setQuery} placeholder="Filter documents..." />
      <div className="stack">
        {filtered.map((item) => (
          <article key={item.id} className="panel">
            <h3>
              {item.title} <span className="badge">{item.source}</span>
            </h3>
            <p className="muted small">{item.path}</p>
            <p>{item.preview || "(empty)"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
