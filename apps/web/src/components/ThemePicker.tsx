'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { APP_THEMES, type AppThemeId } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Palette, Check } from 'lucide-react';

function applyThemeClass(theme: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const themed = ['ocean', 'forest', 'crimson', 'violet'];
  themed.forEach((t) => root.classList.remove(`theme-${t}`));
  if (themed.includes(theme)) {
    root.classList.add(`theme-${theme}`);
    root.classList.add('dark');
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  }
}

export function ThemePicker({ compact }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoverId, setHoverId] = useState<AppThemeId | null>(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeClass(theme || resolvedTheme || 'dark');
  }, [theme, resolvedTheme, mounted]);

  if (!mounted) return null;

  const current = (theme as AppThemeId) || 'dark';
  const hoverTheme = APP_THEMES.find((t) => t.id === hoverId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
          compact && 'justify-center'
        )}
      >
        <Palette className="h-4 w-4" />
        {!compact && <span>Тема</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-[110] w-64 rounded-xl border bg-card shadow-2xl p-3 tf-glow-border">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Выберите тему</p>
            <div className="grid grid-cols-2 gap-2">
              {APP_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onMouseEnter={(e) => {
                    setHoverId(t.id);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPreviewPos({ x: rect.right + 12, y: rect.top });
                  }}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => {
                    setTheme(t.id);
                    applyThemeClass(t.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative rounded-lg border p-2 text-left transition-all hover:scale-[1.02]',
                    current === t.id && 'ring-2 ring-primary border-primary'
                  )}
                >
                  <div
                    className="h-14 rounded-md overflow-hidden flex border border-black/10 mb-1.5"
                    style={{ background: t.preview.bg }}
                  >
                    <div
                      className="w-[30%] h-full border-r border-white/10"
                      style={{ background: t.preview.sidebar }}
                    >
                      <div
                        className="h-1.5 w-6 rounded-sm m-1 opacity-80"
                        style={{ background: t.preview.primary }}
                      />
                      <div className="h-1 w-5 rounded-sm mx-1 mb-0.5 bg-white/20" />
                      <div className="h-1 w-4 rounded-sm mx-1 bg-white/10" />
                    </div>
                    <div className="flex-1 p-1">
                      <div
                        className="h-2 w-8 rounded-sm mb-1 opacity-90"
                        style={{ background: t.preview.primary }}
                      />
                      <div className="h-1.5 w-full rounded-sm bg-white/10 mb-0.5" />
                      <div className="h-1.5 w-3/4 rounded-sm bg-white/5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <p className="text-[11px] font-medium leading-tight">{t.label}</p>
                      <p className="text-[9px] text-muted-foreground">{t.description}</p>
                    </div>
                    {current === t.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fixed preview above everything */}
          {hoverTheme && (
            <div
              className="fixed z-[120] pointer-events-none"
              style={{ left: previewPos.x, top: previewPos.y }}
            >
              <div
                className="w-52 h-32 rounded-xl border-2 shadow-2xl overflow-hidden flex ring-2 ring-primary/40"
                style={{ background: hoverTheme.preview.bg, borderColor: hoverTheme.preview.primary }}
              >
                <div
                  className="w-16 h-full border-r border-white/10 p-1.5"
                  style={{ background: hoverTheme.preview.sidebar }}
                >
                  <div
                    className="h-2.5 w-10 rounded mb-1.5"
                    style={{ background: hoverTheme.preview.primary }}
                  />
                  <div className="space-y-1">
                    <div className="h-1.5 w-12 rounded bg-white/25" />
                    <div className="h-1.5 w-10 rounded bg-white/15" />
                    <div className="h-1.5 w-11 rounded bg-white/10" />
                  </div>
                </div>
                <div className="flex-1 p-2">
                  <div
                    className="text-[10px] font-semibold mb-1.5"
                    style={{ color: hoverTheme.preview.primary }}
                  >
                    TaskFlow · {hoverTheme.label}
                  </div>
                  <div className="h-2.5 w-24 rounded bg-white/15 mb-1.5" />
                  <div className="h-10 rounded-md bg-white/5 border border-white/10" />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
