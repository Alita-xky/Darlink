import { Platform } from 'react-native';

// ─── Brand Colors (from HTML design reference) ───────────────────────────────
export const Colors = {
  // Brand palette
  pink: '#FF8FAB',
  pinkDeep: '#FF6B9E',
  blue: '#9BB1FF',
  blueDeep: '#7C93FF',
  lilac: '#CDB4DB',

  // Gradient endpoints (Pink → Blue)
  gradientStart: '#FF6B9E',
  gradientEnd: '#7C93FF',

  // Backgrounds
  bg: '#F8FAFC',          // slate-50
  bgWhite: '#FFFFFF',
  bgCard: '#FFFFFF',

  // Borders
  border: '#E2E8F0',      // slate-200
  borderLight: '#F1F5F9', // slate-100

  // Text
  text: '#1E293B',        // slate-800
  textBody: '#334155',    // slate-700
  textSecondary: '#64748B', // slate-500
  textMuted: '#94A3B8',   // slate-400
  textPlaceholder: '#CBD5E1', // slate-300

  // Scene accents
  study: '#6366F1',       // indigo-500
  studyBg: '#EEF2FF',     // indigo-50
  studyBorder: '#C7D2FE', // indigo-200
  food: '#F97316',        // orange-500
  foodBg: '#FFF7ED',      // orange-50
  foodBorder: '#FED7AA',  // orange-200
  romance: '#EC4899',     // pink-500
  romanceBg: '#FDF2F8',   // pink-50
  romanceBorder: '#FBCFE8', // pink-200

  // State
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',

  // Tab navigation (for light/dark compat hooks)
  light: {
    text: '#1E293B',
    background: '#F8FAFC',
    tint: '#FF8FAB',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#FF8FAB',
  },
  dark: {
    text: '#F1F5F9',
    background: '#0F172A',
    tint: '#FF8FAB',
    icon: '#94A3B8',
    tabIconDefault: '#475569',
    tabIconSelected: '#FF8FAB',
  },
};

export const Stickers = {
  cream:    { bg: '#FFF8E7', edge: '#1F1F1F', accent: '#E8B4B8' },
  matcha:   { bg: '#D4E4BC', edge: '#1F1F1F', accent: '#7A9E5C' },
  peach:    { bg: '#FFD6BA', edge: '#1F1F1F', accent: '#E07856' },
  lavender: { bg: '#D8C5E8', edge: '#1F1F1F', accent: '#7C5CA8' },
} as const;

export type StickerPalette = keyof typeof Stickers;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Shadow presets (iOS)
export const Shadows = {
  sm: {
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1F1F1F',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  sticker: {
    shadowColor: '#1F1F1F',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
};

export const HandwrittenFonts = {
  zh: 'MaShanZheng-Regular',
  en: 'Caveat-Regular',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
});
