export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/manifest.json',
      badge: '/manifest.json',
      ...options,
    });
  } catch {
    // ignore
  }
}

/** Notify about overdue and due-today tasks (once per session key). */
export function notifyDueTasks(overdue: any[], today: any[]) {
  if (typeof window === 'undefined') return;
  const key = `tf-notified-${new Date().toISOString().slice(0, 10)}`;
  if (sessionStorage.getItem(key)) return;

  const overdueCount = overdue.length;
  const todayCount = today.length;

  if (overdueCount === 0 && todayCount === 0) return;

  let body = '';
  if (overdueCount > 0) {
    body += `Просрочено: ${overdueCount}. `;
  }
  if (todayCount > 0) {
    body += `На сегодня: ${todayCount}.`;
  }

  showNotification('TaskFlow — напоминание', {
    body: body.trim(),
    tag: 'taskflow-daily',
  });

  sessionStorage.setItem(key, '1');
}
