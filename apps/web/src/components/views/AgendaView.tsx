'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 – 21:00

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(d: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  const weekday = d.toLocaleDateString('ru-RU', { weekday: 'short' });
  const day = d.getDate();
  if (diff === 0) return { title: 'Сегодня', sub: `${day}, ${weekday}` };
  if (diff === 1) return { title: 'Завтра', sub: `${day}, ${weekday}` };
  if (diff === -1) return { title: 'Вчера', sub: `${day}, ${weekday}` };
  return {
    title: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
    sub: weekday,
  };
}

export function AgendaView() {
  const {
    tasks,
    todayTasks,
    overdueTasks,
    setSelectedTask,
    completeTask,
    selectedTaskId,
    fetchTasks,
    fetchToday,
    fetchOverdue,
  } = useTasksStore();
  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    fetchTasks({ includeCompleted: 'false' });
    fetchToday();
    fetchOverdue();
  }, [fetchTasks, fetchToday, fetchOverdue]);

  const day = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return startOfDay(d);
  }, [dayOffset]);

  const label = dayLabel(day);

  const dayTasks = useMemo(() => {
    const all = [...tasks, ...todayTasks, ...overdueTasks];
    const seen = new Set<string>();
    const list: any[] = [];
    for (const t of all) {
      if (seen.has(t.id) || t.status === 'COMPLETED') continue;
      if (!t.dueDate && !t.startDate) continue;
      const ref = new Date(t.startDate || t.dueDate);
      if (!sameDay(ref, day)) continue;
      seen.add(t.id);
      list.push(t);
    }
    return list.sort((a, b) => {
      const ta = new Date(a.startDate || a.dueDate).getTime();
      const tb = new Date(b.startDate || b.dueDate).getTime();
      return ta - tb;
    });
  }, [tasks, todayTasks, overdueTasks, day]);

  const allDay = dayTasks.filter((t) => t.isAllDay || !t.startDate);
  const timed = dayTasks.filter((t) => !t.isAllDay && t.startDate);

  const tasksByHour = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (const t of timed) {
      const h = new Date(t.startDate).getHours();
      if (!map[h]) map[h] = [];
      map[h].push(t);
    }
    return map;
  }, [timed]);

  const monthName = day.toLocaleDateString('ru-RU', { month: 'long' });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <header className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalIcon className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold capitalize truncate">{monthName}</h1>
            <p className="text-xs text-muted-foreground">
              {label.title} · {label.sub}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setDayOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={() => setDayOffset(0)}
          >
            Сегодня
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setDayOffset((o) => o + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* All-day section */}
        {allDay.length > 0 && (
          <div className="px-4 py-3 border-b">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
              Весь день
            </p>
            <div className="space-y-1.5">
              {allDay.map((t) => (
                <AgendaCard
                  key={t.id}
                  task={t}
                  selected={selectedTaskId === t.id}
                  onSelect={() => setSelectedTask(t.id)}
                  onComplete={() => completeTask(t.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative px-2 py-2">
          {HOURS.map((hour) => {
            const items = tasksByHour[hour] || [];
            return (
              <div key={hour} className="flex gap-3 min-h-[56px]">
                <div className="w-12 shrink-0 pt-1 text-right">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
                <div className="relative flex-1 border-t border-border/60 pt-1 pb-2">
                  {/* timeline dot */}
                  <span className="absolute -left-[5px] top-0 h-2 w-2 rounded-full border-2 border-muted-foreground/40 bg-background" />
                  <div className="space-y-1.5 pl-2">
                    {items.map((t) => (
                      <AgendaCard
                        key={t.id}
                        task={t}
                        selected={selectedTaskId === t.id}
                        onSelect={() => setSelectedTask(t.id)}
                        onComplete={() => completeTask(t.id)}
                        showTime
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {dayTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalIcon className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Нет задач на этот день</p>
            <p className="text-xs mt-1">Назначьте срок задаче, чтобы увидеть её здесь</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AgendaCard({
  task,
  selected,
  onSelect,
  onComplete,
  showTime,
}: {
  task: any;
  selected: boolean;
  onSelect: () => void;
  onComplete: () => void;
  showTime?: boolean;
}) {
  const start = task.startDate ? new Date(task.startDate) : null;
  const end = task.dueDate ? new Date(task.dueDate) : null;
  let timeLabel = '';
  if (showTime && start) {
    const s = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (end && end.getTime() !== start.getTime()) {
      const e = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      timeLabel = `${s} – ${e}`;
    } else {
      timeLabel = s;
    }
  }

  const color = task.project?.color || '#4A90D9';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex items-stretch rounded-lg border bg-card overflow-hidden cursor-pointer transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-primary/40'
      )}
    >
      <div className="w-1 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 px-3 py-2 min-w-0">
        {timeLabel && (
          <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{timeLabel}</p>
        )}
        <div className="flex items-center gap-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
          >
            <Checkbox checked={task.status === 'COMPLETED'} priority={task.priority} />
          </div>
          <p
            className={cn(
              'text-sm font-medium truncate',
              task.status === 'COMPLETED' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>
        </div>
        {task.project && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate pl-6">
            {task.project.name}
          </p>
        )}
      </div>
    </div>
  );
}
