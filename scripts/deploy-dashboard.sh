#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="haro-dashboard.service"
HEALTH_URLS=(
  "http://127.0.0.1:8787/dashboard"
  "http://127.0.0.1:8787/mission-control/decisions"
)

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

if git -C "$REPO_DIR" show-ref --verify --quiet refs/heads/main || git -C "$REPO_DIR" ls-remote --heads origin main | grep -q main; then
  STABLE_BRANCH="main"
else
  STABLE_BRANCH="stable"
fi

run() {
  echo "+ $*"
  if [[ "$DRY_RUN" -eq 0 ]]; then
    "$@"
  fi
}

info() {
  echo "[deploy-dashboard] $*"
}

health_check() {
  local url="$1"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    info "(dry-run) skip health check: $url"
    return 0
  fi

  curl -fsS --max-time 10 "$url" >/dev/null
}

info "repo: $REPO_DIR"
info "stable branch: $STABLE_BRANCH"

if [[ "$DRY_RUN" -eq 0 ]]; then
  git -C "$REPO_DIR" diff --quiet || {
    echo "ERROR: working tree is dirty. Commit/stash before deploy." >&2
    exit 1
  }
fi

PREV_COMMIT="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
CURRENT_BRANCH="$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)"

run git -C "$REPO_DIR" fetch --all --prune
run git -C "$REPO_DIR" checkout "$STABLE_BRANCH"
run git -C "$REPO_DIR" pull --ff-only origin "$STABLE_BRANCH"
run npm --prefix "$REPO_DIR" ci
run env HARO_ASSET_PREFIX=/haro npm --prefix "$REPO_DIR" run build
run systemctl --user restart "$SERVICE_NAME"

for url in "${HEALTH_URLS[@]}"; do
  info "health check: $url"
  if ! health_check "$url"; then
    NEW_COMMIT="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
    cat >&2 <<EOF
ERROR: health check failed for $url
Rollback hint:
  cd "$REPO_DIR"
  git checkout "$STABLE_BRANCH"
  git reset --hard "$PREV_COMMIT"
  npm ci
  HARO_ASSET_PREFIX=/haro npm run build
  systemctl --user restart "$SERVICE_NAME"
Attempted deploy: $CURRENT_BRANCH@$PREV_COMMIT -> $STABLE_BRANCH@$NEW_COMMIT
EOF
    exit 1
  fi
done

DEPLOYED_COMMIT="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
DEPLOYED_BRANCH="$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)"
DEPLOY_STAMP_PATH="${HARO_DEPLOY_STAMP_PATH:-/home/ray/.openclaw/workspace/.openclaw/proof/latest-deploy.txt}"
mkdir -p "$(dirname "$DEPLOY_STAMP_PATH")"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$DEPLOY_STAMP_PATH"

info "deployed: ${DEPLOYED_BRANCH}@${DEPLOYED_COMMIT}"
