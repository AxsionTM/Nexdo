import { create } from 'zustand';
import { api } from '@/lib/api';

interface FocusState {
  isRunning: boolean;
  isPaused: boolean;
  mode: 'work' | 'break';
  workMinutes: number;
  breakMinutes: number;
  remainingSeconds: number;
  completedPomodoros: number;
  sessions: any[];
  stats: { totalMinutes: number; totalSessions: number; averageMinutes: number } | null;

  setWorkMinutes: (m: number) => void;
  setBreakMinutes: (m: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  completeSession: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchSessions: () => Promise<void>;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  mode: 'work',
  workMinutes: 25,
  breakMinutes: 5,
  remainingSeconds: 25 * 60,
  completedPomodoros: 0,
  sessions: [],
  stats: null,

  setWorkMinutes: (m) => {
    const { isRunning } = get();
    if (!isRunning) {
      set({ workMinutes: m, remainingSeconds: m * 60, mode: 'work' });
    }
  },

  setBreakMinutes: (m) => set({ breakMinutes: m }),

  start: () => {
    const { workMinutes } = get();
    set({
      isRunning: true,
      isPaused: false,
      mode: 'work',
      remainingSeconds: workMinutes * 60,
    });
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  reset: () => {
    const { workMinutes } = get();
    set({
      isRunning: false,
      isPaused: false,
      mode: 'work',
      remainingSeconds: workMinutes * 60,
    });
  },

  tick: () => {
    const { remainingSeconds, isRunning, isPaused, mode, breakMinutes, workMinutes, completedPomodoros } =
      get();
    if (!isRunning || isPaused) return;

    if (remainingSeconds <= 1) {
      if (mode === 'work') {
        set({
          mode: 'break',
          remainingSeconds: breakMinutes * 60,
          completedPomodoros: completedPomodoros + 1,
        });
        get().completeSession();
      } else {
        set({
          mode: 'work',
          remainingSeconds: workMinutes * 60,
        });
      }
      return;
    }

    set({ remainingSeconds: remainingSeconds - 1 });
  },

  completeSession: async () => {
    const { workMinutes } = get();
    const now = new Date();
    const started = new Date(now.getTime() - workMinutes * 60 * 1000);
    try {
      await api.createFocusSession({
        durationMin: workMinutes,
        type: 'pomodoro',
        startedAt: started.toISOString(),
        endedAt: now.toISOString(),
      });
      await get().fetchStats();
      await get().fetchSessions();
    } catch {}
  },

  fetchStats: async () => {
    try {
      const stats = await api.getFocusStats();
      set({ stats });
    } catch {}
  },

  fetchSessions: async () => {
    try {
      const { sessions } = await api.getFocusSessions();
      set({ sessions });
    } catch {}
  },
}));
