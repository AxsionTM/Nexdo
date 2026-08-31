'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateTaskModal } from './CreateTaskModal';

export function QuickAdd() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
      >
        <Plus className="h-4 w-4" />
        Добавить задачу
      </button>
      <CreateTaskModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
