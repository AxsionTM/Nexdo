'use client';

import { useTasksStore } from '@/stores/tasks';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatDate } from '@/lib/utils';
import { Calendar, Flag } from 'lucide-react';

const FLAG_COLOR: Record<string, string> = {
  HIGH: 'text-red-500 fill-red-500',
  MEDIUM: 'text-amber-500 fill-amber-500',
  LOW: 'text-blue-500 fill-blue-500',
  NONE: '',
};

export function TaskItem({ task, depth = 0 }: { task: any; depth?: number }) {
  const { selectedTaskId, setSelectedTask, completeTask } = useTasksStore();
  const isSelected = selectedTaskId === task.id;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) &&
    task.status !== 'COMPLETED';

  return (
    <div>
      <div
        onClick={() => setSelectedTask(task.id)}
        className={cn(
          'group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          isSelected ? 'bg-primary/10' : 'hover:bg-accent/60'
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            completeTask(task.id);
          }}
        >
          <Checkbox checked={task.status === 'COMPLETED'} priority={task.priority} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {task.priority && task.priority !== 'NONE' && (
              <Flag className={cn('h-3.5 w-3.5 shrink-0', FLAG_COLOR[task.priority])} />
            )}
            <p
              className={cn(
                'text-sm truncate',
                task.status === 'COMPLETED' && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task.dueDate && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[11px]',
                  isOverdue ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.tags?.map((tt: any) => (
              <span
                key={tt.tag?.id || tt.tagId}
                className="text-[10px] px-1.5 py-0 rounded-full border"
                style={{
                  borderColor: (tt.tag?.color || '#888') + '80',
                  color: tt.tag?.color || '#888',
                }}
              >
                {tt.tag?.name}
              </span>
            ))}
            {task.project && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
                {task.project.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {task.children?.length > 0 &&
        task.children.map((child: any) => (
          <TaskItem key={child.id} task={child} depth={depth + 1} />
        ))}
    </div>
  );
}
