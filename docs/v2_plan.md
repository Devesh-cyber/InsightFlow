InsightFlow V2 — Master Development Roadmap
0. Project Context
Current state

InsightFlow V1 is a working, deployed data-analysis web application.

Current V1 flow:

User
 ↓
Upload CSV/XLSX
 ↓
Backend creates dataset session
 ↓
Dataset held in backend memory
 ↓
User analyzes dataset
 ↓
Overview
Health
Columns
Relationships
Visualizations
Cleaning
Export

V1 currently uses a session/in-memory architecture.

This works for the current prototype but creates important limitations:

Dataset/session can disappear after backend restart.
Refresh/session lifecycle is fragile.
Users cannot access previous datasets/work.
Multiple users cannot have proper isolated persistent workspaces.
Large datasets may be repeatedly loaded/processed.
Analysis results can be recomputed unnecessarily.
Current deployment architecture is not yet a proper SaaS persistence architecture.
V2 objective

Transform InsightFlow from a working session-based application into a persistent, user-aware SaaS foundation while preserving the existing V1 analytical functionality.

1. V2 Core Principles

These rules apply to the entire V2 development cycle.

Rule 1 — Protect V1

Do not break the currently deployed V1 workflow.

Existing functionality must continue working:

Upload
Overview
Health
Columns
Relationships
Visualizations
Cleaning
Cleaning History
Export
Rule 2 — No unnecessary rewrites

Existing analysis logic should not be rewritten unless a V2 module genuinely requires it.

Rule 3 — Backend remains authoritative

The frontend must not invent analytical calculations.

Rule 4 — Persistent storage replaces temporary session ownership

The database/storage layer becomes the source of persistence.

Runtime memory/cache can still be used for performance.

Rule 5 — Implement incrementally

Never implement multiple major infrastructure modules simultaneously.

Rule 6 — Every module must be tested before continuing
Plan
 ↓
Architecture discussion
 ↓
Implementation
 ↓
Tests
 ↓
Manual/browser verification
 ↓
Git commit
 ↓
Next module
Rule 7 — No speculative features

If a feature isn't explicitly part of the V2 roadmap, don't add it.

2. V2 Architecture Direction

The target architecture is:

                         ┌───────────────────┐
                         │     Frontend      │
                         │      React        │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      FastAPI      │
                         │      Backend      │
                         └─────────┬─────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
       Authentication          PostgreSQL              Cache
             │                     │                     │
             │                     │                     │
             ▼                     ▼                     ▼
          User ID              Metadata             Runtime data
                                   │
                                   ▼
                            Object Storage
                                   │
                                   ▼
                              CSV / XLSX

The important separation is:

PostgreSQL
    =
metadata + relationships + ownership

Object Storage
    =
actual dataset files

Cache
    =
temporary fast-access data/results
3. Module 1 — Authentication / Identity
Goal

Give every user a persistent identity.

Current:

anonymous user
     ↓
dataset session

V2:

user
 ↓
authenticated identity
 ↓
user-owned datasets
Scope

Implement:

User registration
Login
Logout
Authentication state
Persistent user identity
Protected API requests
Backend user identification
User ownership foundation
Not in scope yet
Google OAuth
GitHub OAuth
Teams
Organizations
Roles
Admin dashboard
Billing
Subscription system
Target result

Backend can reliably answer:

Who is making this request?

and frontend knows:

Which user is currently logged in?
4. Module 2 — Database Foundation
Goal

Introduce persistent metadata storage.

Recommended direction:

PostgreSQL

Potential initial entities:

users
datasets

Possibly session/workspace metadata depending on architecture discovered during implementation.

Dataset metadata

Something conceptually similar to:

dataset
├── id
├── user_id
├── filename
├── storage_path
├── file_type
├── rows
├── columns
├── created_at
└── updated_at

Exact schema will be finalized during the module architecture discussion, not assumed beforehand.

Important

The database should not become a replacement for Pandas.

It stores application metadata.

5. Module 3 — Dataset Object Storage
Goal

Persist the actual uploaded files.

Recommended direction:

Supabase Storage

or another object-storage service if architecture evaluation shows a better option.

Target:

User
 ↓
Upload
 ↓
Object Storage
 ↓
CSV/XLSX

Database stores:

dataset_id
user_id
storage_path
metadata
Important

We must establish:

File ownership
Unique dataset IDs
Storage paths
Upload lifecycle
Retrieval
Deletion strategy
File-size constraints
Access control
6. Module 4 — Persistent Dataset Lifecycle

This is where V1's current session model gets transitioned.

Current:

upload
 ↓
memory
 ↓
session

Target:

upload
 ↓
database metadata
 ↓
object storage
 ↓
runtime session/cache

The runtime session may still exist.

The difference is:

The session is no longer the only source of truth.

If the backend restarts:

Before V2:

Dataset → gone

After V2:

Dataset
 ↓
Storage
 ↓
metadata in DB
 ↓
can be reconstructed

This module will be particularly important because it connects the first three modules.

7. Module 5 — Dataset Library / Previous Work

Once users and datasets are persistent, users should be able to access previous work.

Target:

Dashboard / My Datasets

My Datasets
─────────────────────

train.csv
2,500 rows
Uploaded Aug 28

customer_data.csv
18,200 rows
Uploaded Aug 25

sales.xlsx
7,300 rows
Uploaded Aug 20
Scope
List user's datasets
Dataset metadata
Open previous dataset
Delete dataset
Select active dataset
Ownership enforcement
Not yet

Don't turn this into a huge project/workspace system.

Keep it simple.

8. Module 6 — Runtime Dataset Cache

Now introduce caching for performance.

The basic idea:

Request
 ↓
Is dataset already loaded?
 ├── YES → use memory
 │
 └── NO
       ↓
   Storage
       ↓
   Load dataset
       ↓
   Cache

This prevents repeated:

Storage → download → pandas.read_*

operations.

Cache requirements

We need to define:

Cache key
TTL
Maximum memory usage
Eviction policy
Dataset lifecycle
Behavior after cleaning
Behavior after server restart

The exact technology should be decided during the module discussion.

We should not automatically assume Redis.

For V2's initial scale, we should evaluate whether an in-process cache is enough or whether an external cache is justified.

9. Module 7 — Analysis Result Cache

After dataset caching works, introduce result caching.

Potential keys:

overview:{dataset_id}

health:{dataset_id}

columns:{dataset_id}

relationship:{dataset_id}:{column_a}:{column_b}

visualization:{dataset_id}:{parameters}

Target:

Request
 ↓
Result cache?
 ├── HIT → return result
 │
 └── MISS
       ↓
   analysis
       ↓
   cache result
       ↓
   response
Critical requirement

Cache invalidation.

When the dataset changes:

Cleaning
 ↓
Dataset modified
 ↓
Invalidate dependent caches

We should not allow stale analysis to appear after cleaning.

10. Module 8 — Session / Cache Architecture Cleanup

Once persistence + caching are working, revisit the existing session architecture.

The goal isn't necessarily to delete the session concept.

Instead:

Persistent Layer
       ↓
Database + Storage
       ↓
Runtime Layer
       ↓
Session + Cache

The runtime session becomes an optimization/state layer rather than the permanent storage mechanism.

This module should specifically investigate:

What currently lives in get_session()
What should remain runtime-only
What should move to DB
What should be loaded from storage
What should be cached
Dataset reconstruction after restart
11. Module 9 — Visualization & Performance V2

Only after the infrastructure is stable.

Now we can return to the areas we intentionally left imperfect in V1.

Visualization improvements
Better Plotly UX
Better chart layouts
Better responsiveness
Better tooltips
Better axis handling
Better handling of large datasets
Better boxplot presentation
More polished chart selection UI
Performance

Investigate:

Dataset size
 ↓
Processing time
 ↓
Serialization
 ↓
Network payload
 ↓
Frontend rendering

We should measure before optimizing.

No random optimization.

12. Module 10 — V2 Analytical UX Improvements

After infrastructure and visualization:

Potential improvements:

Cleaning
Better operation UX
Better preview
Better history
Better feedback
Relationships
Better visual interpretation
Better explanation of results
Health
More useful quality presentation
Columns
Better exploration
Better statistical presentation

These are UX/analytical improvements, not infrastructure.

13. Module 11 — SaaS Hardening

Once the product works with persistent users:

Security
Authentication validation
Authorization
Dataset ownership
Secure file access
Upload validation
API protection
Secret management
Reliability
Error handling
Storage failures
DB failures
Cache failures
Dataset corruption
Large file handling
Observability

Only introduce what is actually needed.

14. Module 12 — Production Readiness

Final V2 stage:

Frontend
 ↓
Backend
 ↓
Database
 ↓
Storage
 ↓
Cache

Evaluate:

Deployment architecture
Environment variables
Production CORS
Database migrations
Storage policies
Resource limits
Performance
Error monitoring
Backup/recovery
Basic security review
V2 Dependency Order

This is the most important part.

                ┌──────────────┐
                │ V1 FREEZE    │
                └──────┬───────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 1. Authentication│
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 2. PostgreSQL   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 3. Object Store │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 4. Dataset      │
              │    Persistence  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 5. Dataset      │
              │    Library      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 6. Dataset Cache│
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 7. Result Cache │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 8. Session      │
              │    Architecture │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 9. Visualization│
              │    + Performance│
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 10. Analytical  │
              │     UX          │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 11. Hardening   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ 12. Production  │
              └─────────────────┘
Development Protocol With Antigravity

This is where I would make a major change from how we worked on V1.

For every major module, we follow this exact process.

Phase A — Understand

You come here first.

We discuss:

What are we adding?
Why?
What currently exists?
What files are involved?
What should NOT change?
What architecture should we use?
What are the risks?
Phase B — File-level plan

Before touching code, we identify:

File
 ↓
What changes
 ↓
Why

For example:

backend/app/core/database.py
→ new DB connection layer
→ centralize database access

backend/app/models/dataset.py
→ dataset metadata model
→ represent persistent datasets

frontend/src/api/auth.ts
→ auth requests
→ frontend authentication communication

Exact files will be determined from the actual repository at that point.

Phase C — Antigravity prompt

Only then do we create the implementation prompt.

The prompt will explicitly say:

DO NOT modify unrelated functionality.

DO NOT rewrite existing analysis logic.

DO NOT invent backend endpoints.

DO NOT introduce additional features.

Follow the approved architecture.

Stop after implementation and verification.
Phase D — Implementation

Antigravity implements only that module.

Phase E — Testing

We test:

Backend
Frontend
API
Integration
Edge cases
Existing V1 functionality
Phase F — Review

We inspect:

git diff
git status
tests
build
lint
Phase G — Commit

Only after successful verification:

git commit
git push
Phase H — Freeze

Module is considered complete.

Then we move to the next module.

V2 Scope Boundary

To prevent Antigravity from hallucinating the roadmap, explicitly include this section in the MD.

Not currently planned

The following are not part of the current V2 infrastructure sprint:

AI chatbot
AI-generated insights
Automated ML
Predictive modeling
Team collaboration
Organizations
Billing
Subscription plans
Payments
Marketplace
Mobile application
GitHub integration
Google Drive integration
Advanced RBAC
Complex project management
Multi-tenant enterprise architecture

These may be considered in future versions, but must not be implemented unless explicitly added to the roadmap.

The Version Strategy

I would label what we're doing carefully.

V1

Working analytical product

Upload
→ Analyze
→ Clean
→ Visualize
→ Export
V2

Persistent SaaS foundation

Identity
+
Persistence
+
Storage
+
Caching
+
Dataset history
+
Performance
V2.5 / later

Product refinement

Better visualization
Better UX
Better analytics
Better performance
V3+

Potentially:

AI insights
ML
Collaboration
Projects
Teams
Billing
etc.

This prevents V2 from becoming another massive rewrite.