import fs from "node:fs";
import path from "node:path";
import { readDecisionsIndex, readTasks, writeTasks } from "@/lib/mission-control-store";
import {
  GraphNode,
  ensureEdgeExists,
  ensureNodeExists,
  getAdjacencyList,
  getNode,
  getNodesByType,
  syncTaskCreated,
} from "@/lib/graph-store";

type AmbitionDomain = "identity" | "wealth" | "health" | "intellect" | "lifestyle" | "family";
type AmbitionHorizon = "long_term" | "mid_term";
type AmbitionStatus = "active" | "paused";

type ExperienceCategory = "recipe" | "travel" | "movie" | "game" | "book" | "restaurant" | "other";
type Priority = "low" | "medium" | "high";
type ExperienceStatus = "queued" | "scheduled" | "completed";

type InsightSourceType = "podcast" | "book" | "article" | "conversation" | "other";
type InsightCategory = "psychology" | "business" | "leadership" | "life" | "other";

const ambitionDomains: AmbitionDomain[] = ["identity", "wealth", "health", "intellect", "lifestyle", "family"];
const ambitionHorizons: AmbitionHorizon[] = ["long_term", "mid_term"];
const ambitionStatuses: AmbitionStatus[] = ["active", "paused"];
const experienceCategories: ExperienceCategory[] = ["recipe", "travel", "movie", "game", "book", "restaurant", "other"];
const priorities: Priority[] = ["low", "medium", "high"];
const experienceStatuses: ExperienceStatus[] = ["queued", "scheduled", "completed"];
const sourceTypes: InsightSourceType[] = ["podcast", "book", "article", "conversation", "other"];
const insightCategories: InsightCategory[] = ["psychology", "business", "leadership", "life", "other"];

function mustBeOneOf<T extends string>(value: string, allowed: T[], field: string): T {
  if (!allowed.includes(value as T)) throw new Error(`invalid ${field}`);
  return value as T;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listBrainState() {
  const ambitions = getNodesByType("ambition");
  const experiences = getNodesByType("experience").map((node) => {
    const lastUpdated = typeof node.metadata.last_status_at === "string" ? node.metadata.last_status_at : node.created_at;
    const ageMs = Date.now() - new Date(lastUpdated).getTime();
    const stale = ageMs > 365 * 24 * 60 * 60 * 1000;
    return { ...node, stale };
  });

  const insights = getNodesByType("insight").map((node) => {
    const linkedAmbitionId = typeof node.metadata.linked_ambition_id === "string" ? node.metadata.linked_ambition_id : "";
    const unanchored = !linkedAmbitionId && Date.now() - new Date(node.created_at).getTime() > 30 * 24 * 60 * 60 * 1000;
    return { ...node, unanchored };
  });

  const graph = getAdjacencyList();
  const conversionLog = graph.edges
    .filter((edge) => edge.relation === "implemented_by" || edge.relation === "verified_by")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map((edge) => {
      const from = graph.nodes.find((n) => n.id === edge.from);
      const to = graph.nodes.find((n) => n.id === edge.to);
      return {
        id: edge.id,
        relation: edge.relation,
        created_at: edge.created_at,
        from: from ? { id: from.id, title: from.title, type: from.type } : { id: edge.from },
        to: to ? { id: to.id, title: to.title, type: to.type } : { id: edge.to },
      };
    });

  return { ambitions, experiences, insights, conversionLog };
}

export function createAmbition(input: {
  title: string;
  domain: string;
  horizon: string;
  status?: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("title is required");

  const domain = mustBeOneOf(input.domain, ambitionDomains, "domain");
  const horizon = mustBeOneOf(input.horizon, ambitionHorizons, "horizon");
  const status = mustBeOneOf(input.status || "active", ambitionStatuses, "status");

  return ensureNodeExists({
    id: makeId("ambition"),
    type: "ambition",
    title,
    ref_path: null,
    metadata: { domain, horizon, status },
  });
}

export function createExperience(input: {
  title: string;
  category: string;
  priority?: string;
  status?: string;
  linked_ambition_id?: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("title is required");

  const category = mustBeOneOf(input.category, experienceCategories, "category");
  const priority = mustBeOneOf(input.priority || "medium", priorities, "priority");
  const status = mustBeOneOf(input.status || "queued", experienceStatuses, "status");

  const linkedAmbitionId = (input.linked_ambition_id || "").trim();
  if (linkedAmbitionId && !getNode(linkedAmbitionId)) throw new Error("linked_ambition_id not found");

  const experience = ensureNodeExists({
    id: makeId("experience"),
    type: "experience",
    title,
    ref_path: null,
    metadata: {
      category,
      priority,
      status,
      linked_ambition_id: linkedAmbitionId || undefined,
      last_status_at: new Date().toISOString(),
    },
  });

  if (linkedAmbitionId) {
    ensureEdgeExists(experience.id, linkedAmbitionId, "inspired_by");
  }

  return experience;
}

export function updateExperienceStatus(id: string, status: string) {
  const node = getNode(id);
  if (!node || node.type !== "experience") throw new Error("experience not found");
  const nextStatus = mustBeOneOf(status, experienceStatuses, "status");

  const nextNode: GraphNode = {
    ...node,
    metadata: {
      ...node.metadata,
      status: nextStatus,
      last_status_at: new Date().toISOString(),
    },
  };

  const graph = getAdjacencyList();
  const nextNodes = graph.nodes.map((item) => (item.id === id ? nextNode : item));

  const workspaceDir = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
  const nodesPath = path.join(workspaceDir, ".openclaw", "graph", "nodes.json");
  fs.writeFileSync(nodesPath, `${JSON.stringify({ nodes: nextNodes }, null, 2)}\n`, "utf8");

  return nextNode;
}

export function createInsight(input: {
  title: string;
  source_type: string;
  source_title: string;
  source_reference?: string;
  category?: string;
  actionable?: boolean;
  linked_ambition_id?: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("title is required");
  if (title.length >= 200) throw new Error("insight must be atomic (<200 chars)");

  const sourceType = mustBeOneOf(input.source_type, sourceTypes, "source_type");
  const sourceTitle = input.source_title.trim();
  if (!sourceTitle) throw new Error("source_title is required");
  const category = mustBeOneOf(input.category || "other", insightCategories, "category");

  const linkedAmbitionId = (input.linked_ambition_id || "").trim();
  if (linkedAmbitionId && !getNode(linkedAmbitionId)) throw new Error("linked_ambition_id not found");

  const insight = ensureNodeExists({
    id: makeId("insight"),
    type: "insight",
    title,
    ref_path: null,
    metadata: {
      source_type: sourceType,
      source_title: sourceTitle,
      source_reference: input.source_reference?.trim() || "",
      category,
      actionable: input.actionable !== false,
      linked_ambition_id: linkedAmbitionId || undefined,
    },
  });

  if (linkedAmbitionId) {
    ensureEdgeExists(linkedAmbitionId, insight.id, "supports");
  }

  return insight;
}

export function convertInsightToAction(insightId: string) {
  const node = getNode(insightId);
  if (!node || node.type !== "insight") throw new Error("insight not found");
  if (node.metadata.actionable !== true) throw new Error("insight is not actionable");

  const decisions = readDecisionsIndex();
  const decisionId = decisions.keys().next().value || "default-decision";
  const tasksFile = readTasks();
  const now = new Date().toISOString();
  const task = {
    id: `task-${Date.now()}`,
    title: node.title,
    status: "pending" as const,
    decision_id: decisionId,
    proof_id: null,
    created_at: now,
    updated_at: now,
  };

  writeTasks({ ...tasksFile, tasks: [...tasksFile.tasks, task], updated_at: now });
  syncTaskCreated(task);
  ensureEdgeExists(node.id, task.id, "implemented_by");

  return { insight: node, task };
}
