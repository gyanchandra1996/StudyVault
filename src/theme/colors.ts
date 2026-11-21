export type ColorThemeMode = 'light' | 'dark' | 'system';
export type AccentColorKey =
  | 'indigo'
  | 'blue'
  | 'teal'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'ruby'
  | 'forest'
  | 'gold';

export const ACCENT_PALETTES: Record<AccentColorKey, { name: string; primary: string; light: string; dark: string }> = {
  indigo: {
    name: 'Indigo',
    primary: '#6366F1',
    light: '#EEF2FF',
    dark: '#4338CA',
  },
  blue: {
    name: 'Ocean Blue',
    primary: '#2563EB',
    light: '#EFF6FF',
    dark: '#1D4ED8',
  },
  teal: {
    name: 'Teal',
    primary: '#0D9488',
    light: '#F0FDFA',
    dark: '#0F766E',
  },
  emerald: {
    name: 'Emerald',
    primary: '#059669',
    light: '#ECFDF5',
    dark: '#047857',
  },
  rose: {
    name: 'Rose',
    primary: '#E11D48',
    light: '#FFF1F2',
    dark: '#BE123C',
  },
  amber: {
    name: 'Amber',
    primary: '#D97706',
    light: '#FFFBEB',
    dark: '#B45309',
  },
  purple: {
    name: 'Violet Dream',
    primary: '#8B5CF6',
    light: '#F5F3FF',
    dark: '#6D28D9',
  },
  orange: {
    name: 'Sunset Orange',
    primary: '#F97316',
    light: '#FFF7ED',
    dark: '#C2410C',
  },
  cyan: {
    name: 'Electric Cyan',
    primary: '#06B6D4',
    light: '#ECFEFF',
    dark: '#0E7490',
  },
  ruby: {
    name: 'Crimson Ruby',
    primary: '#DC2626',
    light: '#FEF2F2',
    dark: '#991B1B',
  },
  forest: {
    name: 'Forest Olive',
    primary: '#15803D',
    light: '#F0FDF4',
    dark: '#166534',
  },
  gold: {
    name: 'Royal Gold',
    primary: '#CA8A04',
    light: '#FEFCE8',
    dark: '#854D0E',
  },
};

export const HIGHLIGHT_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  yellow: { bg: 'rgba(254, 240, 138, 0.65)', border: '#EAB308', label: 'Yellow' },
  green: { bg: 'rgba(187, 247, 208, 0.65)', border: '#22C55E', label: 'Green' },
  blue: { bg: 'rgba(191, 219, 254, 0.65)', border: '#3B82F6', label: 'Blue' },
  pink: { bg: 'rgba(251, 207, 232, 0.65)', border: '#EC4899', label: 'Pink' },
  orange: { bg: 'rgba(254, 215, 170, 0.65)', border: '#F97316', label: 'Orange' },
  purple: { bg: 'rgba(233, 213, 255, 0.65)', border: '#A855F7', label: 'Purple' },
};

export interface ThemeColors {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  readerBg: string;
  readerNightBg: string;
  statusBar: 'dark-content' | 'light-content';
  bottomBarBg: string;
  bottomBarActive: string;
  bottomBarInactive: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
}

export const LIGHT_THEME: Omit<ThemeColors, 'primary' | 'primaryLight' | 'primaryDark'> = {
  mode: 'light',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  shadow: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  readerBg: '#F8FAFC',
  readerNightBg: '#1E1E2E',
  statusBar: 'dark-content',
  bottomBarBg: '#FFFFFF',
  bottomBarActive: '#6366F1',
  bottomBarInactive: '#94A3B8',
};

export const DARK_THEME: Omit<ThemeColors, 'primary' | 'primaryLight' | 'primaryDark'> = {
  mode: 'dark',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  border: '#334155',
  divider: '#1E293B',
  shadow: '#000000',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  readerBg: '#181825',
  readerNightBg: '#11111B',
  statusBar: 'light-content',
  bottomBarBg: '#1E293B',
  bottomBarActive: '#818CF8',
  bottomBarInactive: '#64748B',
};
