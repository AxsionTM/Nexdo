'use client';

import { formatDate, cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Tag } from 'lucide-react';
import { useTasksStore } from '@/stores/tasks';

interface TaskItemProps {
  task: any;
  onSelect?: (id: string) => void;
}

export function TaskItem({ task, onSelect }: TaskItemProps) {
  const { completeTask, setSelectedTask } = useTasksStore();

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status !== 'COMPLETED') {
      await completeTask(task.id);
    }
  };

  const isCompleted = task.status === 'COMPLETED';

  return (
    <div
      onClick={() => {
        setSelectedTask(task.id);
        onSelect?.(task.id);
      }}
      className={cn(
        'group flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 border border-transparent hover:border-border',
        isCompleted && 'opacity-60'
      )}
    >
      <div className="pt-0.5" onClick={handleComplete}>
        <Checkbox
          checked={isCompleted}
          priority={task.priority}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                new Date(task.dueDate) < new Date() && !isCompleted
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}

          {task.project && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
              {task.project.name}
            </span>
          )}

          {task.tags?.map((tt: any) => (
            <span
              key={tt.tag.id}
              className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {tt.tag.name}
            </span>
          ))}

          {task.checklist && task.checklist.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {task.checklist.filter((c: any) => c.isCompleted).length}/
              {task.checklist.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
