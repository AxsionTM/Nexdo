'use client';

import { useEffect } from 'react';
import { useTasksStore, type DisplayMode } from '@/stores/tasks';
import { useProjectsStore } from '@/stores/projects';
import { TaskItem } from './TaskItem';
import { QuickAdd } from './QuickAdd';
import { KanbanBoard } from '@/components/views/KanbanBoard';
import { CalendarView } from '@/components/views/CalendarView';
import { EisenhowerMatrix } from '@/components/views/EisenhowerMatrix';
import { HabitsView } from '@/components/habits/HabitsView';
import { GoalsView } from '@/components/goals/GoalsView';
import { FocusView } from '@/components/focus/FocusView';
import { TrashView } from '@/components/tasks/TrashView';
import { Loader2, List, Columns3, CalendarDays, Grid2x2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const DISPLAY_MODES: { id: DisplayMode; label: string; icon: typeof List }[] = [
  { id: 'list', label: 'Список', icon: List },
  { id: 'kanban', label: 'Канбан', icon: Columns3 },
  { id: 'calendar', label: 'Календарь', icon: CalendarDays },
  { id: 'matrix', label: 'Матрица', icon: Grid2x2 },
];

export function TaskList() {
  const {
    todayTasks,
    overdueTasks,
    tasks,
    isLoading,
    currentView,
    currentProjectId,
    displayMode,
    setDisplayMode,
    refreshCurrentView,
  } = useTasksStore();
  const { projects } = useProjectsStore();

  useEffect(() => {
    if (
      currentView !== 'habits' &&
      currentView !== 'goals' &&
      currentView !== 'focus' &&
      currentView !== 'trash'
    ) {
      refreshCurrentView();
    }
  }, [currentView, currentProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (currentView === 'habits') return <HabitsView />;
  if (currentView === 'goals') return <GoalsView />;
  if (currentView === 'focus') return <FocusView />;
  if (currentView === 'trash') return <TrashView />;

  const displayTasks =
    currentView === 'today'
      ? todayTasks
      : currentView === 'overdue'
      ? overdueTasks
      : tasks;

  let title = viewTitles[currentView] || 'Задачи';
  if (currentView === 'project' && currentProjectId) {
    const project = projects.find((p) => p.id === currentProjectId);
    if (project) title = project.name;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-6 py-3 border-b flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {displayMode === 'list' && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {displayTasks.length}{' '}
              {displayTasks.length === 1
                ? 'задача'
                : displayTasks.length >= 2 && displayTasks.length <= 4
                ? 'задачи'
                : 'задач'}
            </p>
          )}
        </div>

        <div className="flex rounded-lg border overflow-hidden shrink-0">
          {DISPLAY_MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setDisplayMode(m.id)}
                title={m.label}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors',
                  displayMode === m.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {displayMode === 'list' && (
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
      )}

      {displayMode === 'kanban' &&
        (isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <KanbanBoard />
        ))}

      {displayMode === 'calendar' &&
        (isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CalendarView />
        ))}

      {displayMode === 'matrix' &&
        (isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <EisenhowerMatrix />
        ))}
    </div>
  );
}
