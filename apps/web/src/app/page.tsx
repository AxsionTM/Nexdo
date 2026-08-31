export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          TickTick Clone
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Полный аналог TickTick со всеми Premium-функциями — бесплатно
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 text-left">
          <FeatureCard
            title="Задачи и списки"
            description="Подзадачи, приоритеты, теги, чек-листы, повторения, вложения"
          />
          <FeatureCard
            title="Представления"
            description="Список, Канбан, Календарь, Гант, Матрица Эйзенхауэра"
          />
          <FeatureCard
            title="Привычки"
            description="Трекинг, streaks, heatmaps, напоминания"
          />
          <FeatureCard
            title="AI-функции"
            description="Умное разбиение задач, рекомендации, анализ продуктивности"
          />
          <FeatureCard
            title="Фокус"
            description="Pomodoro-таймер + статистика + фоновые звуки"
          />
          <FeatureCard
            title="Совместная работа"
            description="Общие проекты, роли, права доступа"
          />
        </div>

        <div className="pt-8">
          <a
            href="/app"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Открыть приложение
          </a>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 pt-4">
          Стек: Next.js 14 · NestJS · PostgreSQL · Redis · MinIO · FastAPI
        </p>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-5 shadow-sm backdrop-blur">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
