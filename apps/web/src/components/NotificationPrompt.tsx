'use client';

import { useEffect, useState } from 'react';
import { useTasksStore } from '@/stores/tasks';
import { requestNotificationPermission, notifyDueTasks } from '@/lib/notifications';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const { overdueTasks, todayTasks, fetchOverdue, fetchToday } = useTasksStore();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem('tf-notif-dismissed');
      if (!dismissed) setShow(true);
    } else if (Notification.permission === 'granted') {
      fetchOverdue().then(() => fetchToday());
    }
  }, [fetchOverdue, fetchToday]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    notifyDueTasks(overdueTasks, todayTasks);
  }, [overdueTasks, todayTasks]);

  const enable = async () => {
    const ok = await requestNotificationPermission();
    setShow(false);
    if (ok) {
      await fetchOverdue();
      await fetchToday();
    }
  };

  const dismiss = () => {
    localStorage.setItem('tf-notif-dismissed', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border bg-card shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Включить напоминания?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Браузер будет сообщать о просроченных и сегодняшних задачах.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={enable}>
              Включить
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Не сейчас
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
