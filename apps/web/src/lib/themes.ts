export type AppThemeId =
  | 'light'
  | 'dark'
  | 'ocean'
  | 'forest'
  | 'crimson'
  | 'violet';

export interface AppTheme {
  id: AppThemeId;
  label: string;
  description: string;
  /** Tailwind-ish preview colors */
  preview: {
    bg: string;
    sidebar: string;
    primary: string;
    accent: string;
  };
}

export const APP_THEMES: AppTheme[] = [
  {
    id: 'light',
    label: 'Светлая',
    description: 'Минималистичная',
    preview: { bg: '#f8fafc', sidebar: '#ffffff', primary: '#3b82f6', accent: '#e2e8f0' },
  },
  {
    id: 'dark',
    label: 'Тёмная',
    description: 'Классическая',
    preview: { bg: '#0f172a', sidebar: '#1e293b', primary: '#3b82f6', accent: '#334155' },
  },
  {
    id: 'ocean',
    label: 'Океан',
    description: 'Неоново-синяя',
    preview: { bg: '#020617', sidebar: '#0c1929', primary: '#38bdf8', accent: '#0ea5e9' },
  },
  {
    id: 'forest',
    label: 'Лес',
    description: 'Зелёная природа',
    preview: { bg: '#052e16', sidebar: '#14532d', primary: '#4ade80', accent: '#22c55e' },
  },
  {
    id: 'crimson',
    label: 'Энергия',
    description: 'Красная',
    preview: { bg: '#1a0505', sidebar: '#3f0a0a', primary: '#f87171', accent: '#ef4444' },
  },
  {
    id: 'violet',
    label: 'Неон',
    description: 'Фиолетовый киберпанк',
    preview: { bg: '#0c0118', sidebar: '#1a0a2e', primary: '#c084fc', accent: '#a855f7' },
  },
];
