'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useTasksStore } from '@/stores/tasks';
import { formatDate, cn } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { setSelectedTask, setCurrentView } = useTasksStore();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { tasks } = await api.getTasks({
        search: q.trim(),
        includeCompleted: 'true',
      });
      setResults(tasks);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else {
          // parent will open
        }
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск задач..."
            className="flex-1 h-12 bg-transparent text-sm outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query && !loading && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ничего не найдено
            </p>
          )}
          {results.map((task) => (
            <button
              key={task.id}
              onClick={() => {
                setCurrentView('today');
                setSelectedTask(task.id);
                onClose();
              }}
              className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
            >
              <span
                className={cn(
                  'mt-1.5 h-2 w-2 rounded-full shrink-0',
                  task.priority === 'HIGH'
                    ? 'bg-red-500'
                    : task.priority === 'MEDIUM'
                    ? 'bg-amber-500'
                    : task.priority === 'LOW'
                    ? 'bg-blue-500'
                    : 'bg-gray-400'
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm truncate',
                    task.status === 'COMPLETED' && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.project && (
                    <span className="text-xs text-muted-foreground">{task.project.name}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t text-[11px] text-muted-foreground">
          Enter — открыть · Esc — закрыть · ⌘K — поиск
        </div>
      </div>
    </div>
  );
}
