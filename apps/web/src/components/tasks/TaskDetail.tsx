'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X,
  Calendar,
  Flag,
  Tag,
  Trash2,
  Plus,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTasksStore } from '@/stores/tasks';
import { useProjectsStore } from '@/stores/projects';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatDate, priorityLabels } from '@/lib/utils';

const PRIORITIES = [
  { value: 'NONE', label: 'Нет', color: 'bg-gray-400' },
  { value: 'LOW', label: 'Низкий', color: 'bg-blue-500' },
  { value: 'MEDIUM', label: 'Средний', color: 'bg-amber-500' },
  { value: 'HIGH', label: 'Высокий', color: 'bg-red-500' },
];

export function TaskDetail() {
  const { selectedTaskId, setSelectedTask, updateTask, deleteTask, completeTask, createTask } =
    useTasksStore();
  const { projects } = useProjectsStore();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NONE');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTask = useCallback(async () => {
    if (!selectedTaskId) {
      setTask(null);
      return;
    }
    setLoading(true);
    try {
      const { task: t } = await api.getTask(selectedTaskId);
      setTask(t);
      setTitle(t.title || '');
      setDescription(t.description || '');
      setPriority(t.priority || 'NONE');
      setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : '');
      setProjectId(t.projectId || '');
      setSelectedTagIds(t.tags?.map((tt: any) => tt.tag.id) || []);
    } catch {
      setSelectedTask(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTaskId, setSelectedTask]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  useEffect(() => {
    api.getTags().then(({ tags: t }) => setTags(t)).catch(() => {});
  }, []);

  const save = async (patch: Record<string, any>) => {
    if (!selectedTaskId || saving) return;
    setSaving(true);
    try {
      await updateTask(selectedTaskId, patch);
      await loadTask();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== task?.title) {
      save({ title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task?.description || '')) {
      save({ description: description || null });
    }
  };

  const handlePriorityChange = (p: string) => {
    setPriority(p);
    setShowPriorityMenu(false);
    save({ priority: p });
  };

  const handleDueDateChange = (value: string) => {
    setDueDate(value);
    if (value) {
      const d = new Date(value);
      d.setHours(12, 0, 0, 0);
      save({ dueDate: d.toISOString() });
    } else {
      save({ dueDate: null });
    }
  };

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    save({ projectId: id || null });
  };

  const handleComplete = async () => {
    if (!selectedTaskId) return;
    await completeTask(selectedTaskId);
    await loadTask();
  };

  const handleDelete = async () => {
    if (!selectedTaskId) return;
    if (!confirm('Удалить задачу?')) return;
    await deleteTask(selectedTaskId);
    setSelectedTask(null);
  };

  const handleAddChecklist = async () => {
    if (!selectedTaskId || !newChecklistTitle.trim()) return;
    await api.addChecklistItem(selectedTaskId, { title: newChecklistTitle.trim() });
    setNewChecklistTitle('');
    await loadTask();
  };

  const handleToggleChecklist = async (itemId: string, isCompleted: boolean) => {
    if (!selectedTaskId) return;
    await api.updateChecklistItem(selectedTaskId, itemId, { isCompleted: !isCompleted });
    await loadTask();
  };

  const handleDeleteChecklist = async (itemId: string) => {
    if (!selectedTaskId) return;
    await api.deleteChecklistItem(selectedTaskId, itemId);
    await loadTask();
  };

  const handleAddSubtask = async () => {
    if (!selectedTaskId || !newSubtaskTitle.trim()) return;
    await createTask({
      title: newSubtaskTitle.trim(),
      parentId: selectedTaskId,
      projectId: task?.projectId || undefined,
    });
    setNewSubtaskTitle('');
    await loadTask();
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const { tag } = await api.createTag({ name: newTagName.trim() });
    setTags((prev) => [...prev, tag]);
    const next = [...selectedTagIds, tag.id];
    setSelectedTagIds(next);
    setNewTagName('');
    setShowTagInput(false);
    save({ tagIds: next });
  };

  const toggleTag = (tagId: string) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(next);
    save({ tagIds: next });
  };

  if (!selectedTaskId) return null;

  return (
    <aside className="w-[380px] border-l bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-sm font-medium text-muted-foreground">Детали задачи</span>
        <button
          onClick={() => setSelectedTask(null)}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading || !task ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Title + complete */}
          <div className="px-4 pt-4 pb-2 flex items-start gap-3">
            <div className="pt-1" onClick={handleComplete}>
              <Checkbox
                checked={task.status === 'COMPLETED'}
                priority={priority}
              />
            </div>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              rows={2}
              className={cn(
                'flex-1 resize-none bg-transparent text-base font-medium leading-snug outline-none',
                task.status === 'COMPLETED' && 'line-through text-muted-foreground'
              )}
              placeholder="Название задачи"
            />
          </div>

          {/* Description */}
          <div className="px-4 pb-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60"
              placeholder="Описание..."
            />
          </div>

          {/* Meta fields */}
          <div className="px-4 space-y-1 border-t py-3">
            {/* Priority */}
            <div className="relative">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Приоритет</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className={cn('h-2.5 w-2.5 rounded-full', PRIORITIES.find((p) => p.value === priority)?.color)} />
                  {priorityLabels[priority] || 'Нет'}
                </span>
              </button>
              {showPriorityMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border bg-card shadow-lg py-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => handlePriorityChange(p.value)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent',
                        priority === p.value && 'bg-accent'
                      )}
                    >
                      <span className={cn('h-2.5 w-2.5 rounded-full', p.color)} />
                      {p.label}
                      {priority === p.value && <Check className="h-3.5 w-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Due date */}
            <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground shrink-0">Срок</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="ml-auto bg-transparent text-sm outline-none text-right"
              />
            </div>

            {/* Project */}
            <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent">
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground shrink-0">Проект</span>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="ml-auto bg-transparent text-sm outline-none text-right max-w-[160px]"
              >
                <option value="">Без проекта</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="px-4 py-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Теги</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full border transition-colors',
                      active
                        ? 'bg-primary/15 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
              {showTagInput ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTag();
                      if (e.key === 'Escape') setShowTagInput(false);
                    }}
                    placeholder="Новый тег"
                    className="h-6 w-24 text-xs"
                    autoFocus
                  />
                  <button onClick={handleCreateTag} className="text-xs text-primary">
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="text-xs px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50"
                >
                  + тег
                </button>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="px-4 py-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Чек-лист</span>
              {task.checklist?.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {task.checklist.filter((c: any) => c.isCompleted).length}/{task.checklist.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {task.checklist?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => handleToggleChecklist(item.id, item.isCompleted)}
                    className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                      item.isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40'
                    )}
                  >
                    {item.isCompleted && <Check className="h-3 w-3" />}
                  </button>
                  <span
                    className={cn(
                      'text-sm flex-1',
                      item.isCompleted && 'line-through text-muted-foreground'
                    )}
                  >
                    {item.title}
                  </span>
                  <button
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                placeholder="Добавить пункт..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="px-4 py-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Подзадачи</span>
              {task.children?.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {task.children.filter((c: any) => c.status === 'COMPLETED').length}/
                  {task.children.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {task.children?.map((child: any) => (
                <div
                  key={child.id}
                  className="flex items-center gap-2 py-1 cursor-pointer hover:bg-accent/50 rounded px-1"
                  onClick={() => setSelectedTask(child.id)}
                >
                  <Checkbox
                    checked={child.status === 'COMPLETED'}
                    priority={child.priority}
                  />
                  <span
                    className={cn(
                      'text-sm flex-1',
                      child.status === 'COMPLETED' && 'line-through text-muted-foreground'
                    )}
                  >
                    {child.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Добавить подзадачу..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Delete */}
          <div className="px-4 py-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Удалить задачу
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
