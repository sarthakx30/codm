/**
 * Call of Duty: Mobile (CODM) Tactical Design System & Color Palette
 * Centralized theme tokens. Modify values here to change theme styling across the app.
 */

export const PALETTE = {
  // Primary / Brand Accent (CODM Prestige Gold)
  primary: '#f5b700',
  primaryBright: '#ffd700',
  primaryDark: '#c89b3c',
  primaryBg: 'rgba(245, 183, 0, 0.15)',
  primaryBorder: 'rgba(245, 183, 0, 0.40)',
  primaryGlow: 'rgba(245, 183, 0, 0.35)',

  // Secondary Accents
  secondary: '#ffd700',
  secondaryMuted: '#d4af37',

  // Tactical Cyan / Electric Accent (Roles, Strongholds, Trends)
  cyan: '#00e5ff',
  cyanBright: '#38bdf8',
  cyanBg: 'rgba(0, 229, 255, 0.12)',
  cyanBorder: 'rgba(0, 229, 255, 0.45)',
  cyanGlow: 'rgba(0, 229, 255, 0.35)',

  // Tactical Carbon Surfaces
  surfaceBase: '#080c14',
  surfacePanel: '#111723',
  surfaceCard: '#161e2e',
  surfaceElevated: '#0c111a',
  surfaceSubtle: 'rgba(0, 0, 0, 0.25)',

  // Tactical Borders & Dividers
  borderSubtle: '#223046',
  borderDefault: '#243044',
  borderBright: '#354b6d',
  borderPrimary: '#f5b700',

  // Stencil & Body Typography
  textPrimary: '#ffffff',
  textSecondary: '#e2e8f0',
  textMuted: '#7d90a6',
  textSubtle: '#5a6b82',
  textOnPrimary: '#0a0d14',

  // Esports Status Indicators
  win: '#10b981',
  winBg: 'rgba(16, 185, 129, 0.15)',
  winBorder: 'rgba(16, 185, 129, 0.40)',
  loss: '#ff334b',
  lossBg: 'rgba(255, 51, 75, 0.15)',
  lossBorder: 'rgba(255, 51, 75, 0.40)',
  neutral: '#7d90a6'
};

/**
 * Reusable composite badge & button style classes
 */
export const THEME_CLASSES = {
  // Action Buttons
  btnPrimary: 'bg-[#f5b700] hover:bg-[#ffd700] text-[#0a0d14] font-display font-extrabold tracking-wider transition-all shadow-[0_0_15px_rgba(245,183,0,0.35)]',
  btnSecondary: 'bg-[#161e2e] hover:bg-[#223046] border border-[#354b6d] text-white font-display tracking-wider transition-all',
  btnGhost: 'bg-transparent border border-[#354b6d] hover:border-[#f5b700] text-[#7d90a6] hover:text-[#ffd700] transition-colors',
  
  // Tactical Badges
  badgeGold: 'bg-[#f5b700]/15 border border-[#f5b700]/60 text-[#ffd700]',
  badgeCyan: 'bg-[#00e5ff]/10 border border-[#00e5ff]/50 text-[#00e5ff]',
  badgeWin: 'bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981]',
  badgeLoss: 'bg-[#ff334b]/15 border border-[#ff334b]/40 text-[#ff334b]',
  badgeNeutral: 'bg-white/5 border border-[#7d90a6]/40 text-[#7d90a6]',

  // Surface Containers
  panel: 'bg-[#111723] border border-[#223046]',
  card: 'bg-[#161e2e] border border-[#223046]',
  elevated: 'bg-[#0c111a] border border-[#223046]',

  // Text highlights
  accentText: 'text-[#ffd700]',
  primaryText: 'text-[#f5b700]'
};
