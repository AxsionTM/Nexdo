'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useEffectsStore, initEffectsFromStorage } from '@/stores/effects';

const STAR_COUNT = 36;

export function EffectsLayer() {
  const enabled = useEffectsStore((s) => s.enabled);
  const { theme, resolvedTheme } = useTheme();
  const [stars, setStars] = useState<
    { id: number; left: number; top: number; size: number; delay: number; dur: number }[]
  >([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initEffectsFromStorage();
    setMounted(true);
    setStars(
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 8,
        dur: 4 + Math.random() * 8,
      }))
    );
  }, []);

  if (!mounted || !enabled) return null;

  const t = theme || resolvedTheme || 'dark';
  const glowColor =
    t === 'ocean'
      ? 'rgba(56,189,248,0.7)'
      : t === 'forest'
        ? 'rgba(74,222,128,0.7)'
        : t === 'crimson'
          ? 'rgba(248,113,113,0.7)'
          : t === 'violet'
            ? 'rgba(192,132,252,0.7)'
            : t === 'light'
              ? 'rgba(59,130,246,0.45)'
              : 'rgba(96,165,250,0.55)';

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full tf-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: glowColor,
            boxShadow: `0 0 ${s.size * 3}px ${glowColor}`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
