# InsightFlow — Backend

FastAPI service that powers dataset upload, statistical analysis, cleaning,
and export for InsightFlow. Supabase Auth handles identity, PostgreSQL
stores dataset metadata/ownership, Supabase Storage holds the uploaded
files, and pandas runs the actual analysis in an in-memory runtime session.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then fill in your real Supabase values
```

## Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service role** key — server-side only, bypasses RLS. Never expose this to the frontend or commit it. |

The backend also expects a Supabase Storage bucket named `datasets` and a
Postgres table named `datasets` with (at least) `id`, `user_id`,
`file_name`, `storage_path` columns, matching what `upload_service.py`
writes.

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

The API is served at `http://localhost:8000`. Interactive docs at
`http://localhost:8000/docs`.

## Testing

```bash
pytest tests/ -v
```

10 tests: dataset-ownership/authorization regression tests, boxplot
statistics correctness tests, and a full-stack contract test that walks
overview → health → columns → relationships → visualizations → cleaning
(recommend/preview/apply/history) → export against the real FastAPI app.

Tests run without a live Supabase project by seeding sessions directly
and overriding the auth dependency — see `tests/conftest.py`. The
`/upload`, `/api/auth/register`, and `/api/auth/login` endpoints do call
Supabase for real and aren't covered by this suite; they need a live
Supabase project to exercise end-to-end.

## API shape

All dataset-scoped endpoints (`/overview`, `/health`, `/columns`,
`/relationships`, `/visualizations`, `/cleaning`, `/export`) require an
`Authorization: Bearer <token>` header and only ever return data for
datasets owned by that token's user.
