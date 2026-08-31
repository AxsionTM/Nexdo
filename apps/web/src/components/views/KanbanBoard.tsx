'use client';

import { useMemo } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate, cn } from '@/lib/utils';
import { Calendar, Plus } from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', title: 'К выполнению', color: 'border-t-gray-400' },
  { id: 'IN_PROGRESS', title: 'В работе', color: 'border-t-blue-500' },
  { id: 'COMPLETED', title: 'Готово', color: 'border-t-green-500' },
];

function KanbanCard({ task }: { task: any }) {
  const { setSelectedTask, completeTask, updateTask, selectedTaskId } = useTasksStore();
  const isSelected = selectedTaskId === task.id;

  const moveTo = async (status: string) => {
    if (status === 'COMPLETED') {
      await completeTask(task.id);
    } else {
      await updateTask(task.id, { status });
    }
  };

  return (
    <div
      onClick={() => setSelectedTask(task.id)}
      className={cn(
        'rounded-lg border bg-card p-3 cursor-pointer shadow-sm hover:shadow transition-shadow',
        isSelected && 'ring-2 ring-primary/40'
      )}
    >
      <div className="flex items-start gap-2">
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
              'text-sm font-medium leading-snug',
              task.status === 'COMPLETED' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs mt-1.5',
                new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) &&
                  task.status !== 'COMPLETED'
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.project && (
            <div className="flex items-center gap-1 mt-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {task.project.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {task.status !== 'COMPLETED' && (
        <div className="flex gap-1 mt-2 pt-2 border-t">
          {COLUMNS.filter((c) => c.id !== task.status).map((col) => (
            <button
              key={col.id}
              onClick={(e) => {
                e.stopPropagation();
                moveTo(col.id);
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground"
            >
              → {col.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function KanbanBoard() {
  const { tasks, todayTasks, overdueTasks, currentView, createTask, currentProjectId } =
    useTasksStore();

  const allTasks = useMemo(() => {
    if (currentView === 'today') {
      const ids = new Set(todayTasks.map((t) => t.id));
      return [...overdueTasks.filter((t) => !ids.has(t.id)), ...todayTasks];
    }
    return tasks;
  }, [currentView, tasks, todayTasks, overdueTasks]);

  const columns = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      tasks: allTasks.filter((t) => {
        if (col.id === 'TODO') return t.status === 'TODO' || t.status === 'CANCELLED';
        return t.status === col.id;
      }),
    }));
  }, [allTasks]);

  const handleQuickAdd = async (status: string) => {
    const title = prompt('Название задачи:');
    if (!title?.trim()) return;
    await createTask({
      title: title.trim(),
      status: status === 'COMPLETED' ? 'TODO' : status,
      projectId: currentProjectId || undefined,
    });
  };

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex gap-4 h-full min-w-max">
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn(
              'w-72 flex flex-col rounded-xl border bg-muted/30 border-t-4',
              col.color
            )}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {col.tasks.length}
                </span>
              </div>
              <button
                onClick={() => handleQuickAdd(col.id)}
                className="p-1 rounded hover:bg-accent text-muted-foreground"
                title="Добавить задачу"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-2">
              {col.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Пусто
                </p>
              ) : (
                col.tasks.map((task) => <KanbanCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
