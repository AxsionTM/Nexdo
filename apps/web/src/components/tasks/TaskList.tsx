'use client';

import { useEffect } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { TaskItem } from './TaskItem';
import { QuickAdd } from './QuickAdd';
import { Loader2 } from 'lucide-react';

const viewTitles: Record<string, string> = {
  today: 'Сегодня',
  tomorrow: 'Завтра',
  week: 'На этой неделе',
  overdue: 'Просроченные',
  habits: 'Привычки',
  goals: 'Цели',
  focus: 'Фокус',
  project: 'Проект',
};

export function TaskList() {
  const {
    todayTasks,
    overdueTasks,
    tasks,
    isLoading,
    currentView,
    currentProjectId,
    fetchToday,
    fetchOverdue,
    fetchTasks,
  } = useTasksStore();

  useEffect(() => {
    if (currentView === 'today') {
      fetchToday();
      fetchOverdue();
    } else if (currentView === 'overdue') {
      fetchOverdue();
    } else if (currentView === 'project' && currentProjectId) {
      fetchTasks({ projectId: currentProjectId });
    } else {
      fetchTasks();
    }
  }, [currentView, currentProjectId, fetchToday, fetchOverdue, fetchTasks]);

  const displayTasks =
    currentView === 'today'
      ? todayTasks
      : currentView === 'overdue'
      ? overdueTasks
      : tasks;

  const title = viewTitles[currentView] || 'Задачи';

  if (currentView === 'habits' || currentView === 'goals' || currentView === 'focus') {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b">
          <h1 className="text-xl font-semibold">{title}</h1>
        </header>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Раздел «{title}» будет доступен на следующих этапах</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {displayTasks.length}{' '}
            {displayTasks.length === 1
              ? 'задача'
              : displayTasks.length >= 2 && displayTasks.length <= 4
              ? 'задачи'
              : 'задач'}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <QuickAdd />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Нет задач</p>
            <p className="text-xs mt-1">Добавьте первую задачу выше</p>
          </div>
        ) : (
          <div className="mt-2 space-y-0.5">
            {currentView === 'today' && overdueTasks.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-red-500 uppercase tracking-wider px-3 mb-1">
                  Просроченные
                </h3>
                {overdueTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}

            <div>
              {currentView === 'today' && todayTasks.length > 0 && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1">
                  На сегодня
                </h3>
              )}
              {displayTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
