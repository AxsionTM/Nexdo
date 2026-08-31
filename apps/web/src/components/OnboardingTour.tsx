'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tf-tour-done';

type Step = {
  id: string;
  title: string;
  body: string;
  /** CSS selector for highlight target; null = center card */
  target: string | null;
  placement?: 'right' | 'left' | 'bottom' | 'top' | 'center';
};

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в TaskFlow',
    body: 'Краткий обзор за минуту. Можно пропустить в любой момент или пройти по шагам.',
    target: null,
    placement: 'center',
  },
  {
    id: 'sidebar',
    title: 'Навигация',
    body: 'Слева — разделы: Сегодня, Повестка, проекты и другие списки. Здесь же привычки, цели, фокус и пульс.',
    target: '[data-tour="sidebar"]',
    placement: 'right',
  },
  {
    id: 'projects',
    title: 'Проекты',
    body: 'Создавайте проекты кнопкой «+». Входящие — для задач без проекта. Наведите на проект, чтобы удалить.',
    target: '[data-tour="projects"]',
    placement: 'right',
  },
  {
    id: 'add-task',
    title: 'Задачи',
    body: '«Добавить задачу» открывает карточку: название, приоритет, проект и срок. Без даты задача останется во Входящих.',
    target: '[data-tour="add-task"]',
    placement: 'bottom',
  },
  {
    id: 'views',
    title: 'Виды списка',
    body: 'Переключайте Список, Канбан, Календарь и Матрицу — удобный формат для разных сценариев.',
    target: '[data-tour="views"]',
    placement: 'bottom',
  },
  {
    id: 'focus',
    title: 'Фокус и привычки',
    body: 'Фокус — таймер помидора (работает в фоне). Привычки и цели — для регулярности и долгосрочных результатов.',
    target: '[data-tour="modules"]',
    placement: 'right',
  },
  {
    id: 'theme',
    title: 'Тема и эффекты',
    body: 'Выберите оформление и включите эффекты — свечение и частицы под цвет темы. Всё внизу сайдбара.',
    target: '[data-tour="theme"]',
    placement: 'right',
  },
  {
    id: 'done',
    title: 'Готово',
    body: 'Можно начинать. Подсказки больше не появятся. Удачной работы с TaskFlow!',
    target: null,
    placement: 'center',
  },
];

function getRect(selector: string | null): DOMRect | null {
  if (!selector || typeof document === 'undefined') return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
      // slight delay so layout is ready
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    } catch {
      setOpen(true);
    }
  }, []);

  const current = STEPS[step];

  const updateRect = useCallback(() => {
    if (!current) return;
    setRect(getRect(current.target));
  }, [current]);

  useEffect(() => {
    if (!open) return;
    updateRect();
    const onResize = () => updateRect();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, step, updateRect]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setOpen(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const skip = () => finish();

  if (!mounted || !open || !current) return null;

  const pad = 8;
  const highlight = rect
    ? {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  let tipStyle: React.CSSProperties = {};
  if (current.placement === 'center' || !highlight) {
    tipStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  } else if (current.placement === 'right') {
    tipStyle = {
      top: Math.min(highlight.top, window.innerHeight - 220),
      left: highlight.left + highlight.width + 12,
      maxWidth: 320,
    };
    if ((tipStyle.left as number) + 320 > window.innerWidth) {
      tipStyle.left = Math.max(12, highlight.left - 332);
    }
  } else if (current.placement === 'bottom') {
    tipStyle = {
      top: highlight.top + highlight.height + 12,
      left: Math.min(highlight.left, window.innerWidth - 340),
      maxWidth: 320,
    };
  } else if (current.placement === 'top') {
    tipStyle = {
      top: Math.max(12, highlight.top - 180),
      left: Math.min(highlight.left, window.innerWidth - 340),
      maxWidth: 320,
    };
  }

  const content = (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop with hole */}
      <div className="absolute inset-0 bg-black/55" onClick={skip} />
      {highlight && (
        <div
          className="absolute rounded-xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none z-[201]"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 0 24px hsl(var(--primary) / 0.5)',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className={cn(
          'absolute z-[202] w-[min(100%-24px,320px)] rounded-xl border bg-card text-card-foreground shadow-2xl p-4',
          current.placement === 'center' && 'w-[min(100%-24px,380px)]'
        )}
        style={tipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {step + 1} / {STEPS.length}
            </p>
            <h3 className="text-sm font-semibold mt-0.5">{current.title}</h3>
          </div>
          <button
            type="button"
            onClick={skip}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{current.body}</p>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={skip}>
            Пропустить
          </Button>
          <Button type="button" size="sm" onClick={next}>
            {step >= STEPS.length - 1 ? 'Начать' : 'Далее'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
