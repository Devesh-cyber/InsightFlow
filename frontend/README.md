# InsightFlow — Frontend

React 19 + TypeScript + Vite frontend for InsightFlow, an evidence-first
data analysis tool: upload a CSV/XLSX, understand it (overview, health,
column diagnostics, relationships, visualizations), then clean it with a
preview-before-apply workflow, and export the result.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # then fill in your real values
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the InsightFlow backend (e.g. `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** (public) key — safe for the frontend |

## Running

```bash
npm run dev
```

Opens on `http://localhost:5173` by default.

## Building

```bash
npm run build   # runs `tsc -b` then `vite build`
```

Output goes to `dist/`.

## Linting

```bash
npm run lint
```

## Project structure

```
src/
  components/
    layout/    — AppShell, Sidebar, Topbar, ProtectedRoute, RequiresDataset
    ui/        — Button, Card, Table, Badge, LoadingState, ErrorState, EmptyState, Modal, Select, ProgressBar, StatCard
    charts/    — ChartRenderer (Plotly, dispatches on the backend's chart_type)
  context/     — AuthContext (Supabase session + backend login), DatasetContext (active dataset)
  lib/
    api/       — one file per backend resource (auth, upload, overview, health, columns, relationships, visualizations, cleaning, exportDataset)
    types/     — TypeScript types mirroring the backend's Pydantic response models
    errors.ts, format.ts, supabaseClient.ts
  pages/       — one page per route
```

## Authentication

- Email/password: the frontend calls the backend's `/api/auth/login`
  (which proxies to Supabase Auth) and then hydrates the Supabase JS
  client's own session via `supabase.auth.setSession()` using the
  `refresh_token` the backend returns, so the SDK can transparently
  refresh the access token going forward.
- Google OAuth: goes through the Supabase JS client directly
  (`supabase.auth.signInWithOAuth`); `AuthContext` picks up the resulting
  session via `onAuthStateChange`.
- A 401 from any backend call clears the local session automatically
  (see the `client.ts` response interceptor + `AuthContext`'s listener).

## Dataset lifecycle

`DatasetContext` holds the single active `dataset_id` (plus filename/row/
column counts) returned by `/upload`, persisted in `localStorage` so a
refresh doesn't lose it. Every analysis page reads from this context —
there is exactly one source of truth for "which dataset am I looking
at," matching the backend's single canonical dataset ID.
