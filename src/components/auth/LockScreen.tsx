import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';

export function LockScreen() {
  const { colors } = useTheme();
  const { lockType, unlockWithPin, authenticateBiometric, isBiometricSupported } = useAuthStore();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMsg('');
      if (next.length === 4) {
        const success = unlockWithPin(next);
        if (!success) {
          setErrorMsg('Incorrect PIN code');
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="lock-closed" size={36} color={colors.primary} />
        </View>
        <Text style={[TYPOGRAPHY.h2, { color: colors.text, marginTop: 16 }]}>StudyVault Locked</Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, marginTop: 8 }]}>
          Enter your 4-digit PIN to continue
        </Text>
      </View>

      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((index) => {
          const filled = index < pinInput.length;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  borderColor: colors.primary,
                  backgroundColor: filled ? colors.primary : 'transparent',
                },
              ]}
            />
          );
        })}
      </View>

      {errorMsg ? (
        <Text style={[TYPOGRAPHY.bodyBold, { color: colors.error, textAlign: 'center', marginTop: 12 }]}>
          {errorMsg}
        </Text>
      ) : null}

      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((digit) => (
              <Pressable
                key={digit}
                onPress={() => handleDigit(digit)}
                style={({ pressed }) => [
                  styles.keypadButton,
                  {
                    backgroundColor: pressed ? colors.surfaceVariant : colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>{digit}</Text>
              </Pressable>
            ))}
          </View>
        ))}

        <View style={styles.keypadRow}>
          {isBiometricSupported && lockType !== 'pin' ? (
            <Pressable
              onPress={authenticateBiometric}
              style={({ pressed }) => [
                styles.keypadButton,
                {
                  backgroundColor: pressed ? colors.surfaceVariant : colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="finger-print" size={28} color={colors.primary} />
            </Pressable>
          ) : (
            <View style={styles.keypadPlaceholder} />
          )}

          <Pressable
            onPress={() => handleDigit('0')}
            style={({ pressed }) => [
              styles.keypadButton,
              {
                backgroundColor: pressed ? colors.surfaceVariant : colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>0</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.keypadButton,
              {
                backgroundColor: pressed ? colors.surfaceVariant : colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="backspace-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadPlaceholder: {
    width: 72,
    height: 72,
  },
});
