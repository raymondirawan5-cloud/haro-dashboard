# Haro Dashboard (MVP)

Local dashboard to view what Haro did daily/weekly.

## Run locally

```bash
npm install
npm run start
```

Then open:
- http://127.0.0.1:8787

## Data source

Reads JSONL events from Haro workspace:
- `/home/ray/.openclaw/workspace/.openclaw/worklog.jsonl`

You can override with env:
- `HARO_WORKSPACE_DIR`
- `HARO_WORKLOG_PATH`
