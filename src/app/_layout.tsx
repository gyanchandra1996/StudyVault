import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { LockScreen } from '@/components/auth/LockScreen';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const loadSavedTheme = useThemeStore((state) => state.loadSavedTheme);
  const { loadSettings, isLockEnabled, isUnlocked, isLoaded } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadSavedTheme();
    loadSettings();
  }, [loadSavedTheme, loadSettings]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="subcategory/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="reader/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="bookmarks/index" options={{ headerShown: false }} />
            <Stack.Screen name="notes/index" options={{ headerShown: false }} />
            <Stack.Screen name="recycle-bin/index" options={{ headerShown: false }} />
            <Stack.Screen name="storage/index" options={{ headerShown: false }} />
            <Stack.Screen name="flashcards/index" options={{ headerShown: false }} />
          </Stack>

          {/* Absolute Lock Screen overlay when app is secured */}
          {isLoaded && isLockEnabled && !isUnlocked && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 9999 }]}>
              <LockScreen />
            </View>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
