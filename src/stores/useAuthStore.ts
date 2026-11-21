import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const STORAGE_LOCK_ENABLED_KEY = '@studyvault_lock_enabled';
const STORAGE_LOCK_TYPE_KEY = '@studyvault_lock_type';
const STORAGE_PIN_KEY = '@studyvault_pin_code';

export type LockType = 'pin' | 'biometric' | 'both';

interface AuthState {
  isLockEnabled: boolean;
  lockType: LockType;
  pinCode: string | null;
  isUnlocked: boolean;
  isBiometricSupported: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setLockConfig: (enabled: boolean, type: LockType, pin?: string) => Promise<void>;
  unlockWithPin: (pin: string) => boolean;
  authenticateBiometric: () => Promise<boolean>;
  lockApp: () => void;
  checkBiometrics: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLockEnabled: false,
  lockType: 'biometric',
  pinCode: null,
  isUnlocked: true,
  isBiometricSupported: false,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const [enabledStr, typeStr, pin] = await Promise.all([
        AsyncStorage.getItem(STORAGE_LOCK_ENABLED_KEY),
        AsyncStorage.getItem(STORAGE_LOCK_TYPE_KEY),
        AsyncStorage.getItem(STORAGE_PIN_KEY),
      ]);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const isBiometricSupported = hasHardware && isEnrolled;

      const isLockEnabled = enabledStr === 'true';
      const lockType = (typeStr as LockType) || 'biometric';

      set({
        isLockEnabled,
        lockType,
        pinCode: pin || null,
        isUnlocked: !isLockEnabled, // Locked by default if lock is enabled
        isBiometricSupported,
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load auth settings:', e);
      set({ isUnlocked: true, isLoaded: true });
    }
  },

  checkBiometrics: async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supported = hasHardware && isEnrolled;
      set({ isBiometricSupported: supported });
      return supported;
    } catch {
      return false;
    }
  },

  setLockConfig: async (enabled: boolean, type: LockType, pin?: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_LOCK_ENABLED_KEY, String(enabled));
      await AsyncStorage.setItem(STORAGE_LOCK_TYPE_KEY, type);
      if (pin) {
        await AsyncStorage.setItem(STORAGE_PIN_KEY, pin);
      } else if (!enabled) {
        await AsyncStorage.removeItem(STORAGE_PIN_KEY);
      }
      set({
        isLockEnabled: enabled,
        lockType: type,
        pinCode: pin || null,
        isUnlocked: true,
      });
    } catch (e) {
      console.warn('Failed to save lock settings:', e);
    }
  },

  unlockWithPin: (pin: string) => {
    const { pinCode } = get();
    if (pinCode && pin === pinCode) {
      set({ isUnlocked: true });
      return true;
    }
    return false;
  },

  authenticateBiometric: async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock StudyVault',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        set({ isUnlocked: true });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Biometric auth error:', e);
      return false;
    }
  },

  lockApp: () => {
    const { isLockEnabled } = get();
    if (isLockEnabled) {
      set({ isUnlocked: false });
    }
  },
}));
