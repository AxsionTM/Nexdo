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
      icon: '/logo-tf.png',
      ...options,
    });
  } catch {
    // ignore
  }
}

/** Notify about overdue and due-today tasks (once per day session). */
export function notifyDueTasks(overdue: any[], today: any[]) {
  if (typeof window === 'undefined') return;
  const key = `tf-notified-${new Date().toISOString().slice(0, 10)}`;
  if (sessionStorage.getItem(key)) return;

  const overdueCount = overdue.length;
  const todayOpen = today.filter((t) => t.status !== 'COMPLETED').length;

  if (overdueCount === 0 && todayOpen === 0) return;

  let body = '';
  if (overdueCount > 0) body += `Просрочено: ${overdueCount}. `;
  if (todayOpen > 0) body += `На сегодня: ${todayOpen}.`;

  showNotification('TaskFlow — напоминание', {
    body: body.trim(),
    tag: 'taskflow-daily',
  });

  sessionStorage.setItem(key, '1');
}

/** Local schedule: fire when dueDate - offset is reached (client-side). */
export function checkLocalReminders(
  tasks: any[],
  fired: Set<string>,
  markFired: (id: string) => void
) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = Date.now();
  for (const t of tasks) {
    if (!t.dueDate || t.status === 'COMPLETED') continue;
    const due = new Date(t.dueDate).getTime();
    // Default: notify at due time and 15 min before if within window
    const offsets = [0, 15 * 60 * 1000];
    for (const off of offsets) {
      const key = `${t.id}-${off}`;
      if (fired.has(key)) continue;
      const at = due - off;
      // within last 60s window so polling every 30s catches it
      if (now >= at && now < at + 120_000) {
        const when =
          off === 0 ? 'Сейчас срок' : `Через ${Math.round(off / 60000)} мин срок`;
        showNotification(t.title, {
          body: when,
          tag: key,
          requireInteraction: off === 0,
        });
        markFired(key);
      }
    }
  }
}
