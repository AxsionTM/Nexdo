'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
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
  Download,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useProjectsStore } from '@/stores/projects';
import { useTasksStore } from '@/stores/tasks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { SearchDialog } from './SearchDialog';
import { api } from '@/lib/api';

const smartViews = [
  { id: 'today', label: 'Сегодня', icon: Sun },
  { id: 'tomorrow', label: 'Завтра', icon: Calendar },
  { id: 'week', label: 'На этой неделе', icon: LayoutList },
  { id: 'overdue', label: 'Просроченные', icon: AlertCircle },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects, createProject } = useProjectsStore();
  const { currentView, setCurrentView, setCurrentProject, overdueTasks, fetchOverdue } =
    useTasksStore();
  const { theme, setTheme } = useTheme();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchOverdue();
  }, [fetchProjects, fetchOverdue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleViewClick = (viewId: string) => {
    setCurrentView(viewId);
    setCurrentProject(null);
  };

  const handleProjectClick = (projectId: string) => {
    setCurrentView('project');
    setCurrentProject(projectId);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || creating) return;
    setCreating(true);
    try {
      await createProject({ name: newProjectName.trim() });
      setNewProjectName('');
      setShowNewProject(false);
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    const token = api.getToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/export/${format}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      alert('Ошибка экспорта');
      return;
    }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download =
      format === 'json'
        ? `taskflow-export-${new Date().toISOString().slice(0, 10)}.json`
        : `taskflow-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowSettings(false);
  };

  return (
    <>
      <aside className="flex h-full w-60 flex-col border-r bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            TT
          </div>
          <span className="font-semibold text-sm">TaskFlow</span>
        </div>

        <div className="px-3 py-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
            size="sm"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            Поиск...
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-1">
          <div className="space-y-0.5">
            {smartViews.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.id;
              const count = view.id === 'overdue' ? overdueTasks.length : undefined;

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
                    <span className="ml-auto text-xs text-red-500 font-medium">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="flex items-center px-2 py-1">
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
              >
                {projectsOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                Проекты
              </button>
              <button
                onClick={() => setShowNewProject(true)}
                className="ml-auto p-0.5 rounded hover:bg-accent text-muted-foreground"
                title="Новый проект"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {showNewProject && (
              <form onSubmit={handleCreateProject} className="px-2 py-1">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Название проекта"
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowNewProject(false);
                  }}
                  disabled={creating}
                />
              </form>
            )}

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

        <div className="border-t p-2 space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <Settings className="h-4 w-4" />
            Настройки
          </button>
          {showSettings && (
            <div className="px-2 py-1 space-y-1">
              <button
                onClick={() => handleExport('json')}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent text-muted-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                Экспорт JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent text-muted-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                Экспорт CSV
              </button>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            {user?.name || 'Выйти'}
          </button>
        </div>
      </aside>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
