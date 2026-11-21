import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import {
  ColorThemeMode,
  AccentColorKey,
  ACCENT_PALETTES,
  LIGHT_THEME,
  DARK_THEME,
  ThemeColors,
} from '@/theme/colors';

const STORAGE_THEME_KEY = '@studyvault_theme_mode';
const STORAGE_ACCENT_KEY = '@studyvault_accent_color';
const STORAGE_FONTSCALE_KEY = '@studyvault_font_scale';

interface ThemeState {
  mode: ColorThemeMode;
  accent: AccentColorKey;
  fontScale: number;
  isLoaded: boolean;
  setMode: (mode: ColorThemeMode) => Promise<void>;
  setAccent: (accent: AccentColorKey) => Promise<void>;
  setFontScale: (scale: number) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
  getThemeColors: () => ThemeColors;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  accent: 'indigo',
  fontScale: 1.0,
  isLoaded: false,

  setMode: async (mode: ColorThemeMode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_THEME_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme mode:', e);
    }
  },

  setAccent: async (accent: AccentColorKey) => {
    set({ accent });
    try {
      await AsyncStorage.setItem(STORAGE_ACCENT_KEY, accent);
    } catch (e) {
      console.warn('Failed to save accent color:', e);
    }
  },

  setFontScale: async (fontScale: number) => {
    set({ fontScale });
    try {
      await AsyncStorage.setItem(STORAGE_FONTSCALE_KEY, String(fontScale));
    } catch (e) {
      console.warn('Failed to save font scale:', e);
    }
  },

  loadSavedTheme: async () => {
    try {
      const [savedMode, savedAccent, savedScale] = await Promise.all([
        AsyncStorage.getItem(STORAGE_THEME_KEY),
        AsyncStorage.getItem(STORAGE_ACCENT_KEY),
        AsyncStorage.getItem(STORAGE_FONTSCALE_KEY),
      ]);

      set({
        mode: (savedMode as ColorThemeMode) || 'system',
        accent: (savedAccent as AccentColorKey) || 'indigo',
        fontScale: savedScale ? parseFloat(savedScale) : 1.0,
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load theme preferences:', e);
      set({ isLoaded: true });
    }
  },

  getThemeColors: () => {
    const { mode, accent } = get();
    const systemScheme = Appearance.getColorScheme();
    const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
    const base = isDark ? DARK_THEME : LIGHT_THEME;
    const accentData = ACCENT_PALETTES[accent] || ACCENT_PALETTES.indigo;

    return {
      ...base,
      primary: accentData.primary,
      primaryLight: accentData.light,
      primaryDark: accentData.dark,
      bottomBarActive: accentData.primary,
    };
  },
}));
