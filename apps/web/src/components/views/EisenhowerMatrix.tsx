'use client';

import { useMemo } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate, cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';

const QUADRANTS: {
  id: Quadrant;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  priorities: string[];
  urgent: boolean;
}[] = [
  {
    id: 'do',
    title: 'Сделать',
    subtitle: 'Срочно и важно',
    color: 'border-red-500',
    bg: 'bg-red-500/5',
    priorities: ['HIGH'],
    urgent: true,
  },
  {
    id: 'schedule',
    title: 'Запланировать',
    subtitle: 'Важно, не срочно',
    color: 'border-blue-500',
    bg: 'bg-blue-500/5',
    priorities: ['HIGH', 'MEDIUM'],
    urgent: false,
  },
  {
    id: 'delegate',
    title: 'Делегировать',
    subtitle: 'Срочно, не важно',
    color: 'border-amber-500',
    bg: 'bg-amber-500/5',
    priorities: ['LOW', 'NONE'],
    urgent: true,
  },
  {
    id: 'eliminate',
    title: 'Исключить',
    subtitle: 'Не срочно и не важно',
    color: 'border-gray-400',
    bg: 'bg-muted/30',
    priorities: ['LOW', 'NONE'],
    urgent: false,
  },
];

function isUrgent(task: any): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  inThreeDays.setHours(23, 59, 59, 999);
  return due <= inThreeDays;
}

function getQuadrant(task: any): Quadrant {
  const urgent = isUrgent(task);
  const important = task.priority === 'HIGH' || task.priority === 'MEDIUM';

  if (urgent && important) return 'do';
  if (!urgent && important) return 'schedule';
  if (urgent && !important) return 'delegate';
  return 'eliminate';
}

function MatrixCard({ task }: { task: any }) {
  const { setSelectedTask, completeTask, selectedTaskId } = useTasksStore();
  const isSelected = selectedTaskId === task.id;

  return (
    <div
      onClick={() => setSelectedTask(task.id)}
      className={cn(
        'flex items-start gap-2 rounded-md border bg-card p-2 cursor-pointer hover:shadow-sm transition-shadow',
        isSelected && 'ring-2 ring-primary/40'
      )}
    >
      <div
        className="pt-0.5"
        onClick={(e) => {
          e.stopPropagation();
          completeTask(task.id);
        }}
      >
        <Checkbox
          checked={task.status === 'COMPLETED'}
          priority={task.priority}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs font-medium leading-snug',
            task.status === 'COMPLETED' && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

export function EisenhowerMatrix() {
  const { tasks, todayTasks, overdueTasks, currentView } = useTasksStore();

  const allTasks = useMemo(() => {
    if (currentView === 'today') return todayTasks;
    if (currentView === 'overdue') return overdueTasks;
    return tasks;
  }, [currentView, tasks, todayTasks, overdueTasks]);

  const grouped = useMemo(() => {
    const map: Record<Quadrant, any[]> = {
      do: [],
      schedule: [],
      delegate: [],
      eliminate: [],
    };
    for (const task of allTasks) {
      map[getQuadrant(task)].push(task);
    }
    return map;
  }, [allTasks]);

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-2 gap-3 h-full min-h-[500px]">
        {QUADRANTS.map((q) => (
          <div
            key={q.id}
            className={cn(
              'flex flex-col rounded-xl border-2 overflow-hidden',
              q.color,
              q.bg
            )}
          >
            <div className="px-3 py-2 border-b bg-card/50">
              <h3 className="text-sm font-semibold">{q.title}</h3>
              <p className="text-[11px] text-muted-foreground">{q.subtitle}</p>
              <span className="text-[10px] text-muted-foreground">
                {grouped[q.id].length} задач
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {grouped[q.id].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Нет задач
                </p>
              ) : (
                grouped[q.id].map((task) => (
                  <MatrixCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
