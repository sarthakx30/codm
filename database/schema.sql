PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    result TEXT NOT NULL CHECK(result IN ('W', 'L')),
    score_us INTEGER NOT NULL DEFAULT 0,
    score_them INTEGER NOT NULL DEFAULT 0,
    mode TEXT NOT NULL DEFAULT '',
    map TEXT NOT NULL DEFAULT '',
    played_at_raw TEXT NOT NULL DEFAULT '',
    played_at TEXT,
    added_at TEXT NOT NULL,
    opponent TEXT NOT NULL DEFAULT '',
    tier TEXT NOT NULL DEFAULT '',
    game_type TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS match_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT NOT NULL,
    team TEXT NOT NULL CHECK(team IN ('us', 'them')),
    name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    kills INTEGER NOT NULL DEFAULT 0,
    deaths INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    impact INTEGER NOT NULL DEFAULT 0,
    time INTEGER NOT NULL DEFAULT 0,
    mvp INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aliases (
    raw_name TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_name ON match_players(name);
CREATE INDEX IF NOT EXISTS idx_matches_played_at ON matches(played_at);
