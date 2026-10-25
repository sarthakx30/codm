# Changelog

All notable changes to the CODM Match Analytics Platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2026-10-26

### Mobile Navigation & Phone Layout
- Replaced the mobile slide-out sidebar with a fixed bottom pill navigation bar: Home, Maps, Matches, Players, Add.
- Removed the mobile hamburger button. The desktop sidebar is unchanged.
- Added a mobile header shortcut for the roster and alias manager.
- Added safe-area padding for phones with notches and gesture bars.
- Added bottom spacing to the main content so the navigation bar never covers the last card.
- Improved small-screen spacing in the header, match scope filter, match history toolbar, match banner cards, and modal headers.
- Stacked the player stat inputs in the Add Match screen into three columns on phones.
- Added the missing fade, slide, and bottom-navigation entrance animations.
- Added a hidden-scrollbar utility for horizontal chip rows.

### Maintenance
- Fixed Turso write operations. `Database.execute()` now returns the affected row count.
- Moved Gemini OCR calls off the FastAPI event loop.
- Added API smoke tests, `pytest.ini`, and `server/requirements-dev.txt`.
- Fixed stale setup steps and file paths in `README.md`.
- Unified the API and client version at `1.4.1`.

## [1.4.0] - 2026-10-12

### Tier Normalization & Cross-Mode Analytics Engine
- **Cross-Mode Net Score Margin:**
  - Implemented mode-neutral Net Score Share percentage in [tierAnalytics.js](file:///c:/Users/Sarthak/Projects/codm/client/src/engine/tierAnalytics.js) scaling from -100% to +100%.
  - Normalized score differentials across Hardpoint (250 pts), Search & Destroy (rounds), and Control (rounds) into directly comparable metrics.
- **Symmetric Tier Difficulty Scaling:**
  - Calibrated tier difficulty scale: Tier 1 (`T1H: 1.62`, `T1M: 1.45`, `T1L: 1.28`), Tier 2 (`T2H: 1.12`, `T2M: 1.00`, `T2L: 0.88`), Tier 3 (`T3H: 0.72`, `T3M: 0.58`, `T3L: 0.44`).
  - Implemented symmetric performance multipliers: rewards for good performances against top competition ($D$) are balanced by equal penalties for poor performances against lower tiers ($2.0 - D$).
  - Prevents bad showings against elite teams from being overshadowed by stomping lower-tier teams.
- **Tier-Weighted Map Intel & Rotation Status:**
  - Replaced raw point differential with **WEIGHTED MARGIN** and **TIER-WT WIN%** in [mapsAnalytics.js](file:///c:/Users/Sarthak/Projects/codm/client/src/engine/mapsAnalytics.js) and [MapCard.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/maps/MapCard.jsx).
  - Map status (`STRONGHOLD`, `CONTESTED`, `VULNERABLE`) is now determined by tier-weighted win rates and normalized margin thresholds.
  - Added tier breakdown chips (e.g., `T2: 2W-1L`, `T3: 1W-0L`) and match tier badges on map cards.
  - Added dedicated **Tier Filter Selector** (`ALL TIERS`, `TIER 1`, `TIER 2`, `TIER 3`) to [MapsTab.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/maps/MapsTab.jsx).
- **Tier-Weighted Starting 5 Squad Roster:**
  - Updated Map Performance Index (MPI) algorithm in [mapsAnalytics.js](file:///c:/Users/Sarthak/Projects/codm/client/src/engine/mapsAnalytics.js) to weight player K/D, scoring, hill time, and impact by opponent tier.
  - Prioritizes high slaying efficiency and objective control against top-tier opponents over stats farmed against lower tiers.
- **Pick/Ban Strategy Alignment:**
  - Updated [mapVeto.js](file:///c:/Users/Sarthak/Projects/codm/client/src/engine/mapVeto.js) and [MapVetoTable.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/overview/MapVetoTable.jsx) with tier-weighted win rate and margin columns for draft recommendations.

### Mandatory Subtier (H/M/L) Validation
- **Removal of Generic Standalone Tiers:**
  - Removed generic `T1`, `T2`, and `T3` entries from `TIER_DIFFICULTY` in [tierAnalytics.js](file:///c:/Users/Sarthak/Projects/codm/client/src/engine/tierAnalytics.js).
- **UI & Modal Subtier Enforcement:**
  - Enforced mandatory subtier (`High`, `Mid`, or `Low`) selection in [BatchUploadModal.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/upload/BatchUploadModal.jsx) and [MatchBannerCard.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/matches/MatchBannerCard.jsx).
  - Added visual warning indicators and disabled save actions when a tier is selected without a subtier.
  - Added validation guards in [MatchList.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/matches/MatchList.jsx) preventing bare tier saves.
- **API & Schema Validation:**
  - Added regex pattern `^(|[Tt][123][HhMmLl])$` in [schemas.py](file:///c:/Users/Sarthak/Projects/codm/server/app/schemas.py) rejecting standalone tiers on match save and update endpoints.

### Versioning & Identity
- **Title Card v1.4 Alignment:**
  - Bumped version to **v1.4** in [version.js](file:///c:/Users/Sarthak/Projects/codm/client/src/config/version.js), reflected in [Header.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/common/Header.jsx) and [Sidebar.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/common/Sidebar.jsx).

---

## [1.3.0] - 2026-10-12

### Branding & Identity
- **Horizon TATTA Designation:**
  - Updated application title to **HORIZON TATTA** across [Header.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/common/Header.jsx), [Sidebar.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/common/Sidebar.jsx), and [version.js](file:///c:/Users/Sarthak/Projects/codm/client/src/config/version.js).
  - Styled `TATTA` in smaller gold sub-font (`font-mono-num font-bold text-[#f5b700]`).
  - Updated subtitle to `// TACTICAL ANALYSIS & TEAM TRACKING ARCHITECTURE`.

### Batch Upload & Opponent History
- **Prior Opponent Selection:**
  - Added opponent dropdown selector in [BatchUploadModal.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/upload/BatchUploadModal.jsx).
  - Connected match history from [App.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/App.jsx) to opponent list calculation in [tierAnalytics.js](file:///c:/Users/Sarthak/Projects/codm/client/src/engine/tierAnalytics.js).
  - Automatically loads the last recorded tier when user selects an opponent.
- **Series-Wide Metadata Sync:**
  - Added Series Intel default bar for multi-match batch uploads.
  - Added single-click action to apply opponent name, tier, and category to all queued matches.
  - Supported manual tier changes during screenshot verification.

### Tier Sorting & Hierarchy Alignment
- **Hierarchical Tier Sorting Engine (`tierAnalytics.js`):**
  - Added `getTierWeight` and `compareTiers` utilities to enforce mathematical tier order: `T1H` → `T1M` → `T1L` → `T1` → `T2H` → `T2M` → `T2L` → `T2` → `T3H` → `T3M` → `T3L` → `T3` → Untiered.
  - Sorted subtiers within [TierPerformance.jsx](file:///c:/Users/Sarthak/Projects/codm/client/src/components/overview/TierPerformance.jsx) in strict descending hierarchy (High → Mid → Low).
- **Interactive Opponent Table Sorting (`OpponentList.jsx`):**
  - Added interactive column sorting with default sorting by tier hierarchy.
  - Added sort direction arrows (`▲`/`▼`) and active column indicator.
- **Match Editor Subtier Controls (`MatchBannerCard.jsx`):**
  - Added High, Mid, and Low subtier buttons to match card editor.

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
