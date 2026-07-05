// Timmble design system — warm, playful, mascot-led.
// Deliberately OFF the default indigo/slate that every AI-scaffolded app ships.

const palette = {
  cream:     '#FFF6EC', // warm background
  cream2:    '#FFEFE0', // slightly deeper cream for banding
  ink:       '#2C2740', // warm plum-black text
  coral:     '#FF6F5E', // primary — friendly, energetic
  coralSoft: '#FFE7E1',
  teal:      '#1FB9A6', // secondary — fresh, trustworthy
  tealSoft:  '#DFF6F2',
  sunny:     '#FFB43D', // accent — reward/energy
  sunnySoft: '#FFEFCF',
  berry:     '#F268A6', // accent — playful
  berrySoft: '#FDE3EF',
  sky:       '#4AA8F5', // accent — calm
  skySoft:   '#E1F0FE',
  grape:     '#8B6DF2', // accent — puzzle/logic
  grapeSoft: '#ECE6FE',
};

export const colors = {
  // --- new named tokens ---
  ...palette,

  // --- legacy keys (kept so existing screens re-skin without edits) ---
  primary:       palette.coral,
  primaryLight:  palette.coralSoft,
  secondary:     palette.teal,
  pink:          palette.berry,
  amber:         palette.sunny,
  green:         palette.teal,
  red:           palette.coral,
  bg:            palette.cream,
  card:          '#FFFFFF',
  border:        '#F1E4D6',   // warm hairline
  text:          palette.ink,
  textMuted:     '#7C748C',
  textLight:     '#ADA3B8',
  success:       palette.tealSoft,
  successBorder: palette.teal,
  error:         palette.coralSoft,
  errorBorder:   palette.coral,
};

// Skill-area identity colors (used by icons/chips) — cohesive with the palette.
export const skillColors = {
  memory:    { main: palette.grape, soft: palette.grapeSoft },
  attention: { main: palette.berry, soft: palette.berrySoft },
  pattern:   { main: palette.sky,   soft: palette.skySoft },
  spatial:   { main: palette.sunny, soft: palette.sunnySoft },
  logic:     { main: palette.teal,  soft: palette.tealSoft },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, xxl: 36, full: 999 };

// Real type scale — one size/weight per role, not bold-900 everywhere.
export const type = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, lineHeight: 38 },
  title:   { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, lineHeight: 30 },
  heading: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2, lineHeight: 24 },
  body:    { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  label:   { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  caption: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
};

export const font = { regular: 'System', bold: 'System' };

// Motion tokens — used by Animated for entrances / press / celebration.
export const motion = {
  quick: 160,
  base: 260,
  slow: 420,
  spring: { damping: 12, stiffness: 160, mass: 0.9 },
  pressScale: 0.96,
};

export const shadow = {
  sm: {
    shadowColor: '#7A4A2E', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  md: {
    shadowColor: '#7A4A2E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 18, elevation: 5,
  },
  // soft colored glow used under primary CTAs
  glow: (c) => ({
    shadowColor: c, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  }),
};
