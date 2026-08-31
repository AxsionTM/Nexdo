'use client';

import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasksStore } from '@/stores/tasks';
import { cn, priorityColors } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type CalMode = 'month' | 'week' | 'day';

export function CalendarView() {
  const { tasks, todayTasks, overdueTasks, currentView, setSelectedTask } = useTasksStore();
  const [mode, setMode] = useState<CalMode>('month');
  const [cursor, setCursor] = useState(new Date());

  const allTasks = useMemo(() => {
    if (currentView === 'today') return todayTasks;
    if (currentView === 'overdue') return overdueTasks;
    return tasks;
  }, [currentView, tasks, todayTasks, overdueTasks]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const task of allTasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [allTasks]);

  const navigate = (dir: -1 | 1) => {
    if (mode === 'month') {
      setCursor(dir === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1));
    } else if (mode === 'week') {
      setCursor(dir === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1));
    } else {
      setCursor(dir === 1 ? addDays(cursor, 1) : subDays(cursor, 1));
    }
  };

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const headerLabel =
    mode === 'month'
      ? format(cursor, 'LLLL yyyy', { locale: ru })
      : mode === 'week'
      ? `${format(weekDays[0], 'd MMM', { locale: ru })} – ${format(weekDays[6], 'd MMM yyyy', { locale: ru })}`
      : format(cursor, 'd MMMM yyyy, EEEE', { locale: ru });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date())}
          >
            Сегодня
          </Button>
          <h2 className="text-sm font-semibold capitalize ml-2">{headerLabel}</h2>
        </div>

        <div className="flex rounded-lg border overflow-hidden">
          {(['month', 'week', 'day'] as CalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              )}
            >
              {m === 'month' ? 'Месяц' : m === 'week' ? 'Неделя' : 'День'}
            </button>
          ))}
        </div>
      </div>

      {/* Month grid */}
      {mode === 'month' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-7 gap-px mb-1">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px auto-rows-fr" style={{ minHeight: 'calc(100% - 28px)' }}>
            {monthDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate.get(key) || [];
              const inMonth = isSameMonth(day, cursor);

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-[90px] border rounded-md p-1.5 transition-colors',
                    !inMonth && 'opacity-40 bg-muted/20',
                    isToday(day) && 'bg-primary/5 border-primary/30'
                  )}
                >
                  <div
                    className={cn(
                      'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                      isToday(day) && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task.id)}
                        className={cn(
                          'w-full text-left text-[11px] px-1 py-0.5 rounded truncate',
                          'hover:opacity-80',
                          task.status === 'COMPLETED'
                            ? 'line-through text-muted-foreground bg-muted'
                            : 'bg-primary/10 text-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-1.5 w-1.5 rounded-full mr-1',
                            priorityColors[task.priority] || 'bg-gray-400'
                          )}
                        />
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-muted-foreground px-1">
                        +{dayTasks.length - 3} ещё
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {mode === 'week' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-7 gap-2 h-full">
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate.get(key) || [];

              return (
                <div
                  key={key}
                  className={cn(
                    'flex flex-col border rounded-lg overflow-hidden',
                    isToday(day) && 'border-primary/40 bg-primary/5'
                  )}
                >
                  <div className="px-2 py-2 border-b text-center">
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEE', { locale: ru })}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full',
                        isToday(day) && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                    {dayTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task.id)}
                        className={cn(
                          'w-full text-left text-xs px-2 py-1.5 rounded-md',
                          task.status === 'COMPLETED'
                            ? 'line-through text-muted-foreground bg-muted'
                            : 'bg-card border hover:bg-accent'
                        )}
                      >
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-4">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {mode === 'day' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-lg mx-auto space-y-2">
            {(tasksByDate.get(format(cursor, 'yyyy-MM-dd')) || []).map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className={cn(
                  'w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-colors',
                  task.status === 'COMPLETED' && 'opacity-60'
                )}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full shrink-0',
                    priorityColors[task.priority] || 'bg-gray-400'
                  )}
                />
                <span
                  className={cn(
                    'text-sm',
                    task.status === 'COMPLETED' && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </span>
              </button>
            ))}
            {(tasksByDate.get(format(cursor, 'yyyy-MM-dd')) || []).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                Нет задач на этот день
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
