# Changelog

All notable changes to the CODM Match Analytics Platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-10-05

### UI / Frontend
- **Composite Map Efficiency Rating (MER):** Introduced a unified multi-metric performance rating that measures how an individual player stacks up against their teammates' average on every map and mode. Mode-aware weights adapt for Hardpoint (K/D, Score, Kills, Hill Time), S&D (K/D, Score, Kills), and Control.
- **Visual Divergence Bar (`DivergenceBar.jsx`):** Added a centered zero-line visual gauge depicting performance divergence relative to the squad baseline:
  - Positive divergence ($\ge +5\%$) renders in Neon Cyan (`#00e5ff`) with glowing endcaps.
  - Elite divergence ($\ge +25\%$) renders in Cyber Gold (`#ffb800`).
  - Negative divergence ($\le -8\%$) renders in Crimson Red (`#ff334b`).
- **Tactical Map Highlight Chips:** Embedded instant "STRONGHOLD" (best map $\Delta\%$) and "VULNERABLE" (lowest map $\Delta\%$) chips directly on player cards for at-a-glance veto intel.
- **Enhanced Map Breakdown Table:** Upgraded the expandable map drilldown to show personal K/D vs. team K/D (`pKd vs tmKd`), win rate, the divergence bar, and tactical tags (`⚡ CARRY`, `🛡️ ANCHOR`, `▲ IMPACT`, `⚖️ PAR`, `⚠️ DRAG`).

---

## [1.0.0] - 2026-10-04

### Database
- **Relational Normalized Schema (`database/schema.sql`):** Created 3-table normalized schema (`matches`, `match_players`, `aliases`) with cascade deletions and composite indexes for fast lookups.
- **Dual-Engine Connection Driver (`database/connection.py`):** Unified driver supporting both local SQLite (`codm.db`) and remote Turso cloud databases via HTTP Hrana (`https://`).
- **Atomic Transactions:** Wrapped multi-step writes (match upsert, player roster replacements, alias updates) in single batched transactions (`execute_batch`) to prevent partial database states on failure.
- **Cloud Migration Tooling (`database/migrate.py`):** Provided idempotent migration script that seeded 23 matches, 217 players, and 59 Hardpoint OBJ records into Turso cloud DB.

### Server
- **Layered FastAPI Architecture:** Modular separation of concerns into Routers (`/api/health`, `/api/matches`, `/api/parse`, `/api/aliases`), Repositories, Schemas, and Services.
- **Gemini OCR Vision Ingestion (`gemini_ocr.py`):** Multi-model fallback pipeline (`gemini-3.5-flash-lite` $\rightarrow$ `gemini-3-flash` $\rightarrow$ `gemini-2.5-flash`) parsing scoreboard screenshots into structured match data.
- **Deterministic Match Deduplication (`dedup.py`):** SHA-1 fingerprinting algorithm generating unique 10-character match IDs from raw timestamps and player stat signatures.
- **12-Factor Configuration (`config.py`):** Migrated raw secrets from legacy `.key` file into standardized `.env` environment variables using `python-dotenv`.
- **Health & Cold-Start Keep-Alive (`/api/health`):** Endpoint reporting real-time database latency and record counts to prevent Render free-tier sleep cycles.
- **CORS Middleware:** Configured secure cross-origin resource sharing allowing requests from GitHub Pages and local development servers.
- **Coding Conventions & Standards:** Enforced strict PEP 8 top-level direct imports across all server and database modules.

### UI / Frontend
- **Cyber-Tactical SPA (`client/`):** Built modern reactive application using React 19, Vite, and Tailwind CSS with military/tactical aesthetics (Rajdhani and Teko fonts, carbon slate backgrounds, neon cyan and cyber gold accents).
- **Esports Analytics Engine (`client/src/engine/`):**
  - **Honors Banner:** Rolling 14-day awards for Top Performer, Top Slayer, Best OBJ, Best Support, and The Clincher.
  - **Tactical Intel:** Slay-to-Win correlation matrix, clutch margin win rate analysis, and opponent match histories.
  - **Map Veto Engine:** Automated map classification (`AUTO-PICK`, `AUTO-BAN`, `CONTESTED`) based on team win rates.
  - **Player Role Classification:** Automated role assignment (*OBJ Anchor*, *Primary Fragger*, *S&D Specialist*, *Support Flex*, *Flex Operator*).
- **Player Roster Module:** Cards and Table views with multi-column sorting (Impact, K/D, KPM, Kill Share %, Net +/-, OBJ Share %, MVPs, Win %).
- **Interactive Match List:** Scoreboard tables displaying full team and opponent rosters, player scores, K/D/A spreads, and OBJ hill times with edit and delete capabilities.
- **Batch Upload Modal (`BatchUploadModal.jsx`):** Multi-image drag-and-drop screenshot uploader with OCR progress feedback, alias correction, and duplicate match alerts.
- **Render Cold-Start Warning:** Built-in connection listener displaying a pulsing waking banner when backend requests exceed 2 seconds.
- **Automated GitHub Pages CI/CD:** GitHub Actions workflow (`.github/workflows/deploy.yml`) building and deploying production assets to GitHub Pages in ~20 seconds on push.
