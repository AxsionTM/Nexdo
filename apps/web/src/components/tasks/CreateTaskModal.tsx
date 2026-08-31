'use client';

import { useEffect, useState } from 'react';
import { X, Flag, Calendar, Tag, Folder, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTasksStore } from '@/stores/tasks';
import { useProjectsStore } from '@/stores/projects';
import { api } from '@/lib/api';
import { cn, priorityLabels } from '@/lib/utils';

const PRIORITIES = [
  { value: 'NONE', label: 'Нет', color: 'text-gray-400', bg: 'bg-gray-400' },
  { value: 'LOW', label: 'Низкий', color: 'text-blue-500', bg: 'bg-blue-500' },
  { value: 'MEDIUM', label: 'Средний', color: 'text-amber-500', bg: 'bg-amber-500' },
  { value: 'HIGH', label: 'Высокий', color: 'text-red-500', bg: 'bg-red-500' },
];

function toIso(date: string, time: string) {
  if (!date) return null;
  const t = time || '12:00';
  const d = new Date(`${date}T${t}:00`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ open, onClose }: Props) {
  const { createTask, currentProjectId, refreshCurrentView } = useTasksStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NONE');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    fetchProjects();
    setProjectId(currentProjectId || '');
    api.getTags().then(({ tags: t }) => setTags(t)).catch(() => {});
  }, [open, currentProjectId, fetchProjects]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('NONE');
    setProjectId(currentProjectId || '');
    setStartDate('');
    setStartTime('');
    setDueDate('');
    setDueTime('');
    setSelectedTagIds([]);
    setNewTag('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    try {
      const { tag } = await api.createTag({ name });
      setTags((prev) => [...prev, tag]);
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setNewTag('');
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const startIso = toIso(startDate, startTime);
      const dueIso = toIso(dueDate, dueTime || (dueDate && startTime ? startTime : ''));

      const data: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority !== 'NONE' ? priority : 'NONE',
        projectId: projectId || undefined,
        isAllDay: !startTime && !dueTime,
        tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      };
      if (startIso) data.startDate = startIso;
      if (dueIso) data.dueDate = dueIso;
      // If only start given, also set due to same day end feel optional - leave as is

      await createTask(data);
      await refreshCurrentView();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось создать задачу');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-sm font-semibold">Новая задача</h2>
          <button type="button" onClick={handleClose} className="p-1 rounded-lg hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            placeholder="Название задачи"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="text-base font-medium h-10"
          />

          <div className="flex items-start gap-2">
            <AlignLeft className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
            <textarea
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Priority flags */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Flag className="h-3.5 w-3.5" />
              Приоритет
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors',
                    priority === p.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Flag className={cn('h-3.5 w-3.5 fill-current', p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Входящие (без проекта)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Срок
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground">Начало</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value && !startTime) setStartTime('09:00');
                  }}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Время начала</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={!startDate}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-card px-2 text-sm disabled:opacity-40"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Окончание</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (e.target.value && !dueTime) setDueTime(startTime || '10:00');
                  }}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Время окончания</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  disabled={!dueDate}
                  className="mt-0.5 flex h-9 w-full rounded-md border border-input bg-card px-2 text-sm disabled:opacity-40"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Без даты задача попадёт во Входящие, не в «Сегодня».
            </p>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Теги
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      active
                        ? 'bg-primary/15 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                    style={
                      active && tag.color
                        ? { borderColor: tag.color, color: tag.color, backgroundColor: tag.color + '18' }
                        : undefined
                    }
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Новый тег"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" size="sm" variant="outline" className="h-8" onClick={addTag}>
                +
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t bg-muted/20">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
            {submitting ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </form>
    </div>
  );
}
