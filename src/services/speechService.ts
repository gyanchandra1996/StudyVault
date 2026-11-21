import * as Speech from 'expo-speech';

let isCurrentlySpeaking = false;

export async function speakText(
  text: string,
  onDone?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  try {
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    if (!cleanText) return;

    if (isCurrentlySpeaking) {
      await stopSpeaking();
    }

    isCurrentlySpeaking = true;

    Speech.speak(cleanText, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => {
        isCurrentlySpeaking = false;
        onDone?.();
      },
      onStopped: () => {
        isCurrentlySpeaking = false;
        onDone?.();
      },
      onError: (e) => {
        isCurrentlySpeaking = false;
        onError?.(e);
      },
    });
  } catch (err) {
    isCurrentlySpeaking = false;
    onError?.(err);
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    isCurrentlySpeaking = false;
    await Speech.stop();
  } catch {}
}

export async function checkIsSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return isCurrentlySpeaking;
  }
}
