# Changelog

All notable changes to the CODM Match Analytics Platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-05

### Desktop & Laptop Appearance & Navigation
- **Unified Tactical Sidebar Menu (`Sidebar.jsx`):**
  - **Desktop/Laptop Experience:** Fixed tactical command sidebar (`lg:w-64 xl:w-72`) displaying clan branding, real-time database sync health badge, navigation deck, and quick operation shortcuts (`ROSTER & ALIASES`).
  - **Mobile/Tablet Experience:** Clean full-screen view without bottom tab obstruction; navigation handled exclusively via a responsive slide-out tactical drawer triggered from a header `MENU` button.
  - **Wide Responsive Canvas:** Upgraded the main container from a constrained mobile box to an expansive `max-w-7xl` layout, allowing tables, veto matrices, and match banners to breathe with esports fidelity on 1080p+ displays.

### Maps Tab & Optimal Squad Intelligence
- **Dedicated Maps Module (`MapsTab.jsx`):**
  - Segmented by competitive game mode: **Hardpoint**, **Search & Destroy**, and **Control**.
  - Top mode KPI summary cards tracking active map pool counts, cumulative win rates, and win/loss records.
  - Interactive mode filter pills (`ALL MODES`, `HARDPOINT`, `S&D`, `CONTROL`).
- **Cinematic Map Banner Cards (`MapCard.jsx`):**
  - Inspired by official esports broadcast match bars, displaying high-contrast map photography with dark vignette gradient overlays.
  - Real-time performance metrics: Map win rate %, win/loss record, and average score differential (`+66 AVG DIFF`).
  - Tactical map classification badge (`STRONGHOLD`, `CONTESTED`, `VULNERABLE`).
- **Map Performance Index (MPI) Algorithm & Role Specialization (`mapsAnalytics.js`):**
  - Resolved property naming mismatches that caused `NaN` selection scores and erratic lineup sorting.
  - Top performers (e.g. `Spade>` on Takeoff) correctly lead the starting 5.
  - Dynamic tactical role distribution across the 5 starters (*Primary Slayer*, *OBJ Anchor*, *Entry Fragger*, *Support Flex*, *Flex Operator*) with contextual selection rationale.
  - Fixed blank stats formatting for average score, hill time, and games played.

### Cinematic Match History Banners
- **Banner-Style Match Cards (`MatchBannerCard.jsx`):** Redesigned the entire Match History list with wide, atmospheric map backdrop banners matching the user's reference inspiration:
  - High-impact map name typography in bold uppercase display font with drop shadow.
  - Top-left metadata row: Result badge (`WIN` in neon green / `LOSS` in red), mode, played date, opponent clan tag, and tier chip.
  - Team score vs opponent score (`250 : 229`), our top performer's stats (`48 / 43 / 17 #2`), and prominent score differential (`+73` / `-33`).
  - Click-to-expand drilldown for full team and opponent scoreboards, metadata editing, and 1-click graphic generation.

### Scrim Series Graphic Generator
- **Multi-Map Esports Scrim Card (`ScrimCardModal.jsx`):** High-resolution (2400 × 1350 px, 16:9 Retina) canvas renderer generating broadcast-ready scrim summary graphics for Discord and Twitter/X embeds.
- **Series Score & Progression Header:** Dynamically computes aggregate series outcome (`VICTORY 2-1`, `3-0`, etc.) with customizable Opponent Clan Tag, Our Team Name, and Series Format badges.
- **Map Progression Cards:** Displays every game in the series with Map Name, Game Mode, final scores, Win/Loss indicator, and individual Map MVP fragger highlights.
- **Aggregate Squad Leaderboard:** Combined multi-map stats table calculating Total Kills, Deaths, Series K/D, Assists, Total OBJ Time, Cumulative Score, and Average Impact across all games in the series.
- **Series MVP Spotlight Banner:** Dedicated cyber-frame highlighting the top overall performer across the series with apex fragger badges and stat highlights.
- **Instant Discord Sharing:** 1-click **Copy Image to Clipboard** (`navigator.clipboard.write`) for instant `Ctrl+V` pasting into Discord scrim channels, plus **Download High-Res PNG**.
- **Interactive Multi-Match Selection (`MatchList.jsx`):** Added a dedicated "SELECT SCRIM" toggle mode with checkboxes and a persistent floating bottom bar ("X Maps Selected $\rightarrow$ Generate Scrim Card").
- **Batch Upload Integration (`BatchUploadModal.jsx`):** Direct "Generate Scrim Card" trigger available immediately upon uploading 2+ match screenshots.

### Team Roster & Alias Manager
- **Dedicated Roster & Alias Manager (`AliasManagerModal.jsx`):** Accessible via "ROSTER & ALIASES" in the Player Performance tab and screenshot upload queue.
- **Canonical Player Grouping:** Displays all active team members with their linked raw OCR gamertag variations as tag chips with 1-click unlink/delete.
- **Intelligent Unmapped Name Detection:** Automatically scans match history for unmapped gamertags and shows their match appearance frequencies with a 1-click "Map to Player" assigner.
- **Raw Name Preservation & Instant Auto-Mapping:** Screenshot OCR parser preserves raw gamertags, seamlessly auto-canonicalizes existing aliases, and automatically updates the database when names are modified during review.
- **Backend CRUD Endpoints (`/api/aliases`):** Added `GET /api/aliases/records` for metadata listing and `DELETE /api/aliases/{raw_name}` for unlinking aliases atomically.

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
