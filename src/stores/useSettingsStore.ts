import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { testGeminiApiKey } from '@/services/geminiService';

const STORAGE_AI_ENABLED_KEY = '@studyvault_ai_enabled';
const STORAGE_GEMINI_KEY = '@studyvault_gemini_api_key';
const STORAGE_AI_MODEL_KEY = '@studyvault_ai_model';
const STORAGE_SHOW_DELETE_KEY = '@studyvault_show_delete_actions';

export type AiModelType = 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0-flash';

interface SettingsState {
  isAiEnabled: boolean;
  geminiApiKey: string;
  aiModel: AiModelType;
  showDeleteActions: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setAiEnabled: (enabled: boolean) => Promise<void>;
  setGeminiApiKey: (key: string) => Promise<void>;
  setAiModel: (model: AiModelType) => Promise<void>;
  setShowDeleteActions: (show: boolean) => Promise<void>;
  testAiConnection: (customKey?: string, customModel?: AiModelType) => Promise<{ success: boolean; message: string }>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isAiEnabled: false,
  geminiApiKey: '',
  aiModel: 'gemini-1.5-flash',
  showDeleteActions: true,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const [aiEnabledStr, apiKey, modelStr, showDeleteStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_AI_ENABLED_KEY),
        AsyncStorage.getItem(STORAGE_GEMINI_KEY),
        AsyncStorage.getItem(STORAGE_AI_MODEL_KEY),
        AsyncStorage.getItem(STORAGE_SHOW_DELETE_KEY),
      ]);

      set({
        isAiEnabled: aiEnabledStr === 'true',
        geminiApiKey: apiKey || '',
        aiModel: (modelStr as AiModelType) || 'gemini-1.5-flash',
        showDeleteActions: showDeleteStr === null ? true : showDeleteStr === 'true',
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Failed to load settings:', e);
      set({ isLoaded: true });
    }
  },

  setAiEnabled: async (enabled: boolean) => {
    set({ isAiEnabled: enabled });
    try {
      await AsyncStorage.setItem(STORAGE_AI_ENABLED_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to save AI enabled setting:', e);
    }
  },

  setGeminiApiKey: async (key: string) => {
    const trimmed = key.trim();
    set({ geminiApiKey: trimmed });
    try {
      await AsyncStorage.setItem(STORAGE_GEMINI_KEY, trimmed);
    } catch (e) {
      console.warn('Failed to save Gemini API key:', e);
    }
  },

  setAiModel: async (model: AiModelType) => {
    set({ aiModel: model });
    try {
      await AsyncStorage.setItem(STORAGE_AI_MODEL_KEY, model);
    } catch (e) {
      console.warn('Failed to save AI model setting:', e);
    }
  },

  setShowDeleteActions: async (show: boolean) => {
    set({ showDeleteActions: show });
    try {
      await AsyncStorage.setItem(STORAGE_SHOW_DELETE_KEY, String(show));
    } catch (e) {
      console.warn('Failed to save show delete actions setting:', e);
    }
  },

  testAiConnection: async (customKey?: string, customModel?: AiModelType) => {
    const key = customKey !== undefined ? customKey.trim() : get().geminiApiKey.trim();
    const model = customModel || get().aiModel;

    if (!key) {
      return { success: false, message: 'Please enter a Gemini API Key first.' };
    }

    return await testGeminiApiKey(key, model);
  },
}));
