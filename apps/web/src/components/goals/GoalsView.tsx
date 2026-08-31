'use client';

import { useEffect, useState } from 'react';
import { useGoalsStore } from '@/stores/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';
import { Plus, Target, Trash2, Loader2, X, Check } from 'lucide-react';

export function GoalsView() {
  const { goals, isLoading, fetchGoals, createGoal, updateGoal, deleteGoal } = useGoalsStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data: any = { name: name.trim() };
      if (targetValue) data.targetValue = Number(targetValue);
      if (unit) data.unit = unit;
      if (deadline) {
        const d = new Date(deadline);
        d.setHours(12, 0, 0, 0);
        data.deadline = d.toISOString();
      }
      await createGoal(data);
      setName('');
      setTargetValue('');
      setUnit('');
      setDeadline('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgress = async (goal: any, delta: number) => {
    const next = Math.max(0, (goal.currentValue || 0) + delta);
    await updateGoal(goal.id, { currentValue: next });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Цели</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {goals.filter((g) => !g.isCompleted).length} активных
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {showForm && (
          <form onSubmit={handleCreate} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Новая цель</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название цели"
              autoFocus
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Целевое значение"
                className="flex-1"
              />
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ед. (км, стр...)"
                className="w-32"
              />
            </div>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Target className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Пока нет целей</p>
            <p className="text-xs mt-1">Поставьте долгосрочную цель и отслеживайте прогресс</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress =
              goal.targetValue && goal.targetValue > 0
                ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                : 0;

            return (
              <div
                key={goal.id}
                className={cn(
                  'rounded-xl border bg-card p-4',
                  goal.isCompleted && 'opacity-70'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: goal.color + '20' }}
                  >
                    {goal.isCompleted ? (
                      <Check className="h-5 w-5" style={{ color: goal.color }} />
                    ) : (
                      <Target className="h-5 w-5" style={{ color: goal.color }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          'text-sm font-medium',
                          goal.isCompleted && 'line-through text-muted-foreground'
                        )}
                      >
                        {goal.name}
                      </h3>
                    </div>
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        До {formatDate(goal.deadline)}
                      </p>
                    )}

                    {goal.targetValue != null && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            {goal.currentValue}
                            {goal.unit ? ` ${goal.unit}` : ''} / {goal.targetValue}
                            {goal.unit ? ` ${goal.unit}` : ''}
                          </span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: goal.color,
                            }}
                          />
                        </div>
                        {!goal.isCompleted && (
                          <div className="flex gap-1.5 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleProgress(goal, 1)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleProgress(goal, 5)}
                            >
                              +5
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleProgress(goal, 10)}
                            >
                              +10
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Удалить цель?')) deleteGoal(goal.id);
                    }}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
