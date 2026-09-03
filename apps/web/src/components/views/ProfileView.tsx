"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useTasksStore } from "@/stores/tasks";
import { useGoalsStore } from "@/stores/goals";
import { useProjectsStore } from "@/stores/projects";
import { useFocusStore } from "@/stores/focus";
import { useEffectsStore } from "@/stores/effects";
import { ThemePicker } from "@/components/ThemePicker";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ListTodo,
  FolderKanban,
  Activity,
  Sparkles,
  Mail,
  Shield,
} from "lucide-react";

export function ProfileView() {
  const { user, setUser } = useAuthStore();
  const { tasks, overdueTasks, fetchTasks, fetchOverdue } = useTasksStore();
  const { goals, fetchGoals } = useGoalsStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { stats, fetchStats } = useFocusStore();
  const { enabled: effectsOn, toggle: toggleEffects } = useEffectsStore();
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    fetchTasks({ includeCompleted: "true" });
    fetchOverdue();
    fetchGoals();
    fetchProjects();
    fetchStats();
  }, [fetchTasks, fetchOverdue, fetchGoals, fetchProjects, fetchStats]);

  useEffect(() => {
    setCompleted(tasks.filter((t) => t.status === "COMPLETED").length);
  }, [tasks]);

  const total = tasks.length;
  const productivity = useMemo(() => {
    if (total === 0) return 100;
    return Math.round((completed / Math.max(total, 1)) * 100);
  }, [completed, total]);

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activeGoals = goals.filter((g) => !g.isCompleted).slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Banner */}
      <div className="relative h-36 md:h-44 overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/10 to-background" />
        <div className="absolute inset-0 opacity-40 tf-glow-border" />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute left-10 bottom-6 flex items-end gap-4">
          <div className="h-20 w-20 rounded-2xl bg-card border-2 border-primary/40 flex items-center justify-center text-2xl font-bold shadow-lg">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {user?.name || "Пользователь"}
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                Pro
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Планируй задачи. Достигай целей. Живи продуктивно.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        {/* Birthday */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Дата рождения</h2>
          <p className="text-xs text-muted-foreground">
            Никак не влияет на работу приложения — только чтобы красиво выделить
            день в календаре.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              defaultValue={
                user?.birthday ? String(user.birthday).slice(0, 10) : ""
              }
              onChange={async (e) => {
                const v = e.target.value || null;
                try {
                  const { user: u } = await api.updateProfile({ birthday: v });
                  setUser?.(u);
                } catch (err: any) {
                  alert(
                    (err?.message || "Не удалось сохранить") +
                      "\nЕсли колонки birthday ещё нет: в apps/api выполните npx prisma db push",
                  );
                }
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            icon={<ListTodo className="h-4 w-4 text-blue-500" />}
            label="Всего задач"
            value={total}
            sub="Все время"
          />
          <Stat
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            label="Выполнено"
            value={completed}
            sub={
              total
                ? `${Math.round((completed / total) * 100)}% завершено`
                : "—"
            }
          />
          <Stat
            icon={<FolderKanban className="h-4 w-4 text-violet-500" />}
            label="Проектов"
            value={projects.length}
            sub="Активных"
          />
          <Stat
            icon={<Activity className="h-4 w-4 text-amber-500" />}
            label="Продуктивность"
            value={`${productivity}%`}
            sub={
              overdueTasks.length
                ? `Просрочено: ${overdueTasks.length}`
                : "Отличный результат"
            }
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Goals */}
          <div className="rounded-2xl border bg-card p-4 tf-glow-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Текущие цели</h2>
            </div>
            {activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока нет активных целей
              </p>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((g) => {
                  const targetValue = g.targetValue ?? 0;
                  const currentValue = g.currentValue ?? 0;

                  const pct =
                    targetValue > 0
                      ? Math.min(
                          100,
                          Math.round((currentValue / targetValue) * 100),
                        )
                      : 0;

                  return (
                    <div key={g.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate">{g.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {g.currentValue}/{g.targetValue || "—"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personalization */}
          <div className="rounded-2xl border bg-card p-4 space-y-4">
            <h2 className="text-sm font-semibold">Персонализация</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Тема оформления</p>
                <p className="text-xs text-muted-foreground">
                  Цвета интерфейса
                </p>
              </div>
              <ThemePicker />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Эффекты</p>
                <p className="text-xs text-muted-foreground">
                  Частицы и свечение
                </p>
              </div>
              <button
                type="button"
                onClick={toggleEffects}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  effectsOn ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    effectsOn ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Logo size={28} />
              <span>TaskFlow · {stats?.totalMinutes ?? 0} мин фокуса</span>
            </div>
          </div>

          {/* Account */}
          <div className="rounded-2xl border bg-card p-4 md:col-span-2">
            <h2 className="text-sm font-semibold mb-3">Настройки аккаунта</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Электронная почта
                  </p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Безопасность</p>
                  <p className="font-medium">Пароль · OAuth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
