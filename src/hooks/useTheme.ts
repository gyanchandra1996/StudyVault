import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { ACCENT_PALETTES, LIGHT_THEME, DARK_THEME, ThemeColors } from '@/theme/colors';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { mode, accent, fontScale, setMode, setAccent, setFontScale, isLoaded } = useThemeStore();

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const base = isDark ? DARK_THEME : LIGHT_THEME;
  const accentData = ACCENT_PALETTES[accent] || ACCENT_PALETTES.indigo;

  const colors: ThemeColors = {
    ...base,
    primary: accentData.primary,
    primaryLight: accentData.light,
    primaryDark: accentData.dark,
    bottomBarActive: accentData.primary,
  };

  return {
    colors,
    isDark,
    mode,
    accent,
    fontScale,
    setMode,
    setAccent,
    setFontScale,
    isLoaded,
    accentPalettes: ACCENT_PALETTES,
  };
}
