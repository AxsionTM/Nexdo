'use client';

import { useEffect, useState } from 'react';
import { useHabitsStore } from '@/stores/habits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, Flame, Check, Trash2, Loader2, X } from 'lucide-react';

const COLORS = ['#4A90D9', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

function Heatmap({ logs, color }: { logs: any[]; color: string }) {
  const days = 35;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logSet = new Set(
    logs.map((l) => new Date(l.date).toISOString().slice(0, 10))
  );

  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const done = logSet.has(key);
    cells.push(
      <div
        key={key}
        title={key}
        className="h-3 w-3 rounded-sm"
        style={{
          backgroundColor: done ? color : 'hsl(var(--muted))',
          opacity: done ? 1 : 0.4,
        }}
      />
    );
  }

  return <div className="flex flex-wrap gap-0.5">{cells}</div>;
}

export function HabitsView() {
  const { habits, isLoading, fetchHabits, createHabit, deleteHabit, toggleToday } =
    useHabitsStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createHabit({ name: name.trim(), color });
      setName('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Привычки</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {habits.length}{' '}
            {habits.length === 1 ? 'привычка' : habits.length >= 2 && habits.length <= 4 ? 'привычки' : 'привычек'}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Новая привычка</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Зарядка, Чтение, Медитация"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Цвет:</span>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-5 w-5 rounded-full border-2',
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Создание...' : 'Создать'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Пока нет привычек</p>
            <p className="text-xs mt-1">Добавьте первую привычку для отслеживания</p>
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className="rounded-xl border bg-card p-4 flex items-start gap-4"
            >
              <button
                onClick={() => toggleToday(habit.id)}
                className={cn(
                  'h-10 w-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  habit.completedToday
                    ? 'text-white'
                    : 'border-muted-foreground/30 hover:border-primary'
                )}
                style={
                  habit.completedToday
                    ? { backgroundColor: habit.color, borderColor: habit.color }
                    : { borderColor: habit.color + '60' }
                }
              >
                {habit.completedToday && <Check className="h-5 w-5" strokeWidth={3} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{habit.name}</h3>
                  {habit.streak > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-orange-500 font-medium">
                      <Flame className="h-3.5 w-3.5" />
                      {habit.streak}
                    </span>
                  )}
                </div>
                {habit.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
                )}
                <div className="mt-2">
                  <Heatmap logs={habit.logs || []} color={habit.color} />
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm('Удалить привычку?')) deleteHabit(habit.id);
                }}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
