/**
 * Canonical match metadata options.
 * Tier, mode, category, and scrim format values come from this file.
 */

export const GAME_TYPES = [
  { value: 'scrim', label: 'Scrim', plural: 'Scrims' },
  { value: 'tournament', label: 'Tournament', plural: 'Tournaments' }
];

export const MATCH_SCOPES = [
  { value: '', label: 'All matches' },
  ...GAME_TYPES.map(type => ({ value: type.value, label: type.plural }))
];

export const TIERS = [
  { value: 'T1', label: 'Tier 1', shortLabel: 'T1' },
  { value: 'T2', label: 'Tier 2', shortLabel: 'T2' },
  { value: 'T3', label: 'Tier 3', shortLabel: 'T3' }
];

export const TIER_SUBTIERS = [
  { value: 'H', label: 'High', shortLabel: 'H' },
  { value: 'M', label: 'Mid', shortLabel: 'M' },
  { value: 'L', label: 'Low', shortLabel: 'L' }
];

export const TIER_FILTERS = [
  { value: 'ALL', label: 'All tiers' },
  ...TIERS.map(tier => ({ value: tier.value, label: tier.label }))
];

export const MODES = [
  { id: 'hardpoint', value: 'Hardpoint', label: 'Hardpoint', shortLabel: 'HP' },
  { id: 'snd', value: 'Search & Destroy', label: 'Search & Destroy', shortLabel: 'S&D' },
  { id: 'control', value: 'Control', label: 'Control', shortLabel: 'CTL' }
];

export const SERIES_FORMATS = [
  { value: 'BEST OF 1', label: 'Best of 1 (BO1)' },
  { value: 'BEST OF 3', label: 'Best of 3 (BO3)' },
  { value: 'BEST OF 5', label: 'Best of 5 (BO5)' },
  { value: 'SCRIM SERIES', label: 'Scrim series' }
];

/**
 * Return the category value used by the API. Blank legacy values default to scrim.
 */
export function normalizeGameType(value = '') {
  const clean = String(value || '').trim().toLowerCase();
  return GAME_TYPES.some(type => type.value === clean) ? clean : 'scrim';
}

export function gameTypeLabel(value = '') {
  const clean = normalizeGameType(value);
  return GAME_TYPES.find(type => type.value === clean)?.label || 'Scrim';
}

/**
 * Return T1H, T2M, T3L, or an empty string.
 * A main tier without a subtier defaults to Mid so saved data is always complete.
 */
export function normalizeTier(value = '') {
  const match = String(value || '').trim().toUpperCase().match(/^(T[123])([HML])?$/);
  if (!match) return '';
  return `${match[1]}${match[2] || 'M'}`;
}

export function tierLabel(value = '') {
  const tier = normalizeTier(value);
  if (!tier) return 'Unrated';
  const main = TIERS.find(level => tier.startsWith(level.value));
  const sub = TIER_SUBTIERS.find(level => tier.endsWith(level.value));
  return main && sub ? `${main.label} · ${sub.label}` : 'Unrated';
}

/**
 * Return the canonical mode label used for storage and display.
 * Handles OCR variants such as HP, SND, S&D, and CONTROL RAID.
 */
export function normalizeMode(value = '') {
  const compact = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  if (compact.includes('HARDPOINT') || compact === 'HP') return 'Hardpoint';
  if (
    compact.includes('SEARCH') ||
    compact === 'SND' ||
    compact === 'SD' ||
    compact === 'SANDD'
  ) {
    return 'Search & Destroy';
  }
  if (compact.includes('CONTROL') || compact === 'CTL') return 'Control';
  return '';
}

export function getModeId(value = '') {
  const mode = normalizeMode(value);
  return MODES.find(option => option.value === mode)?.id || 'other';
}

export function defaultSeriesFormat(mapCount = 0) {
  if (mapCount === 1) return 'BEST OF 1';
  if (mapCount === 3) return 'BEST OF 3';
  if (mapCount === 5) return 'BEST OF 5';
  return 'SCRIM SERIES';
}
