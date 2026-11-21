import { create } from 'zustand';
import * as studyTimerRepo from '@/db/studyTimerRepo';

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroState {
  mode: PomodoroMode;
  isActive: boolean;
  timeLeft: number;
  workDurationMinutes: number;
  breakDurationMinutes: number;
  longBreakDurationMinutes: number;
  isModalVisible: boolean;
  activePdfId: number | null;
  activeCategoryId: number | null;

  // Actions
  setMode: (mode: PomodoroMode) => void;
  toggleTimer: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setDurations: (workMins: number, breakMins?: number) => void;
  setModalVisible: (visible: boolean) => void;
  setActiveContext: (pdfId?: number | null, categoryId?: number | null) => void;
  onTimerComplete: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'work',
  isActive: false,
  timeLeft: 25 * 60,
  workDurationMinutes: 25,
  breakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  isModalVisible: false,
  activePdfId: null,
  activeCategoryId: null,

  setMode: (mode: PomodoroMode) => {
    const { workDurationMinutes, breakDurationMinutes, longBreakDurationMinutes } = get();
    let durationSecs = workDurationMinutes * 60;
    if (mode === 'shortBreak') durationSecs = breakDurationMinutes * 60;
    if (mode === 'longBreak') durationSecs = longBreakDurationMinutes * 60;

    set({
      mode,
      isActive: false,
      timeLeft: durationSecs,
    });
  },

  toggleTimer: () => {
    set((state) => ({ isActive: !state.isActive }));
  },

  startTimer: () => {
    set({ isActive: true });
  },

  pauseTimer: () => {
    set({ isActive: false });
  },

  resetTimer: () => {
    const { mode, workDurationMinutes, breakDurationMinutes, longBreakDurationMinutes } = get();
    let durationSecs = workDurationMinutes * 60;
    if (mode === 'shortBreak') durationSecs = breakDurationMinutes * 60;
    if (mode === 'longBreak') durationSecs = longBreakDurationMinutes * 60;

    set({
      isActive: false,
      timeLeft: durationSecs,
    });
  },

  tick: () => {
    const { timeLeft, isActive } = get();
    if (!isActive) return;

    if (timeLeft <= 1) {
      get().onTimerComplete();
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  setDurations: (workMins: number, breakMins: number = 5) => {
    const safeWork = Math.max(1, Math.min(180, workMins));
    const safeBreak = Math.max(1, Math.min(60, breakMins));
    const { mode } = get();

    set({
      workDurationMinutes: safeWork,
      breakDurationMinutes: safeBreak,
      timeLeft: mode === 'work' ? safeWork * 60 : safeBreak * 60,
      isActive: false,
    });
  },

  setModalVisible: (visible: boolean) => {
    set({ isModalVisible: visible });
  },

  setActiveContext: (pdfId?: number | null, categoryId?: number | null) => {
    set({
      activePdfId: pdfId ?? null,
      activeCategoryId: categoryId ?? null,
    });
  },

  onTimerComplete: () => {
    const { mode, workDurationMinutes, activePdfId, activeCategoryId } = get();
    set({ isActive: false });

    if (mode === 'work') {
      try {
        studyTimerRepo.recordStudySession(
          activePdfId,
          activeCategoryId,
          workDurationMinutes * 60,
          'pomodoro'
        );
      } catch (err) {
        console.warn('Failed to record completed study session:', err);
      }
      get().setMode('shortBreak');
    } else {
      get().setMode('work');
    }
  },
}));
