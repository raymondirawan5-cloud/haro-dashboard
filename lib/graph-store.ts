import fs from "node:fs";
import path from "node:path";
import { DECISIONS_DIR, PROOF_PATH, TASKS_PATH, TODAY_PATH } from "@/lib/mission-control-store";

const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
const GRAPH_DIR = path.join(WORKSPACE_DIR, ".openclaw", "graph");
const NODES_PATH = path.join(GRAPH_DIR, "nodes.json");
const EDGES_PATH = path.join(GRAPH_DIR, "edges.json");

export const NODE_TYPES = [
  "decision",
  "task",
  "commitment",
  "document",
  "memory",
  "proof",
  "idea",
  "project",
  "person",
] as const;

export const RELATION_TYPES = [
  "drives",
  "blocks",
  "depends_on",
  "supports",
  "contradicts",
  "references",
  "verified_by",
  "derived_from",
  "part_of",
  "related_to",
] as const;

export type GraphNodeType = (typeof NODE_TYPES)[number];
export type GraphRelationType = (typeof RELATION_TYPES)[number];

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  title: string;
  ref_path: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: GraphRelationType;
  created_at: string;
};

type NodesFile = { nodes: GraphNode[] };
type EdgesFile = { edges: GraphEdge[] };

export type GraphAdjacency = { nodes: GraphNode[]; edges: GraphEdge[] };

function ensureGraphFiles() {
  fs.mkdirSync(GRAPH_DIR, { recursive: true });
  if (!fs.existsSync(NODES_PATH)) {
    fs.writeFileSync(NODES_PATH, `${JSON.stringify({ nodes: [] }, null, 2)}\n`, "utf8");
  }
  if (!fs.existsSync(EDGES_PATH)) {
    fs.writeFileSync(EDGES_PATH, `${JSON.stringify({ edges: [] }, null, 2)}\n`, "utf8");
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function isNodeType(value: unknown): value is GraphNodeType {
  return typeof value === "string" && (NODE_TYPES as readonly string[]).includes(value);
}

function isRelationType(value: unknown): value is GraphRelationType {
  return typeof value === "string" && (RELATION_TYPES as readonly string[]).includes(value);
}

function normalizeNodes(value: unknown): GraphNode[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const raw = item as Partial<GraphNode>;
      if (!raw || typeof raw.id !== "string" || !raw.id.trim()) return null;
      if (!isNodeType(raw.type)) return null;
      if (typeof raw.title !== "string") return null;
      if (typeof raw.ref_path !== "string" || !raw.ref_path.trim()) return null;
      return {
        id: raw.id.trim(),
        type: raw.type,
        title: raw.title,
        ref_path: raw.ref_path,
        created_at: typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
        metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
      };
    })
    .filter((x): x is GraphNode => Boolean(x));
}

function normalizeEdges(value: unknown): GraphEdge[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const raw = item as Partial<GraphEdge>;
      if (!raw || typeof raw.id !== "string" || !raw.id.trim()) return null;
      if (typeof raw.from !== "string" || !raw.from.trim()) return null;
      if (typeof raw.to !== "string" || !raw.to.trim()) return null;
      if (!isRelationType(raw.relation)) return null;
      return {
        id: raw.id.trim(),
        from: raw.from.trim(),
        to: raw.to.trim(),
        relation: raw.relation,
        created_at: typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
      };
    })
    .filter((x): x is GraphEdge => Boolean(x));
}

function loadNodesFile(): NodesFile {
  ensureGraphFiles();
  const parsed = readJson<Partial<NodesFile>>(NODES_PATH, { nodes: [] });
  const normalized = { nodes: normalizeNodes(parsed.nodes) };
  writeJson(NODES_PATH, normalized);
  return normalized;
}

function loadEdgesFile(): EdgesFile {
  ensureGraphFiles();
  const parsed = readJson<Partial<EdgesFile>>(EDGES_PATH, { edges: [] });
  const normalized = { edges: normalizeEdges(parsed.edges) };
  writeJson(EDGES_PATH, normalized);
  return normalized;
}

function toAbsoluteRef(refPath: string): string {
  if (path.isAbsolute(refPath)) return refPath;
  return path.join(WORKSPACE_DIR, refPath);
}

function assertExistingRef(refPath: string) {
  const resolved = toAbsoluteRef(refPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`ref_path does not exist: ${resolved}`);
  }
  return resolved;
}

export function getGraph(): GraphAdjacency {
  const nodes = loadNodesFile().nodes;
  const edges = loadEdgesFile().edges;
  return { nodes, edges };
}

export function getNode(id: string): GraphNode | null {
  if (!id.trim()) return null;
  const { nodes } = getGraph();
  return nodes.find((node) => node.id === id) ?? null;
}

export function createNode(node: GraphNode): GraphNode {
  if (!node.id.trim()) throw new Error("node.id is required");
  if (!isNodeType(node.type)) throw new Error("invalid node.type");

  const existingRefPath = assertExistingRef(node.ref_path);
  const nodesFile = loadNodesFile();
  const existing = nodesFile.nodes.find((item) => item.id === node.id);
  if (existing) return existing;

  const next: GraphNode = {
    id: node.id.trim(),
    type: node.type,
    title: node.title,
    ref_path: existingRefPath,
    created_at: node.created_at || new Date().toISOString(),
    metadata: node.metadata && typeof node.metadata === "object" ? node.metadata : {},
  };

  const saved = { nodes: [...nodesFile.nodes, next] };
  writeJson(NODES_PATH, saved);
  return next;
}

export function createEdge(edge: GraphEdge): GraphEdge {
  if (!edge.from.trim() || !edge.to.trim()) throw new Error("edge.from and edge.to are required");
  if (!isRelationType(edge.relation)) throw new Error("invalid edge.relation");

  const nodes = loadNodesFile().nodes;
  if (!nodes.find((node) => node.id === edge.from)) throw new Error(`from node not found: ${edge.from}`);
  if (!nodes.find((node) => node.id === edge.to)) throw new Error(`to node not found: ${edge.to}`);

  const edgesFile = loadEdgesFile();
  const existing = edgesFile.edges.find(
    (item) => item.from === edge.from && item.to === edge.to && item.relation === edge.relation,
  );
  if (existing) return existing;

  const next: GraphEdge = {
    id: edge.id || `edge-${crypto.randomUUID()}`,
    from: edge.from,
    to: edge.to,
    relation: edge.relation,
    created_at: edge.created_at || new Date().toISOString(),
  };

  const saved = { edges: [...edgesFile.edges, next] };
  writeJson(EDGES_PATH, saved);
  return next;
}

export function ensureNodeExists(entity: {
  id: string;
  type: GraphNodeType;
  title: string;
  ref_path: string;
  metadata?: Record<string, unknown>;
}): GraphNode {
  const existing = getNode(entity.id);
  if (existing) return existing;
  return createNode({
    id: entity.id,
    type: entity.type,
    title: entity.title,
    ref_path: entity.ref_path,
    created_at: new Date().toISOString(),
    metadata: entity.metadata || {},
  });
}

export function ensureEdgeExists(from: string, to: string, relation: GraphRelationType): GraphEdge {
  const { edges } = getGraph();
  const existing = edges.find((edge) => edge.from === from && edge.to === to && edge.relation === relation);
  if (existing) return existing;
  return createEdge({
    id: `edge-${crypto.randomUUID()}`,
    from,
    to,
    relation,
    created_at: new Date().toISOString(),
  });
}

export function getAdjacencyList(): GraphAdjacency {
  return getGraph();
}

function findDecisionRefPath(decisionId: string): string {
  if (!fs.existsSync(DECISIONS_DIR)) return DECISIONS_DIR;
  const files = fs.readdirSync(DECISIONS_DIR).filter((name) => name.endsWith(".json"));
  for (const name of files) {
    const full = path.join(DECISIONS_DIR, name);
    try {
      const parsed = JSON.parse(fs.readFileSync(full, "utf8")) as unknown;
      if (Array.isArray((parsed as { decisions?: unknown[] }).decisions)) {
        const list = (parsed as { decisions: Array<{ id?: string }> }).decisions;
        if (list.some((item) => item?.id === decisionId)) return full;
      } else if ((parsed as { id?: string }).id === decisionId) {
        return full;
      }
    } catch {
      // ignore invalid file and continue scanning
    }
  }
  return DECISIONS_DIR;
}

export function syncTaskCreated(task: { id: string; title: string; decision_id: string }) {
  ensureNodeExists({
    id: task.id,
    type: "task",
    title: task.title,
    ref_path: TASKS_PATH,
    metadata: { decision_id: task.decision_id },
  });

  ensureNodeExists({
    id: task.decision_id,
    type: "decision",
    title: task.decision_id,
    ref_path: findDecisionRefPath(task.decision_id),
  });

  ensureEdgeExists(task.decision_id, task.id, "drives");
}

export function syncCommitmentCreated(commitment: { id: string; title: string; task_id: string; decision_id: string }) {
  ensureNodeExists({
    id: commitment.id,
    type: "commitment",
    title: commitment.title,
    ref_path: TODAY_PATH,
    metadata: { task_id: commitment.task_id, decision_id: commitment.decision_id },
  });

  ensureNodeExists({
    id: commitment.task_id,
    type: "task",
    title: commitment.task_id,
    ref_path: TASKS_PATH,
  });

  ensureEdgeExists(commitment.id, commitment.task_id, "derived_from");
}

export function syncTaskProofLinked(task: { id: string; title: string; status: string; proof_id: string | null }) {
  if (task.status !== "complete" || !task.proof_id) return;

  ensureNodeExists({
    id: task.id,
    type: "task",
    title: task.title,
    ref_path: TASKS_PATH,
  });

  ensureNodeExists({
    id: task.proof_id,
    type: "proof",
    title: task.proof_id,
    ref_path: PROOF_PATH,
    metadata: { task_id: task.id },
  });

  ensureEdgeExists(task.id, task.proof_id, "verified_by");
}
