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

type LinkView = { source: string; target: string; relation: string; id: string };

const typeColor: Record<GraphNode["type"], string> = {
  ambition: "#a78bfa",
  experience: "#60a5fa",
  insight: "#2dd4bf",
  task: "#e5e7eb",
  proof: "#22c55e",
  decision: "#8b5cf6",
  commitment: "#34d399",
  document: "#f59e0b",
  memory: "#f472b6",
  idea: "#fb7185",
  project: "#f97316",
  person: "#cbd5e1",
};

export default function GraphDashboardPage() {
  const [graph, setGraph] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string>("");
  const [hoveredLinkId, setHoveredLinkId] = useState<string>("");

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
    const links: LinkView[] = graph.edges.map((edge) => ({
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
            const isHovered = hoveredNodeId === n.id;
            ctx.fillStyle = n.color;
            ctx.beginPath();
            ctx.arc(n.x || 0, n.y || 0, isHovered ? 7.5 : 6, 0, 2 * Math.PI, false);
            ctx.fill();

            if (isHovered) {
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillStyle = "#d1d5db";
              ctx.fillText(n.title, (n.x || 0) + 10, (n.y || 0) + 4);
            }
          }}
          linkColor={(link) => (hoveredLinkId === (link as LinkView).id ? "rgba(34, 211, 238, 0.9)" : "rgba(34, 211, 238, 0.2)")}
          linkWidth={(link) => (hoveredLinkId === (link as LinkView).id ? 2.2 : 1)}
          cooldownTicks={40}
          d3VelocityDecay={0.72}
          onNodeHover={(node) => setHoveredNodeId((node as GraphNodeView | null)?.id || "")}
          onLinkHover={(link) => setHoveredLinkId((link as LinkView | null)?.id || "")}
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
            <p>Ref: {selected.ref_path || "(none)"}</p>
          </div>
        ) : (
          <p className="small muted">Hover to preview, click to inspect.</p>
        )}
      </article>
    </section>
  );
}
