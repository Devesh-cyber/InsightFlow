# Module 1 — Authentication / Identity

## Objective

Introduce user identity into InsightFlow V2 without disrupting the existing V1 dataset analysis functionality.

## Authentication Provider

Use Supabase Auth.

Supported authentication methods:

1. Email + Password
2. Google OAuth

## Architecture

Supabase Auth is responsible for:

- User identity
- Authentication
- Sessions
- Access tokens
- Token refresh

InsightFlow must NOT implement its own password authentication system.

## Important Architectural Separation

Authentication and DatasetSession are different concepts.

AuthContext identifies the authenticated user.

DatasetSessionContext identifies the currently active dataset.

Do NOT replace DatasetSessionContext with authentication.

Current V1 analytical functionality must remain operational.

## Module 1 Scope

Implement authentication in controlled steps:

1. Supabase project/provider configuration
2. Frontend Supabase client
3. AuthContext
4. Login page
5. Register page
6. Google OAuth
7. Protected routing
8. Backend token verification
9. Frontend API authentication
10. End-to-end authentication testing

## Explicitly Out of Scope

Do NOT implement the following during Module 1:

- PostgreSQL application tables
- Dataset persistence
- Dataset object storage
- Redis/cache
- Visualization improvements
- Cleaning improvements
- Relationship improvements
- New analytical features
- User profile system
- Billing
- Teams/workspaces
- Admin system

## Environment Variables

Frontend:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Never hardcode credentials.

Never expose a Supabase service-role key in frontend code.

## Dependency

Frontend uses:

@supabase/supabase-js

Do not introduce unnecessary authentication libraries.

## Implementation Discipline

Implement one step at a time.

After each implementation step:

1. Build the frontend.
2. Run lint.
3. Test the implemented functionality.
4. Inspect for regressions.
5. Only then proceed to the next step.

Do not implement future steps automatically.

Do not modify unrelated V1 functionality.

Do not refactor existing architecture unless required for the current authentication step.