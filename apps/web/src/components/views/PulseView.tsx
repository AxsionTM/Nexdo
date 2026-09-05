'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { useFocusStore } from '@/stores/focus';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle2, AlertTriangle, ListTodo, Timer } from 'lucide-react';

function Donut({
  segments,
  centerLabel,
  centerSub,
}: {
  segments: { value: number; color: string; label: string }[];
  centerLabel: string;
  centerSub: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    const start = (acc / total) * 100;
    acc += seg.value;
    const end = (acc / total) * 100;
    stops.push(`${seg.color} ${start}% ${end}%`);
  }
  const gradient =
    segments.length && segments.some((s) => s.value > 0)
      ? `conic-gradient(${stops.join(', ')})`
      : 'conic-gradient(#e2e8f0 0% 100%)';

  return (
    <div className="relative h-48 w-48 mx-auto">
      <div
        className="h-full w-full rounded-full"
        style={{ background: gradient }}
      />
      <div className="absolute inset-6 rounded-full bg-card flex flex-col items-center justify-center shadow-inner">
        <span className="text-2xl font-bold tabular-nums">{centerLabel}</span>
        <span className="text-[11px] text-muted-foreground text-center px-2">{centerSub}</span>
      </div>
    </div>
  );
}

export function PulseView() {
  const { overdueTasks, todayTasks, fetchOverdue, fetchToday, fetchTasks, tasks } =
    useTasksStore();
  const { stats, fetchStats, completedPomodoros } = useFocusStore();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    fetchOverdue();
    fetchToday();
    fetchTasks({ includeCompleted: 'true' });
    fetchStats();
  }, [fetchOverdue, fetchToday, fetchTasks, fetchStats]);

  useEffect(() => {
    const done = tasks.filter((t) => t.status === 'COMPLETED').length;
    setCompletedCount(done);
  }, [tasks]);

  const activeCount = useMemo(
    () => tasks.filter((t) => t.status !== 'COMPLETED' && !t.isDeleted).length,
    [tasks]
  );

  const overdue = overdueTasks.length;
  const today = todayTasks.length;
  const open = Math.max(0, activeCount - overdue);

  const segments = [
    { value: completedCount, color: '#10B981', label: 'Выполнено' },
    { value: today, color: '#3B82F6', label: 'На сегодня' },
    { value: overdue, color: '#EF4444', label: 'Просрочено' },
    { value: Math.max(0, open - today), color: '#F59E0B', label: 'В работе' },
  ].filter((s) => s.value > 0);

  const score = useMemo(() => {
    const total = completedCount + overdue + today + open;
    if (total === 0) return 100;
    const raw = Math.round(
      ((completedCount + today * 0.5) / (total + overdue * 0.5)) * 100
    );
    return Math.max(0, Math.min(100, raw));
  }, [completedCount, overdue, today, open]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="tf-view-header px-6 py-4 border-b">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Пульс
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Обзор продуктивности и нагрузки
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="rounded-2xl border bg-card p-6">
          <Donut
            segments={
              segments.length
                ? segments
                : [{ value: 1, color: '#e2e8f0', label: 'Пусто' }]
            }
            centerLabel={`${score}%`}
            centerSub="индекс фокуса"
          />
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {[
              { label: 'Выполнено', color: '#10B981', value: completedCount },
              { label: 'На сегодня', color: '#3B82F6', value: today },
              { label: 'Просрочено', color: '#EF4444', value: overdue },
              {
                label: 'В работе',
                color: '#F59E0B',
                value: Math.max(0, open - today),
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
            label="Просрочено"
            value={overdue}
            tone={overdue > 0 ? 'danger' : 'ok'}
          />
          <StatCard
            icon={<ListTodo className="h-4 w-4 text-blue-500" />}
            label="На сегодня"
            value={today}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            label="Выполнено"
            value={completedCount}
          />
          <StatCard
            icon={<Timer className="h-4 w-4 text-violet-500" />}
            label="Фокус, мин"
            value={stats?.totalMinutes ?? 0}
          />
        </div>

        {overdue > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              Просроченные задачи
            </p>
            <ul className="space-y-1.5">
              {overdueTasks.slice(0, 8).map((t) => (
                <li key={t.id} className="text-sm text-muted-foreground truncate">
                  • {t.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: 'danger' | 'ok';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-3',
        tone === 'danger' && value > 0 && 'border-red-500/30'
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
