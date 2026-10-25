import {
  normalizeGameType,
  normalizeMode,
  normalizeTier
} from '../../config/matchOptions.js';

const STAT_FIELDS = ['score', 'kills', 'deaths', 'assists', 'impact', 'time'];

function toTextNumber(value) {
  const number = Number(value);
  return String(Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0);
}

export function toInt(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function toDatetimeLocal(value) {
  const text = String(value || '');
  return text.length >= 19 ? text.slice(0, 19) : text.slice(0, 16);
}

function fromDatetimeLocal(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  return text.length === 16 ? `${text}:00` : text;
}

export function createEmptyPlayer() {
  return {
    name: '',
    score: '0',
    kills: '0',
    deaths: '0',
    assists: '0',
    impact: '0',
    time: '0',
    mvp: false
  };
}

export function draftFromMatch(match) {
  const toDraftPlayer = (player) => {
    const draft = {
      name: player.name || '',
      mvp: !!player.mvp
    };
    STAT_FIELDS.forEach(field => {
      draft[field] = toTextNumber(player[field]);
    });
    return draft;
  };

  return {
    result: match.result === 'L' ? 'L' : 'W',
    score_us: toTextNumber(match.score_us),
    score_them: toTextNumber(match.score_them),
    mode: normalizeMode(match.mode),
    map: match.map || '',
    played_at: toDatetimeLocal(match.played_at),
    played_at_touched: false,
    opponent: match.opponent || '',
    tier: normalizeTier(match.tier),
    game_type: normalizeGameType(match.game_type),
    us: (match.us || []).map(toDraftPlayer),
    them: (match.them || []).map(toDraftPlayer)
  };
}

function toPlayerPayload(player) {
  return {
    name: String(player.name || '').trim(),
    score: toInt(player.score),
    kills: toInt(player.kills),
    deaths: toInt(player.deaths),
    assists: toInt(player.assists),
    impact: toInt(player.impact),
    time: toInt(player.time),
    mvp: !!player.mvp
  };
}

export function buildMatchSavePayload(match, draft) {
  const playedAt = fromDatetimeLocal(draft.played_at);
  const playedAtTouched = !!draft.played_at_touched;

  return {
    id: match.id,
    added_at: match.added_at,
    result: draft.result === 'L' ? 'L' : 'W',
    score_us: toInt(draft.score_us),
    score_them: toInt(draft.score_them),
    mode: normalizeMode(draft.mode),
    map: String(draft.map || '').trim().toUpperCase(),
    played_at_raw: playedAtTouched
      ? (playedAt ? (match.played_at_raw || '') : '')
      : (match.played_at_raw || ''),
    played_at: playedAtTouched ? playedAt : (match.played_at || null),
    opponent: String(draft.opponent || '').trim(),
    tier: normalizeTier(draft.tier),
    game_type: normalizeGameType(draft.game_type),
    us: (draft.us || []).map(toPlayerPayload),
    them: (draft.them || []).map(toPlayerPayload)
  };
}

export function isDraftValid(draft) {
  if (!normalizeMode(draft.mode)) return false;
  const players = [...(draft.us || []), ...(draft.them || [])];
  return players.every(player => String(player.name || '').trim().length > 0);
}

export function resultMismatch(draft) {
  const scoreUs = toInt(draft.score_us);
  const scoreThem = toInt(draft.score_them);
  if (scoreUs === scoreThem) return false;
  return draft.result === 'W' ? scoreUs < scoreThem : scoreUs > scoreThem;
}
