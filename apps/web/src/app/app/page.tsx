'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { FocusTicker } from '@/components/focus/FocusTicker';
import { EffectsLayer } from '@/components/EffectsLayer';
import { OnboardingTour } from '@/components/OnboardingTour';
import { GlobalQuickAdd } from '@/components/GlobalQuickAdd';
import { ReminderWorker } from '@/components/ReminderWorker';
import { Loader2, Menu, X } from 'lucide-react';

export default function AppPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="app-shell relative flex h-[100dvh] min-h-0 w-full max-w-[100vw] overflow-hidden">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <main className="flex w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden">
        <div className="mobile-app-header flex shrink-0 items-center gap-3 border-b bg-card/95 px-3 py-2 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background/70 hover:bg-accent"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold">TaskFlow</span>
        </div>
        <TaskList />
      </main>
      <TaskDetail />
      <NotificationPrompt />
      <FocusTicker />
      <EffectsLayer />
      <OnboardingTour />
      <GlobalQuickAdd />
      <ReminderWorker />
    </div>
  );
}
