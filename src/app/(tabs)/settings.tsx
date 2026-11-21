import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TYPOGRAPHY } from '@/theme/typography';
import { Header } from '@/components/common/Header';
import { exportFullAppBackup, restoreAppFromBackup } from '@/services/backupService';
import { AccentColorKey } from '@/theme/colors';

export default function SettingsScreen() {
  const { colors, mode, setMode, accent, setAccent, accentPalettes } = useTheme();
  const {
    isLockEnabled,
    setLockConfig,
    checkBiometrics,
  } = useAuthStore();
  const loadAll = useAppStore((state) => state.loadAll);
  const {
    isAiEnabled,
    geminiApiKey,
    aiModel,
    showDeleteActions,
    setAiEnabled,
    setGeminiApiKey,
    setAiModel,
    setShowDeleteActions,
    testAiConnection,
  } = useSettingsStore();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);

  useEffect(() => {
    setApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  const handleSaveApiKey = async () => {
    await setGeminiApiKey(apiKeyInput.trim());
    Alert.alert('Saved', 'Gemini API Key saved successfully.');
  };

  const handleTestAi = async () => {
    const keyToTest = apiKeyInput.trim() || geminiApiKey.trim();
    if (!keyToTest) {
      Alert.alert('API Key Required', 'Please enter your Gemini API Key before testing.');
      return;
    }
    setIsTestingAi(true);
    try {
      const result = await testAiConnection(keyToTest, aiModel);
      if (result.success) {
        await setGeminiApiKey(keyToTest);
        Alert.alert('✓ Success', result.message);
      } else {
        Alert.alert('Test Failed', result.message);
      }
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await exportFullAppBackup();
      Alert.alert('Backup Created', 'Backup archive has been generated and ready to save.');
    } catch (e: any) {
      Alert.alert('Backup Error', e?.message || 'Failed to create backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Backup?',
      'Restoring from a backup will replace current study documents and categories with the backup content. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose Backup ZIP',
          onPress: async () => {
            setIsRestoring(true);
            try {
              const res = await restoreAppFromBackup();
              if (res.success) {
                await loadAll();
                Alert.alert('Restore Complete', res.message);
              } else if (res.message !== 'Restore cancelled.') {
                Alert.alert('Restore Failed', res.message);
              }
            } catch (e: any) {
              Alert.alert('Restore Error', e?.message || 'Failed to restore.');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleLock = async (enabled: boolean) => {
    if (enabled) {
      // Prompt for PIN setup
      setInputPin('');
      setConfirmPin('');
      setPinError('');
      setPinModalVisible(true);
    } else {
      await setLockConfig(false, 'pin');
    }
  };

  const handleSavePin = async () => {
    if (inputPin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (inputPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    const hasBio = await checkBiometrics();
    await setLockConfig(true, hasBio ? 'both' : 'pin', inputPin);
    setPinModalVisible(false);
    Alert.alert('Security Enabled', 'App Lock with 4-digit PIN has been enabled.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Settings" subtitle="Preferences, Backup & Security" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* APPEARANCE SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
            APPEARANCE & THEME
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Theme Mode Segment */}
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Theme Mode</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System Default'}
                </Text>
              </View>
            </View>

            <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceVariant }]}>
              {(['light', 'dark', 'system'] as const).map((m) => {
                const isActive = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.segmentBtn,
                      isActive && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
                    ]}
                  >
                    <Text
                      style={[
                        TYPOGRAPHY.tiny,
                        { color: isActive ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                      ]}
                    >
                      {m.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Accent Color Palette */}
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Accent Color</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  {accentPalettes[accent].name}
                </Text>
              </View>
            </View>

            <View style={styles.accentColorsRow}>
              {(Object.keys(accentPalettes) as AccentColorKey[]).map((key) => {
                const item = accentPalettes[key];
                const isSelected = accent === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setAccent(key)}
                    style={[
                      styles.accentCircle,
                      { backgroundColor: item.primary },
                      isSelected && [styles.accentCircleSelected, { borderColor: colors.text }],
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* SECURITY SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
            SECURITY & PRIVACY
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>App Lock (PIN)</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Require 4-digit PIN or biometrics
                </Text>
              </View>
            </View>

            <Switch
              value={isLockEnabled}
              onValueChange={handleToggleLock}
              thumbColor={isLockEnabled ? colors.primary : colors.surfaceVariant}
              trackColor={{ false: colors.cardBorder, true: `${colors.primary}60` }}
            />
          </View>

          {isLockEnabled && (
            <Pressable
              onPress={() => {
                setInputPin('');
                setConfirmPin('');
                setPinError('');
                setPinModalVisible(true);
              }}
              style={[
                styles.row,
                { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 },
              ]}
            >
              <Text style={[TYPOGRAPHY.body, { color: colors.primary }]}>Change 4-Digit PIN</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {/* AI ASSISTANT & QUESTION GENERATOR */}
        <View style={styles.sectionHeader}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
            AI ASSISTANT & QUESTION GENERATOR
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* AI Enable Toggle */}
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="sparkles" size={22} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Enable AI Features</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  {isAiEnabled ? 'Active (Gemini Question Generator)' : 'Disabled'}
                </Text>
              </View>
            </View>

            <Switch
              value={isAiEnabled}
              onValueChange={setAiEnabled}
              thumbColor={isAiEnabled ? colors.primary : colors.surfaceVariant}
              trackColor={{ false: colors.cardBorder, true: `${colors.primary}60` }}
            />
          </View>

          {isAiEnabled && (
            <>
              {/* Gemini API Key */}
              <View style={[styles.aiInputRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
                    GOOGLE GEMINI API KEY
                  </Text>
                  <Pressable onPress={() => setShowApiKey(!showApiKey)} hitSlop={6}>
                    <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '700' }]}>
                      {showApiKey ? 'Hide Key' : 'Show Key'}
                    </Text>
                  </Pressable>
                </View>

                <View style={[styles.apiKeyInputContainer, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}>
                  <TextInput
                    value={apiKeyInput}
                    onChangeText={setApiKeyInput}
                    placeholder="Paste Gemini API Key..."
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showApiKey}
                    style={[styles.apiKeyInput, TYPOGRAPHY.body, { color: colors.text }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={handleSaveApiKey}
                    style={[styles.saveKeyBtn, { backgroundColor: colors.primary }]}
                    hitSlop={4}
                  >
                    <Text style={[TYPOGRAPHY.captionBold, { color: '#FFFFFF' }]}>Save</Text>
                  </Pressable>
                </View>
                <Text style={[TYPOGRAPHY.tiny, { color: colors.textMuted, marginTop: 4 }]}>
                  Get a free API key from Google AI Studio (aistudio.google.com).
                </Text>
              </View>

              {/* Model Selector */}
              <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={styles.rowLabelGroup}>
                  <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>AI Model</Text>
                    <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                      {aiModel === 'gemini-1.5-flash' ? '1.5 Flash (Fast & Free)' : '1.5 Pro (Deep)'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceVariant }]}>
                  {(['gemini-1.5-flash', 'gemini-1.5-pro'] as const).map((m) => {
                    const isSelected = aiModel === m;
                    const label = m === 'gemini-1.5-flash' ? 'Flash' : 'Pro';
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setAiModel(m)}
                        style={[
                          styles.segmentBtn,
                          isSelected && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
                        ]}
                      >
                        <Text
                          style={[
                            TYPOGRAPHY.tiny,
                            { color: isSelected ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Test Connection Button */}
              <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 }]}>
                <Pressable
                  onPress={handleTestAi}
                  disabled={isTestingAi}
                  style={[
                    styles.testAiBtn,
                    { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` },
                  ]}
                >
                  {isTestingAi ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="flash-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  )}
                  <Text style={[TYPOGRAPHY.captionBold, { color: colors.primary }]}>
                    {isTestingAi ? 'Verifying Key...' : 'Test AI Connection'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* STUDY SAFETY & DATA PROTECTION (Safe Study Mode) */}
        <View style={styles.sectionHeader}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
            DATA PROTECTION & STUDY SAFETY
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Ionicons
                name={showDeleteActions ? 'trash-outline' : 'shield-checkmark'}
                size={22}
                color={showDeleteActions ? colors.textSecondary : '#10B981'}
              />
              <View style={{ marginLeft: 12, flex: 1, paddingRight: 8 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Show Delete Options</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  {showDeleteActions
                    ? 'Delete buttons visible across cards and exams'
                    : 'Safe Study Mode (Delete buttons hidden to prevent accidents)'}
                </Text>
              </View>
            </View>

            <Switch
              value={showDeleteActions}
              onValueChange={setShowDeleteActions}
              thumbColor={showDeleteActions ? colors.primary : colors.surfaceVariant}
              trackColor={{ false: colors.cardBorder, true: `${colors.primary}60` }}
            />
          </View>
        </View>

        {/* STUDY TOOLS & NAVIGATION TILES */}
        <View style={styles.sectionHeader}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
            STUDY TOOLS & ARCHIVE
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Pressable
            onPress={() => router.push('/bookmarks')}
            style={({ pressed }) => [
              styles.navRow,
              { backgroundColor: pressed ? colors.surfaceVariant : 'transparent' },
            ]}
          >
            <View style={styles.rowLabelGroup}>
              <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginLeft: 12 }]}>
                All Bookmarks
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/notes')}
            style={({ pressed }) => [
              styles.navRow,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: pressed ? colors.surfaceVariant : 'transparent',
              },
            ]}
          >
            <View style={styles.rowLabelGroup}>
              <Ionicons name="create-outline" size={22} color="#0D9488" />
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginLeft: 12 }]}>
                Study Notes & Annotations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/storage')}
            style={({ pressed }) => [
              styles.navRow,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: pressed ? colors.surfaceVariant : 'transparent',
              },
            ]}
          >
            <View style={styles.rowLabelGroup}>
              <Ionicons name="pie-chart-outline" size={22} color="#2563EB" />
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginLeft: 12 }]}>
                Storage Usage Dashboard
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/recycle-bin')}
            style={({ pressed }) => [
              styles.navRow,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: pressed ? colors.surfaceVariant : 'transparent',
              },
            ]}
          >
            <View style={styles.rowLabelGroup}>
              <Ionicons name="trash-bin-outline" size={22} color="#E11D48" />
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginLeft: 12 }]}>
                Recycle Bin
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* BACKUP & RESTORE SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
            OFFLINE BACKUP & RESTORE
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Pressable
            onPress={handleBackup}
            disabled={isBackingUp}
            style={({ pressed }) => [
              styles.navRow,
              { backgroundColor: pressed ? colors.surfaceVariant : 'transparent' },
            ]}
          >
            <View style={styles.rowLabelGroup}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>Export Full Backup</Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  ZIP archive of SQLite database + all PDF notes
                </Text>
              </View>
            </View>
            {isBackingUp ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="download-outline" size={20} color={colors.primary} />
            )}
          </Pressable>

          <Pressable
            onPress={handleRestore}
            disabled={isRestoring}
            style={({ pressed }) => [
              styles.navRow,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: pressed ? colors.surfaceVariant : 'transparent',
              },
            ]}
          >
            <View style={styles.rowLabelGroup}>
              <Ionicons name="cloud-download-outline" size={22} color="#D97706" />
              <View style={{ marginLeft: 12 }}>
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}>
                  Restore from Backup ZIP
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Import study documents and annotations
                </Text>
              </View>
            </View>
            {isRestoring ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="#D97706" />
            )}
          </Pressable>
        </View>

        {/* ABOUT & APP INFO */}
        <View style={styles.aboutContainer}>
          <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
            StudyVault v1.0.0
          </Text>
          <Text
            style={[
              TYPOGRAPHY.tiny,
              { color: colors.textMuted, textAlign: 'center', marginTop: 4, maxWidth: 300 },
            ]}
          >
            100% Offline-First Architecture. All notes, SQLite database, and documents are stored
            locally on your Android device.
          </Text>
        </View>
      </ScrollView>

      {/* PIN Setup Modal */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.pinModalContainer,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[TYPOGRAPHY.h3, { color: colors.text, textAlign: 'center' }]}>
              Set 4-Digit Security PIN
            </Text>
            <Text
              style={[
                TYPOGRAPHY.caption,
                { color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
              ]}
            >
              Enter a 4-digit PIN to lock StudyVault
            </Text>

            <View style={styles.pinInputsArea}>
              <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary }]}>
                NEW PIN
              </Text>
              <TextInput
                value={inputPin}
                onChangeText={setInputPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="4 digits"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.pinInput,
                  TYPOGRAPHY.h2,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
              />

              <Text
                style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginTop: 12 }]}
              >
                CONFIRM PIN
              </Text>
              <TextInput
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="Repeat 4 digits"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.pinInput,
                  TYPOGRAPHY.h2,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>

            {pinError ? (
              <Text
                style={[
                  TYPOGRAPHY.captionBold,
                  { color: colors.error, textAlign: 'center', marginTop: 8 },
                ]}
              >
                {pinError}
              </Text>
            ) : null}

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setPinModalVisible(false)}
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSavePin}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Save PIN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    elevation: 2,
  },
  accentColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: 200,
    justifyContent: 'flex-end',
  },
  accentCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentCircleSelected: {
    borderWidth: 2,
  },
  aiInputRow: {
    padding: 16,
  },
  apiKeyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  apiKeyInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
  },
  saveKeyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 4,
    borderRadius: 8,
  },
  testAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  aboutContainer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pinModalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  pinInputsArea: {
    marginTop: 16,
  },
  pinInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
