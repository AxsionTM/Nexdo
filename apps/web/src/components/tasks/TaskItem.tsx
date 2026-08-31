'use client';

import { formatDate, cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Tag, ListTodo } from 'lucide-react';
import { useTasksStore } from '@/stores/tasks';

interface TaskItemProps {
  task: any;
  depth?: number;
}

export function TaskItem({ task, depth = 0 }: TaskItemProps) {
  const { completeTask, setSelectedTask, selectedTaskId } = useTasksStore();

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask(task.id);
  };

  const isCompleted = task.status === 'COMPLETED';
  const isSelected = selectedTaskId === task.id;
  const childCount = task._count?.children ?? task.children?.length ?? 0;
  const checklistDone = task.checklist?.filter((c: any) => c.isCompleted).length ?? 0;
  const checklistTotal = task.checklist?.length ?? 0;

  return (
    <div>
      <div
        onClick={() => setSelectedTask(task.id)}
        className={cn(
          'group flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border',
          isSelected
            ? 'bg-primary/5 border-primary/30'
            : 'border-transparent hover:bg-accent/50 hover:border-border',
          isCompleted && 'opacity-60'
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <div className="pt-0.5" onClick={handleComplete}>
          <Checkbox checked={isCompleted} priority={task.priority} />
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
                  new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) &&
                    !isCompleted
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
                key={tt.tag?.id || tt.id}
                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tt.tag?.name || tt.name}
              </span>
            ))}

            {checklistTotal > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ListTodo className="h-3 w-3" />
                {checklistDone}/{checklistTotal}
              </span>
            )}

            {childCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {childCount} подзадач
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
