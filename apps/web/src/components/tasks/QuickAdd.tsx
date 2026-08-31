'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTasksStore } from '@/stores/tasks';

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createTask, currentProjectId } = useTasksStore();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        projectId: currentProjectId || undefined,
      });
      setTitle('');
      setIsOpen(false);
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
    <form onSubmit={handleSubmit} className="px-1">
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-ring">
        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-7"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setTitle('');
            }
          }}
          disabled={isSubmitting}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1 px-1">
        Enter — создать · Esc — отмена
      </p>
    </form>
  );
}
