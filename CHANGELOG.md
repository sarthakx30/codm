# Changelog

All notable changes to the CODM Match Analytics Platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-06

### Color Palette & Theme Convergence
- **Centralized Design System (`theme.js` & `@theme` in `index.css`):**
  - Created single source of truth in [theme.js](file:///c:/Users/Sarthak/Projects/codm/client/src/config/theme.js) with `PALETTE` tokens and reusable `THEME_CLASSES`.
  - Registered Tailwind CSS v4 color tokens via `@theme` in [index.css](file:///c:/Users/Sarthak/Projects/codm/client/src/index.css).
  - Refactored all components, analytics engines, Canvas renderers, and SVG components to consume the unified palette.
- **CODM Gold & Black Theme:**
  - Integrated the classic Call of Duty: Mobile palette: Prestige Gold (`#f5b700` / `#ffd700`), Stencil White (`#ffffff`), and Carbon Black (`#080c14` to `#161e2e`).
  - Replaced legacy cyan styling with gold across headers, navigation decks, buttons, badges, and modal dialogs.
  - Added a warm gold tint (`rgba(245, 183, 0, 0.02)`) to the background grid lines.
  - Updated divergence gauges, role badges, sparklines, and active table headers to gold and white.
  - Preserved Emerald (`#10b981`) for victories and Crimson (`#ff334b`) for defeats.
  - Converted the Scrim Graphic Generator canvas to gold borders, victory pills, and MVP spotlight frames.

### Map Banner & Backdrop Improvements
- **Shared Backdrop Component (`MapBannerBackdrop.jsx`):**
  - Unified backdrop logic for `MapCard.jsx` and `MatchBannerCard.jsx` into a single reusable component.
  - Increased map backdrop visibility by 10% (opacity adjusted from 60% to 70%).
  - Refined horizontal and vertical gradient overlays to improve map art visibility while keeping text clear.

### Documentation & Standards
- Rewrote changelog and system communications to follow ASD-STE100 (Simplified Technical English) standards.

---

## [1.1.0] - 2026-10-05

### Desktop Navigation & Layout
- **Tactical Sidebar (`Sidebar.jsx`):**
  - Added persistent command sidebar (`w-64`) for desktop and laptop screens.
  - Added slide-out navigation drawer for mobile screens.
  - Expanded main content area to `max-w-7xl` width.

### Maps Module & Starting 5 Lineups
- **Maps Tab (`MapsTab.jsx`):**
  - Added dedicated tab segmented by Hardpoint, Search & Destroy, and Control.
  - Added KPI summary cards for mode win rates and match totals.
- **Map Cards & Lineup Algorithm (`MapCard.jsx`, `mapsAnalytics.js`):**
  - Added map banner cards with win rates and score differentials.
  - Added Map Performance Index (MPI) to calculate optimal starting 5 squads.
  - Added tactical role tags: Primary Slayer, Anchor, Entry Fragger, Support Flex, and Flex Operator.

### Match History Banners
- **Banner Cards (`MatchBannerCard.jsx`):**
  - Redesigned match list with widescreen atmospheric map banners.
  - Added expandable scoreboards, metadata editor, and match deletion.

### Scrim Series Graphic Generator
- **Scrim Export Modal (`ScrimCardModal.jsx`):**
  - Added high-resolution canvas exporter (2400 × 1350 px, 16:9) for Discord and social sharing.
  - Added aggregate series leaderboard and Series MVP spotlight card.
  - Added 1-click clipboard copy and PNG image download.
- **Series Selector (`MatchList.jsx`):**
  - Added multi-match selection checkboxes and floating action bar.

### Player Alias Manager
- **Roster & Alias Tool (`AliasManagerModal.jsx`):**
  - Added interface to map raw OCR gamertag variants to canonical player profiles.
  - Added scanner for unmapped names with 1-click player assignment.
  - Added backend REST endpoints (`GET`, `POST`, `DELETE` on `/api/aliases`).

---

## [1.0.1] - 2026-10-05

### Player Analytics & Divergence
- **Composite Map Efficiency Rating (MER):**
  - Added mode-weighted metric to benchmark individual performance against squad averages.
- **Visual Divergence Bar (`DivergenceBar.jsx`):**
  - Added zero-centered horizontal gauge showing squad divergence.
  - Added performance tags (`CARRY`, `ANCHOR`, `IMPACT`, `PAR`, `DRAG`).
- **Tactical Intel Chips:**
  - Added Stronghold and Vulnerable quick chips to player profile cards.

---

## [1.0.0] - 2026-10-04

### Database Architecture
- **Normalized Schema (`schema.sql`):**
  - Created relational tables for `matches`, `match_players`, and `aliases`.
- **Database Driver (`connection.py`):**
  - Supported local SQLite and remote Turso cloud database via HTTP Hrana.
  - Enforced atomic transactions with batched execution.
- **Data Migration (`migrate.py`):**
  - Added seed script for matches, players, and Hardpoint objective statistics.

### Backend Services (FastAPI)
- **OCR Vision Pipeline (`gemini_ocr.py`):**
  - Integrated Gemini models with automatic fallback to extract scoreboard statistics.
- **Match Deduplication (`dedup.py`):**
  - Generated deterministic SHA-1 match hashes from timestamps and score data.
- **Configuration & Monitoring:**
  - Added `.env` configuration management and `/api/health` keep-alive endpoint.

### Web Application (React 19, Vite, Tailwind CSS)
- **Analytics Modules:**
  - Added Honors Banner for 14-day awards (Top Performer, Top Slayer, Best OBJ).
  - Added Slay-to-Win correlation matrix and map veto recommendation engine.
- **Player & Match Views:**
  - Added sortable player roster cards and table views.
  - Added batch screenshot uploader with duplicate alerts.
  - Configured automated GitHub Actions deployment workflow.
