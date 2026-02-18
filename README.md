# Haro Dashboard (Next.js + Second Brain)

This project has been migrated to **Next.js App Router + TypeScript** while keeping the legacy `server.js` fallback for safety.

## Local run (Node 22)

```bash
npm install
npm run dev
```

Open: `http://127.0.0.1:3000`

Production build check:

```bash
npm run lint
npm run build
npm run start
```

## Routes

- `/dashboard` — mission-control starter shell
- `/second-brain/memories` — reads `MEMORY.md` + `memory/*.md`
- `/second-brain/documents` — reads workspace key docs + repo markdown docs
- `/second-brain/tasks` — reads `.openclaw/tasks.json` in Kanban-ish columns

Each page includes a simple search/filter box.

## API routes (read-only)

- `GET /api/second-brain/memories`
- `GET /api/second-brain/documents`
- `GET /api/second-brain/tasks`

Data is read server-side only; no write endpoints were introduced.

## Legacy fallback (kept intentionally)

Legacy Express app remains available:

```bash
npm run legacy:dev
npm run legacy:start
```

This is retained during migration to avoid breaking existing workflows.

## Environment variables

- `HARO_WORKSPACE_DIR` (default: `/home/ray/.openclaw/workspace`)
- `HARO_TASKS_PATH` (default: `$HARO_WORKSPACE_DIR/.openclaw/tasks.json`)

## Branch & deploy policy

- **Stable branch for live deploys:** `main` when available, otherwise `stable`.
- Feature work should happen in `feat/*` branches and be merged into the stable branch via PR.
- No force-push or history rewrites on the stable branch.
- Deploy only via `scripts/deploy-dashboard.sh` so build + restart + health checks stay consistent.

One-command deploy:

```bash
./scripts/deploy-dashboard.sh
```

Dry run (no write/restart actions):

```bash
./scripts/deploy-dashboard.sh --dry-run
```
