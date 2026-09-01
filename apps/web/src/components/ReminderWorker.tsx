'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { checkLocalReminders, showNotification } from '@/lib/notifications';
import { useTasksStore } from '@/stores/tasks';

export function ReminderWorker() {
  const firedRef = useRef<Set<string>>(new Set());
  const { todayTasks, overdueTasks, tasks } = useTasksStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tick = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const all = [...tasks, ...todayTasks, ...overdueTasks];
      const seen = new Set<string>();
      const unique = all.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      checkLocalReminders(unique, firedRef.current, (id) => firedRef.current.add(id));

      try {
        const { reminders } = await api.getPendingReminders();
        for (const r of reminders) {
          if (firedRef.current.has(`api-${r.id}`)) continue;
          // fire if remindAt is in the past or within 2 minutes
          const at = new Date(r.remindAt).getTime();
          if (Date.now() + 120_000 < at) continue;

          showNotification(r.task?.title || 'Напоминание TaskFlow', {
            body: r.task?.dueDate
              ? `Срок: ${new Date(r.task.dueDate).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Пора выполнить задачу',
            tag: `reminder-${r.id}`,
            requireInteraction: true,
          });
          firedRef.current.add(`api-${r.id}`);
          await api.markReminderSent(r.id).catch(() => {});
        }
      } catch {
        // offline
      }
    };

    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [tasks, todayTasks, overdueTasks]);

  return null;
}
