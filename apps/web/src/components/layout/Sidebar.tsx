'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Folder,
  Inbox,
  LayoutList,
  Plus,
  Settings,
  Sun,
  Target,
  Timer,
  Repeat,
  Search,
  LogOut,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useProjectsStore } from '@/stores/projects';
import { useTasksStore } from '@/stores/tasks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const smartViews = [
  { id: 'today', label: 'Сегодня', icon: Sun },
  { id: 'tomorrow', label: 'Завтра', icon: Calendar },
  { id: 'week', label: 'На этой неделе', icon: LayoutList },
  { id: 'overdue', label: 'Просроченные', icon: AlertCircle },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { currentView, setCurrentView, setCurrentProject, overdueTasks, fetchOverdue } =
    useTasksStore();
  const { theme, setTheme } = useTheme();
  const [projectsOpen, setProjectsOpen] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchOverdue();
  }, [fetchProjects, fetchOverdue]);

  const handleViewClick = (viewId: string) => {
    setCurrentView(viewId);
    setCurrentProject(null);
  };

  const handleProjectClick = (projectId: string) => {
    setCurrentView('project');
    setCurrentProject(projectId);
  };

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          TT
        </div>
        <span className="font-semibold text-sm">TaskFlow</span>
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground"
          size="sm"
        >
          <Search className="h-4 w-4" />
          Поиск...
          <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
        </Button>
      </div>

      {/* Smart lists */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <div className="space-y-0.5">
          {smartViews.map((view) => {
            const Icon = view.icon;
            const isActive = currentView === view.id;
            const count =
              view.id === 'overdue' ? overdueTasks.length : undefined;

            return (
              <button
                key={view.id}
                onClick={() => handleViewClick(view.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{view.label}</span>
                {count !== undefined && count > 0 && (
                  <span className="ml-auto text-xs text-red-500 font-medium">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Projects */}
        <div className="mt-4">
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="flex w-full items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
          >
            {projectsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Проекты
            <Plus className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100" />
          </button>

          {projectsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {projects.map((project) => {
                const isActive =
                  currentView === 'project' &&
                  useTasksStore.getState().currentProjectId === project.id;

                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    {project.isInbox ? (
                      <Inbox className="h-4 w-4 shrink-0" style={{ color: project.color }} />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0" style={{ color: project.color }} />
                    )}
                    <span className="truncate">{project.name}</span>
                    {project.taskCount !== undefined && project.taskCount > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {project.taskCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Other sections */}
        <div className="mt-4 space-y-0.5">
          <button
            onClick={() => handleViewClick('habits')}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              currentView === 'habits'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-accent'
            )}
          >
            <Repeat className="h-4 w-4" />
            Привычки
          </button>
          <button
            onClick={() => handleViewClick('goals')}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              currentView === 'goals'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-accent'
            )}
          >
            <Target className="h-4 w-4" />
            Цели
          </button>
          <button
            onClick={() => handleViewClick('focus')}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              currentView === 'focus'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-accent'
            )}
          >
            <Timer className="h-4 w-4" />
            Фокус
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-2 space-y-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
          <Settings className="h-4 w-4" />
          Настройки
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          {user?.name || 'Выйти'}
        </button>
      </div>
    </aside>
  );
}
