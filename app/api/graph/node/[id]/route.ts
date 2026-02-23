import { NextResponse } from "next/server";
import { getAdjacencyList, getNode } from "@/lib/graph-store";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const node = getNode(id);
  if (!node) return NextResponse.json({ error: "node not found" }, { status: 404 });

  const graph = getAdjacencyList();
  const relatedEdges = graph.edges.filter((edge) => edge.from === id || edge.to === id);
  const relatedNodeIds = new Set<string>([id]);
  for (const edge of relatedEdges) {
    relatedNodeIds.add(edge.from);
    relatedNodeIds.add(edge.to);
  }

  const relatedNodes = graph.nodes.filter((item) => relatedNodeIds.has(item.id));
  return NextResponse.json({ nodes: relatedNodes, edges: relatedEdges, focus: node });
}
