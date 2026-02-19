#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="${HARO_WORKSPACE_DIR:-/home/ray/.openclaw/workspace}"
PROOF_PATH="${HARO_PROOF_PATH:-$WORKSPACE_DIR/.openclaw/proof/latest.json}"
DEPLOY_STAMP_PATH="${HARO_DEPLOY_STAMP_PATH:-$WORKSPACE_DIR/.openclaw/proof/latest-deploy.txt}"
TASKS_PATH="${HARO_TASKS_PATH:-$WORKSPACE_DIR/.openclaw/tasks.json}"

mkdir -p "$(dirname "$PROOF_PATH")"

COMMITS_JSON="$(git -C "$REPO_DIR" log -n 20 --pretty=format:'{"hash":"%H","short":"%h","date":"%cI","subject":"%f"}' | sed 's/$/,/' | tr -d '\n' | sed 's/,$//' | awk '{print "["$0"]"}')"
if [[ -z "$COMMITS_JSON" || "$COMMITS_JSON" == "[]" ]]; then
  COMMITS_JSON="[]"
fi

LATEST_DEPLOY=""
if [[ -f "$DEPLOY_STAMP_PATH" ]]; then
  LATEST_DEPLOY="$(cat "$DEPLOY_STAMP_PATH")"
fi

TASK_PROOFS="[]"
if [[ -f "$TASKS_PATH" ]]; then
  TASK_PROOFS="$(node -e '
const fs = require("fs");
const tasksPath = process.argv[1];
const commits = JSON.parse(process.argv[2]);
const out = [];
try {
  const data = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const commitRef = commits[0] ? commits[0].short : "manual";
  for (const task of tasks) {
    if (!task || !task.id) continue;
    const ref = task.proof_id || commitRef;
    const type = String(ref).includes("deploy") ? "deploy" : (String(ref).includes("manual") ? "manual" : "commit");
    out.push({ task_id: task.id, proof_type: type, reference: String(ref) });
  }
} catch {}
process.stdout.write(JSON.stringify(out));
' "$TASKS_PATH" "$COMMITS_JSON")"
fi

node -e '
const fs = require("fs");
const path = process.argv[1];
const commits = JSON.parse(process.argv[2]);
const latestDeploy = process.argv[3];
const taskProofs = JSON.parse(process.argv[4]);
let current = { commits: [], deployments: [], task_proofs: [] };
if (fs.existsSync(path)) {
  try { current = JSON.parse(fs.readFileSync(path, "utf8")); } catch {}
}
const deployments = Array.isArray(current.deployments) ? [...current.deployments] : [];
if (latestDeploy && !deployments.some((d) => d && d.timestamp === latestDeploy)) {
  deployments.push({ timestamp: latestDeploy, source: "deploy-dashboard.sh" });
}
const dedupTask = new Map();
for (const item of [...(Array.isArray(current.task_proofs) ? current.task_proofs : []), ...taskProofs]) {
  if (!item || !item.task_id || !item.reference || !item.proof_type) continue;
  dedupTask.set(`${item.task_id}:${item.reference}:${item.proof_type}`, item);
}
const next = {
  generated_at: new Date().toISOString(),
  commits,
  deployments,
  task_proofs: Array.from(dedupTask.values()),
};
fs.writeFileSync(path, JSON.stringify(next, null, 2) + "\n", "utf8");
' "$PROOF_PATH" "$COMMITS_JSON" "$LATEST_DEPLOY" "$TASK_PROOFS"

echo "Updated $PROOF_PATH"
