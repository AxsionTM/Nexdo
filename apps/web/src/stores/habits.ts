import { create } from 'zustand';
import { api } from '@/lib/api';

interface Habit {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  frequency: string;
  targetCount: number;
  targetDays: number[];
  logs: any[];
  streak: number;
  completedToday: boolean;
  todayCount: number;
}

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  createHabit: (data: any) => Promise<Habit>;
  updateHabit: (id: string, data: any) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleToday: (id: string) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const { habits } = await api.getHabits();
      set({ habits, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createHabit: async (data) => {
    const { habit } = await api.createHabit(data);
    await get().fetchHabits();
    return habit;
  },

  updateHabit: async (id, data) => {
    await api.updateHabit(id, data);
    await get().fetchHabits();
  },

  deleteHabit: async (id) => {
    await api.deleteHabit(id);
    await get().fetchHabits();
  },

  toggleToday: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;
    if (habit.completedToday) {
      await api.unlogHabit(id);
    } else {
      await api.logHabit(id, { count: 1 });
    }
    await get().fetchHabits();
  },
}));
