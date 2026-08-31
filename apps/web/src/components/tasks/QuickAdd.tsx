'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Flag, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTasksStore } from '@/stores/tasks';
import { cn, priorityLabels } from '@/lib/utils';

const PRIORITIES = [
  { value: 'NONE', label: 'Нет', color: 'bg-gray-400' },
  { value: 'LOW', label: 'Низкий', color: 'bg-blue-500' },
  { value: 'MEDIUM', label: 'Средний', color: 'bg-amber-500' },
  { value: 'HIGH', label: 'Высокий', color: 'bg-red-500' },
];

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('NONE');
  const [dueDate, setDueDate] = useState('');
  const [showPriority, setShowPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createTask, currentProjectId } = useTasksStore();

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const reset = () => {
    setTitle('');
    setPriority('NONE');
    setDueDate('');
    setShowPriority(false);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data: any = {
        title: title.trim(),
        projectId: currentProjectId || undefined,
        priority: priority !== 'NONE' ? priority : undefined,
      };
      if (dueDate) {
        const d = new Date(dueDate);
        d.setHours(12, 0, 0, 0);
        data.dueDate = d.toISOString();
      }
      await createTask(data);
      reset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
      >
        <Plus className="h-4 w-4" />
        Добавить задачу
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-1 space-y-2">
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-ring">
        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-7"
          onKeyDown={(e) => {
            if (e.key === 'Escape') reset();
          }}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center gap-2 px-1">
        {/* Priority */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPriority(!showPriority)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border hover:bg-accent"
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                PRIORITIES.find((p) => p.value === priority)?.color
              )}
            />
            <Flag className="h-3 w-3" />
            {priorityLabels[priority]}
          </button>
          {showPriority && (
            <div className="absolute left-0 top-full z-10 mt-1 w-36 rounded-md border bg-card shadow-lg py-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPriority(p.value);
                    setShowPriority(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent"
                >
                  <span className={cn('h-2 w-2 rounded-full', p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due date */}
        <label className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border hover:bg-accent cursor-pointer">
          <Calendar className="h-3 w-3" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-transparent outline-none w-[110px]"
          />
        </label>

        <span className="text-xs text-muted-foreground ml-auto">
          Enter — создать · Esc — отмена
        </span>
      </div>
    </form>
  );
}
