/**
 * Map Image Registry and Resolver
 * 
 * Images can be placed in client/public/maps/<slug>.jpg (or .png / .webp).
 * Example:
 *   client/public/maps/combine.jpg
 *   client/public/maps/hackney_yard.jpg
 *   client/public/maps/hacienda.jpg
 *   client/public/maps/summit.jpg
 *   client/public/maps/raid.jpg
 *   client/public/maps/coastal.jpg
 *   client/public/maps/slums.jpg
 *   client/public/maps/takeoff.jpg
 *   client/public/maps/crossroads.jpg
 *   client/public/maps/standoff.jpg
 */

// Normalized slugs for common competitive CODM maps
const MAP_SLUG_MAP = {
  'combine': 'combine',
  'hackney yard': 'hackney_yard',
  'hackney': 'hackney_yard',
  'hacienda': 'hacienda',
  'summit': 'summit',
  'raid': 'raid',
  'coastal': 'coastal',
  'slums': 'slums',
  'takeoff': 'takeoff',
  'crossroads strike': 'crossroads',
  'crossroads': 'crossroads',
  'standoff': 'standoff',
  'firing range': 'firing_range',
  'tunisia': 'tunisia',
  'crash': 'crash',
  'express': 'express',
  'meltdown': 'meltdown',
  'terminal': 'terminal',
  'apocalypse': 'apocalypse'
};

// Tactical fallback gradient themes for each map atmosphere
const MAP_THEMES = {
  'combine': {
    primary: '#00e5ff',
    gradient: 'from-[#0d233a] via-[#091522] to-[#04070c]',
    accent: '#00e5ff'
  },
  'hackney_yard': {
    primary: '#f59e0b',
    gradient: 'from-[#2b2416] via-[#1a1610] to-[#080705]',
    accent: '#f59e0b'
  },
  'hacienda': {
    primary: '#f97316',
    gradient: 'from-[#2c1c14] via-[#1a120d] to-[#0a0705]',
    accent: '#f97316'
  },
  'summit': {
    primary: '#38bdf8',
    gradient: 'from-[#11293d] via-[#0a1926] to-[#040a10]',
    accent: '#38bdf8'
  },
  'raid': {
    primary: '#ffb800',
    gradient: 'from-[#2a220a] via-[#171306] to-[#060502]',
    accent: '#ffb800'
  },
  'coastal': {
    primary: '#06b6d4',
    gradient: 'from-[#0e2a33] via-[#08181d] to-[#03080a]',
    accent: '#06b6d4'
  },
  'slums': {
    primary: '#ec4899',
    gradient: 'from-[#2b121e] via-[#190a12] to-[#080306]',
    accent: '#ec4899'
  },
  'takeoff': {
    primary: '#8b5cf6',
    gradient: 'from-[#1e1533] via-[#120c20] to-[#05030a]',
    accent: '#8b5cf6'
  },
  'crossroads': {
    primary: '#60a5fa',
    gradient: 'from-[#132338] via-[#0b1420] to-[#04070b]',
    accent: '#60a5fa'
  },
  'standoff': {
    primary: '#eab308',
    gradient: 'from-[#241e0a] via-[#161206] to-[#070602]',
    accent: '#eab308'
  }
};

const DEFAULT_THEME = {
  primary: '#00e5ff',
  gradient: 'from-[#162133] via-[#0d1522] to-[#06090e]',
  accent: '#00e5ff'
};

/**
 * Returns slug, image URL, and theme for a given map name
 */
export function getMapMetadata(mapName = '') {
  const clean = String(mapName).trim().toLowerCase();
  const slug = MAP_SLUG_MAP[clean] || clean.replace(/[^a-z0-9]/g, '_');
  const theme = MAP_THEMES[slug] || DEFAULT_THEME;
  // Look for image in /maps/<slug>.jpg with base path awareness for Vite/GitHub Pages
  const basePath = import.meta.env.BASE_URL || '/';
  const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const imageUrl = `${cleanBase}maps/${slug}.jpg`;

  return {
    rawName: mapName,
    slug,
    imageUrl,
    theme
  };
}
