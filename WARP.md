# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project status overview
- This repository currently contains documentation only (see docs/). The codebase described below is the intended structure and toolchain. Use these commands and notes once the corresponding components (backend/, web_portal/, client/, docker-compose.yml) are scaffolded.

Key architecture (big picture)
- Three primary components
  - Desktop Client (Windows, C#/.NET WPF)
    - Integrates with Steam via SteamKit2
    - Adds game entries by placing .manifest and .lua into Steam/config/st and Steam/config/depotcache
    - Talks to Backend via JWT-authenticated HTTP
  - Backend API (Node.js + Express)
    - MongoDB (primary), Redis (sessions/cache)
    - Exposes REST endpoints for auth, games, downloads, VIP, payments, admin
    - Generates signed/temporary download URLs, proxies to GitHub branches {appId}.zip
    - Enforces single active session per user (invalidate prior sessions)
    - Handles SePay webhook (idempotent by sepay_id; IP allowlist; bearer auth; timestamp checks)
  - Web Portal (React)
    - Game catalog, auth, VIP purchase via balance, admin dashboard (not public)
- Data layer
  - MongoDB collections: users, games, transactions, vip_packages, gift_codes, audit_logs, sessions, user_library, translations, notifications
  - Redis: sessions, game/steam metadata cache, download URL cache, rate limit counters
- Critical rules and flows
  - Access rules: is_free, free_until, requires_vip checked per request
  - Balance vs points: balance for VIP; points for games/items; points can convert to balance, not vice versa
  - Payments: bank transfer via SePay; username parsed from transfer content; atomic balance/points update
  - Downloads: validate access → signed URL → fetch GitHub archive of branch {appId} → client extracts and places files → cleanup

Common commands and workflows (PowerShell on Windows)
Note: Run these when the described directories and files exist. Replace tool-invocations with your actual package manager/targets if they differ.

Global prerequisites
- Node.js 18+, npm 9+
- .NET SDK 6+ (for client)
- Docker Desktop (for local MongoDB/Redis and optional services)

Repository-first steps
- If present, start local infra and dev services
  - docker compose up -d
  - Verify: docker compose ps
- If env templates exist, copy them and configure
  - Copy-Item backend/.env.example backend/.env
  - Copy-Item web_portal/.env.example web_portal/.env

Backend API (Node.js / Express) — folder: backend/
- Install deps
  - npm ci
- Start dev server (hot reload, if configured)
  - npm run dev
- Run tests
  - All tests: npm test
  - Single test file: npx jest src/path/to/file.test.ts
  - Single test by name: npx jest -t "name or regex"
- Lint and format (if configured)
  - Lint: npx eslint .
  - Fix: npx eslint . --fix
  - Format: npx prettier . --check | npx prettier . --write
- Useful env variables (typical)
  - MONGODB_URI, REDIS_URL, JWT_SECRET, SEPAY_API_KEY, ALLOWED_WEBHOOK_IPS

Web Portal (React) — folder: web_portal/
- Install deps
  - npm ci
- Run dev server
  - npm run dev
- Build production
  - npm run build
- Run tests
  - All tests: npm test
  - Single test file: npx jest src/components/MyComp.test.tsx
  - Update snapshots (if used): npx jest -u
- Lint/format (if configured)
  - npx eslint .
  - npx eslint . --fix
  - npx prettier . --write

Desktop Client (C# WPF, .NET 6+) — folder: client/
- Build solution
  - dotnet build TramGame.sln -c Debug
- Run tests (if test projects exist)
  - dotnet test
  - Single test: dotnet test --filter FullyQualifiedName~Namespace.Class.Method
- Package/installer (if WiX or similar is included)
  - Follow scripts in scripts/build or TramGame.Installer project; e.g.: .\scripts\build\build-installer.bat

Local databases and cache (via Docker Compose)
- Start services (MongoDB, Redis, backend, web if defined)
  - docker compose up -d
- View logs for a service
  - docker compose logs -f backend
- Stop all
  - docker compose down

Running a single end-to-end flow (once components exist)
- Start infra and servers
  - docker compose up -d
  - Start backend: in backend/, npm run dev
  - Start web: in web_portal/, npm run dev
  - Launch client from Visual Studio or dotnet run (if a runnable project is provided)
- Test payment webhook locally (example)
  - Invoke-WebRequest -Uri http://localhost:PORT/api/v1/payments/webhook -Method POST -Headers @{ Authorization = "Bearer {{SEPAY_API_KEY}}" } -Body (Get-Content .\mock\sepay_webhook.json -Raw) -ContentType 'application/json'
- Download flow (happy path)
  - Login to obtain JWT → GET /api/v1/games → GET /api/v1/downloads/{appId} → client downloads/extracts → copies .manifest to Steam\config\st\ and .lua to Steam\config\depotcache\

File map to authoritative docs (read these first)
- docs/PRD.md — product scope, personas, feature set, constraints
- docs/_system_architecture.md — system and data flow diagrams, environment topology
- docs/_file-structure.md — intended repo layout and per-component responsibilities
- docs/_database_schema.md — MongoDB collections, indexes, constraints
- docs/_data_flow_and_architecture_rationale.md — step-by-step flows, rationale, caching strategy
- docs/_modules_and_functions.md — module-level contracts, inputs/outputs, and business rules

Conventions and guardrails specific to this project
- Single-session policy: on login, invalidate any prior active session for the same user
- Payments: ensure idempotency on sepay_id; reject if duplicate; parse username from transfer content; protect webhook via IP allowlist + Authorization bearer + timestamp window
- Access control: enforce requires_vip, is_free, free_until on every protected read and download
- Downloads: always issue temporary signed URLs; never expose raw storage locations; proxy GitHub branch archives by {appId}.zip
- Steam integration (client): detect Steam path, validate running state, copy files to the exact Steam directories listed in the docs, and perform cleanup on exit

What’s missing today and how to proceed
- There is no source code in this repository yet. To get productive:
  - Scaffold backend/, web_portal/, and client/ as described in docs/_file-structure.md
  - Add docker-compose.yml with MongoDB and Redis (and optionally backend/web services) to match docs/_system_architecture.md
  - Create .env.example files for backend and web with the environment variables referenced above
  - Implement modules and routes following docs/_modules_and_functions.md and docs/_database_schema.md

If a WARP.md already exists in the future
- Consolidate any duplicated command sections
- Keep only repo-specific commands and flows; avoid generic guidance
- Ensure this file remains the single source of truth for:
  - How to run, test, and lint each component in this repo
  - The end-to-end flows (auth → payment → VIP → download) and their guardrails
  - Where to find authoritative docs in docs/

