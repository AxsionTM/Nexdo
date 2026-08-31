import { create } from 'zustand';

interface EffectsState {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
}

const KEY = 'tf-effects';

function load(): boolean {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(KEY);
  if (v === null) return true;
  return v === '1';
}

export const useEffectsStore = create<EffectsState>((set, get) => ({
  enabled: true,
  toggle: () => {
    const next = !get().enabled;
    if (typeof window !== 'undefined') localStorage.setItem(KEY, next ? '1' : '0');
    set({ enabled: next });
  },
  setEnabled: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, v ? '1' : '0');
    set({ enabled: v });
  },
}));

export function initEffectsFromStorage() {
  useEffectsStore.getState().setEnabled(load());
}
