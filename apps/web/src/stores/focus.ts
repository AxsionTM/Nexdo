import { create } from 'zustand';
import { api } from '@/lib/api';

interface FocusState {
  isRunning: boolean;
  isPaused: boolean;
  mode: 'work' | 'break';
  workMinutes: number;
  breakMinutes: number;
  remainingSeconds: number;
  /** Absolute timestamp when current segment ends (for background accuracy) */
  endsAt: number | null;
  completedPomodoros: number;
  sessions: any[];
  stats: { totalMinutes: number; totalSessions: number; averageMinutes: number } | null;

  setWorkMinutes: (m: number) => void;
  setBreakMinutes: (m: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  /** Sync remaining from endsAt — call every second from global ticker */
  tick: () => void;
  completeSession: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchSessions: () => Promise<void>;
}

function formatRemaining(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 1) return `${m}м`;
  return `${s}с`;
}

export { formatRemaining };

export const useFocusStore = create<FocusState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  mode: 'work',
  workMinutes: 25,
  breakMinutes: 5,
  remainingSeconds: 25 * 60,
  endsAt: null,
  completedPomodoros: 0,
  sessions: [],
  stats: null,

  setWorkMinutes: (m) => {
    const { isRunning } = get();
    if (!isRunning) {
      set({ workMinutes: m, remainingSeconds: Math.round(m * 60), mode: 'work', endsAt: null });
    }
  },

  setBreakMinutes: (m) => set({ breakMinutes: m }),

  start: () => {
    const { workMinutes } = get();
    const total = Math.round(workMinutes * 60);
    set({
      isRunning: true,
      isPaused: false,
      mode: 'work',
      remainingSeconds: total,
      endsAt: Date.now() + total * 1000,
    });
  },

  pause: () => {
    const { endsAt, isRunning } = get();
    if (!isRunning || !endsAt) {
      set({ isPaused: true, endsAt: null });
      return;
    }
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    set({ isPaused: true, remainingSeconds: left, endsAt: null });
  },

  resume: () => {
    const { remainingSeconds } = get();
    set({
      isPaused: false,
      endsAt: Date.now() + remainingSeconds * 1000,
    });
  },

  reset: () => {
    const { workMinutes } = get();
    set({
      isRunning: false,
      isPaused: false,
      mode: 'work',
      remainingSeconds: Math.round(workMinutes * 60),
      endsAt: null,
    });
  },

  tick: () => {
    const { isRunning, isPaused, endsAt, mode, breakMinutes, workMinutes, completedPomodoros } =
      get();
    if (!isRunning || isPaused || !endsAt) return;

    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left <= 0) {
      if (mode === 'work') {
        const breakSec = Math.round(breakMinutes * 60);
        set({
          mode: 'break',
          remainingSeconds: breakSec,
          endsAt: Date.now() + breakSec * 1000,
          completedPomodoros: completedPomodoros + 1,
        });
        get().completeSession();
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Фокус — перерыв', { body: 'Рабочий интервал завершён. Время отдыхать.' });
          } catch {}
        }
      } else {
        const workSec = Math.round(workMinutes * 60);
        set({
          mode: 'work',
          remainingSeconds: workSec,
          endsAt: Date.now() + workSec * 1000,
        });
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Фокус — работа', { body: 'Перерыв окончен. Можно продолжать.' });
          } catch {}
        }
      }
      return;
    }

    set({ remainingSeconds: left });
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
