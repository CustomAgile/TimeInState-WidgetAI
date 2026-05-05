# Setup Guide — Time In State

End-to-end setup for the Time In State widget — auth, dev harness, and deployment.

## Prerequisites

- Node 18+ and npm
- A Rally workspace and project you can access
- A Rally API key (instructions below)

## 1. Generate a Rally API key

1. Sign in to Rally.
2. Open the API key page: **<https://rally1.rallydev.com/#/api_key>** (or click your avatar → API Keys).
3. Click **Create**, give the key a name (e.g. `widget-dev`), pick the workspaces it can access, and copy the full key. It starts with `_` and is ~43 chars long.
4. Treat it like a password — don't paste it into anything that gets committed.

## 2. Configure auth (pick one)

The Vite dev server proxies both `/slm/*` (WSAPI) and `/analytics/*` (Lookback API) to Rally. It needs a server URL and an API key.

### Option A — `auth.json` (per-widget, gitignored)

Create `auth.json` in the widget folder:

```json
{
  "server": "https://rally1.rallydev.com",
  "apiKey": "_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

`auth.json` is in the root `.gitignore`, so it never gets committed.

### Option B — environment variables / `.env.local`

```bash
export RALLY_SERVER=https://rally1.rallydev.com
export RALLY_API_KEY=_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or create `.env.local` in the widget folder (Vite picks it up automatically):

```dotenv
RALLY_SERVER=https://rally1.rallydev.com
RALLY_API_KEY=_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Restart `npm run dev` after changing either source.**

## 3. Run the dev server

```bash
npm run dev
```

Opens at **http://localhost:5175** (mock data by default).

The dev server uses mock data unless you append `?live=true` to the URL. Mock data includes 12 stories, 5 defects, 5 tasks, 3 test cases, and 3 portfolio items with realistic state-duration distributions.

## 4. Switch to live Rally data

In the browser, add `?live=true` to the URL:

```
http://localhost:5175/?live=true
```

This tells the app to use the real Rally provider instead of mock data. The proxy routes Lookback API calls via `/analytics/*` to your Rally server.

> **Important:** The Lookback API requires a valid Rally workspace. The widget automatically determines the workspace OID from `$RallyContext.GlobalScope.Workspace`. If the workspace OID is missing (common in dev), it falls back to a WSAPI call.

## 5. Configure settings

In the dev server, click the gear icon in the DevHarness toolbar to toggle Edit Mode. The settings panel lets you change:

- **Artifact Type** — Stories, Defects, Tasks, TestCases, or Portfolio Items
- **Start / End Dates** — the snapshot query window (default: 90 days)
- **States to Show** — comma-separated list of state values (leave empty for all)

Settings are saved to localStorage in dev mode.

## 6. Deploy to Rally

```bash
npx widget-ai deploy
```

This builds the production IIFE bundle and registers it as a Custom View in Rally.

The deployed widget reads `$RallyContext.GlobalScope.Workspace` to determine the Lookback workspace endpoint automatically — no configuration needed in Rally.

## Common issues

### Empty chart after switching to live

The Lookback query window may not contain snapshots. Try widening the date range in settings (Edit Mode → Start Date / End Date).

### Lookback returns HTTP 401

The API key does not have Lookback API access. Rally's Lookback API requires the key to have "Analytics API" permission — check the key permissions at **<https://rally1.rallydev.com/#/api_key>**.

### "cannot determine workspace OID"

The widget could not resolve the workspace from `$RallyContext`. This usually means the widget is running outside Rally without a mock context. Ensure `auth.json` is present and you're running `npm run dev` with a valid key.

### Large date ranges are slow

Lookback queries with many artifacts and a wide date window can return thousands of snapshots. Consider narrowing the date range or filtering states in settings to reduce query volume.

---

## Reference

- [Rally Lookback API docs](https://rally1.rallydev.com/analytics/doc)
- [widget-ai package README](../../packages/create-widget/README.md)
- [wsjf-grid setup guide](../../examples/wsjf-grid/docs/setup-guide.md) — same auth setup for WSAPI-based widgets
