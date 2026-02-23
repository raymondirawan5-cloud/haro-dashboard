"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/client-api-base";
import type { GraphNode, GraphEdge } from "@/lib/graph-store";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphPayload = { nodes: GraphNode[]; edges: GraphEdge[] };

type GraphNodeView = GraphNode & {
  color: string;
  x?: number;
  y?: number;
};

const typeColor: Record<GraphNode["type"], string> = {
  decision: "#a78bfa",
  task: "#22d3ee",
  commitment: "#34d399",
  document: "#f59e0b",
  memory: "#f472b6",
  proof: "#60a5fa",
  idea: "#fb7185",
  project: "#f97316",
  person: "#cbd5e1",
};

export default function GraphDashboardPage() {
  const [graph, setGraph] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const loadGraph = useCallback(async () => {
    const res = await fetch(apiUrl("/api/graph"));
    if (!res.ok) throw new Error("failed to load graph");
    const data = (await res.json()) as GraphPayload;
    setGraph({ nodes: Array.isArray(data.nodes) ? data.nodes : [], edges: Array.isArray(data.edges) ? data.edges : [] });
  }, []);

  useEffect(() => {
    loadGraph().catch((e) => setError(e instanceof Error ? e.message : "failed to load graph"));
  }, [loadGraph]);

  const graphData = useMemo(() => {
    const nodes: GraphNodeView[] = graph.nodes.map((node) => ({ ...node, color: typeColor[node.type] || "#9ca3af" }));
    const links = graph.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      relation: edge.relation,
      id: edge.id,
    }));
    return { nodes, links };
  }, [graph]);

  return (
    <section>
      <div className="decision-header">
        <div>
          <h2>Knowledge Graph</h2>
          <p className="muted small">Semantic overlay for Mission Control + Second Brain</p>
        </div>
        <div className="inline-actions">
          <Link href="/dashboard" className="nav-link">Back to Dashboard</Link>
        </div>
      </div>

      {error ? <p className="muted">{error}</p> : null}

      <div className="panel ambient-edge" style={{ background: "#070709", minHeight: 560 }}>
        <ForceGraph2D
          graphData={graphData}
          backgroundColor="#070709"
          nodeLabel={(node) => {
            const n = node as GraphNodeView;
            return `${n.title}\n${n.type}`;
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNodeView;
            const label = n.title;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = n.color;
            ctx.beginPath();
            ctx.arc(n.x || 0, n.y || 0, 6, 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.fillStyle = "#cbd5e1";
            ctx.fillText(label, (n.x || 0) + 8, (n.y || 0) + 4);
          }}
          linkColor={() => "rgba(56, 189, 248, 0.45)"}
          linkWidth={1.2}
          cooldownTicks={80}
          onNodeClick={(node) => setSelected(node as GraphNode)}
          enableNodeDrag
        />
      </div>

      <article className="panel ambient-edge" style={{ marginTop: 16 }}>
        <h3>Detail</h3>
        {selected ? (
          <div className="small muted">
            <p><strong>{selected.title}</strong></p>
            <p>Type: {selected.type}</p>
            <p>ID: {selected.id}</p>
            <p>Ref: {selected.ref_path}</p>
          </div>
        ) : (
          <p className="small muted">Click a node to inspect details.</p>
        )}
      </article>
    </section>
  );
}
