'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate, cn } from '@/lib/utils';
import { Trash2, RotateCcw, Loader2, Archive } from 'lucide-react';

export function TrashView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { tasks: t } = await api.getTrash();
      setTasks(t);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async (id: string) => {
    setBusy(id);
    try {
      await api.restoreTask(id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const handlePermanent = async (id: string) => {
    if (!confirm('Удалить навсегда? Это действие нельзя отменить.')) return;
    setBusy(id);
    try {
      await api.permanentDeleteTask(id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const handleEmpty = async () => {
    if (!confirm('Очистить корзину? Все задачи будут удалены навсегда.')) return;
    setBusy('empty');
    try {
      await api.emptyTrash();
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="tf-view-header px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Корзина</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.length}{' '}
            {tasks.length === 1 ? 'задача' : tasks.length >= 2 && tasks.length <= 4 ? 'задачи' : 'задач'}
          </p>
        </div>
        {tasks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmpty}
            disabled={busy === 'empty'}
            className="text-destructive hover:text-destructive"
          >
            Очистить корзину
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Trash2 className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Корзина пуста</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through text-muted-foreground truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    {task.deletedAt && (
                      <span>
                        Удалено{' '}
                        {new Date(task.deletedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                    {task.project && <span>· {task.project.name}</span>}
                    {task.dueDate && <span>· {formatDate(task.dueDate)}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleRestore(task.id)}
                  disabled={busy === task.id}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Восстановить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => handlePermanent(task.id)}
                  disabled={busy === task.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
