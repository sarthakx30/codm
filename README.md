# Horizon // CODM Match Analytics Platform

An esports analytics and match-tracking system for competitive Call of Duty: Mobile (CODM) teams. Originally developed as a local Android/Termux prototype, now refactored into a modular, production-ready cloud stack that is 100% free to host.

---

## 1. Architecture Overview

The codebase is divided into three distinct layers:

```
codm/
│
├── database/                    # [DATABASE LAYER]
│   ├── schema.sql               # Relational DDL (matches, match_players, aliases, indexes)
│   ├── connection.py            # Unified Turso (libSQL) & local SQLite connection driver
│   └── codm.db                  # Normalized local SQLite database (23 matches, 217 players)
│
├── server/                      # [SERVER LAYER] FastAPI Backend
│   ├── app/
│   │   ├── config.py            # Environment configuration (.env management)
│   │   ├── schemas.py           # Pydantic models for validation and responses
│   │   ├── repositories/        # Data Access Objects (matches, players, aliases)
│   │   ├── services/            # Gemini OCR vision model & SHA-1 deduplication
│   │   └── routers/             # API routes (/api/health, /api/matches, /api/parse, /api/aliases)
│   ├── main.py                  # FastAPI app entry point with CORS middleware
│   ├── requirements.txt         # Locked Python dependencies
│   └── .env.example             # Server environment variables template
│
└── client/                      # [CLIENT LAYER] React + Vite + Tailwind CSS
    ├── public/                  # Tactical fonts & static assets
    ├── src/
    │   ├── api/client.js        # API client with Render cold-start detection (>2s indicator)
    │   ├── engine/              # Esport analytics (14-day honors, slay-to-win, map veto, roles)
    │   ├── components/          # Tactical cyber/carbon UI modules (Overview, Players, Matches, Upload)
    │   ├── styles/index.css     # Tactical design system (Dark slate, Neon Cyan, Gold, Crimson)
    │   ├── App.jsx              # Main SPA layout with HashRouter compatibility
    │   └── main.jsx             # React DOM root
    ├── vite.config.js           # Vite config with Tailwind CSS and /api dev proxy
    └── package.json
```

---

## 2. Core Business Logic & Invariants

1. **Gemini Scoreboard OCR**:
   - Takes in-game scoreboard screenshots.
   - Queries Google Gemini API (`gemini-3.5-flash-lite` with fallback to `gemini-3-flash` and `gemini-2.5-flash`).
   - Parses scores, map, mode, played timestamp, and individual player stats (kills, deaths, assists, impact score, Hardpoint objective hill time in seconds, and MVP status).
2. **Deterministic SHA-1 Deduplication**:
   - Match ID is the first 10 hex characters of the SHA-1 hash of:  
     `played_at_raw|score_us|score_them|teammates_kills/deaths/score`
   - Existing matches flag `DUPLICATE DETECTED` in the review queue.
3. **Esports Analytics & Honors Engine**:
   - **Top Performer**: Highest Average Impact across a rolling 14-day window (minimum 2 matches).
   - **Top Slayer**: Highest Kills Per Match (KPM).
   - **Best OBJ**: Highest average Hardpoint hill time in seconds.
   - **Best Support**: Assists and score efficiency formula: `(assists/games)*2 + (score/kills)*0.02`.
   - **The Clincher**: Highest MVP conversion rate (`mvps / games`).
   - **Slay-to-Win Matrix**: Correlation of kill differential to match outcome (Out-Slay & Won, Out-Slay but Lost, Out-Slayed by Enemy but Won).
   - **Clutch Win Rate**: Matches decided by close margins ($\le 30$ in Hardpoint, $\le 1$ in S&D/Control, or $\le 15$ overall).
   - **Map Veto & Pick Strategy**: Win rate $\ge 65\%$ = `AUTO-PICK`, $< 40\%$ = `AUTO-BAN`, otherwise `CONTESTED`.
   - **Player Role Tags**: Automatically classifies players as *OBJ Anchor*, *S&D Specialist*, *Primary Fragger*, *Support Flex*, or *Flex Operator*.

---

## 3. Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Step 1: Database Migration (Local SQLite)
```bash
python database/migrate.py
```
*Initializes `database/codm.db` and migrates all 23 historical matches from `data.json`.*

### Step 2: Start the FastAPI Backend
```bash
python -m pip install -r server/requirements.txt
python -m uvicorn server.main:app --port 8000 --reload
```
*API runs at `http://127.0.0.1:8000`. Interactive OpenAPI documentation available at `http://127.0.0.1:8000/docs`.*

### Step 3: Start the React Frontend
```bash
cd client
npm install
npm run dev
```
*Frontend runs at `http://127.0.0.1:5173/` and proxies all `/api/*` requests to port 8000.*

---

## 4. Free Cloud Deployment Guide

### A. Database: Turso (Cloud SQLite)
1. Install Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash` (or sign up at [turso.tech](https://turso.tech)).
2. Create a free database:
   ```bash
   turso db create codm-db
   turso db show --url codm-db
   turso db tokens create codm-db
   ```
3. Run the migration to upload your historical data to the cloud:
   ```bash
   python database/migrate.py --url "libsql://codm-db-<your-org>.turso.io" --token "<your-token>"
   ```

### B. Backend: Render (Free Web Service)
1. Create a new **Web Service** on [Render](https://render.com) pointing to your repository.
2. Settings:
   - **Root Directory**: `server` (or run from root)
   - **Build Command**: `pip install -r server/requirements.txt`
   - **Start Command**: `uvicorn server.main:app --host 0.0.0.0 --port $PORT`
3. Environment Variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `TURSO_DATABASE_URL`: Your Turso database URL (`libsql://...`).
   - `TURSO_AUTH_TOKEN`: Your Turso auth token.
   - `CORS_ORIGINS`: `https://<your-github-username>.github.io,http://localhost:5173`
4. Set up an automated keep-alive ping (e.g. via Cron-job.org or UptimeRobot) pinging `GET /api/health` every 10 minutes to prevent Render's free tier 15-minute sleep cycle.

### C. Frontend: GitHub Pages
1. In `client/`, set `VITE_API_URL` to your Render service URL (e.g., `https://codm-analytics.onrender.com/api`) in `client/.env.production`:
   ```bash
   VITE_API_URL=https://<your-render-app>.onrender.com/api
   ```
2. Build the production bundle:
   ```bash
   cd client
   npm run build
   ```
3. Deploy the `client/dist/` directory to your repository's `gh-pages` branch. The app uses `HashRouter` navigation, ensuring 100% routing stability without 404 rewrite issues.
