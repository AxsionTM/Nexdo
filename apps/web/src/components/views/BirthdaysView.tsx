'use client';

import { useEffect, useState } from 'react';
import { useBirthdaysStore, ageFromDate } from '@/stores/birthdays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cake, Plus, Trash2 } from 'lucide-react';

export function BirthdaysView() {
  const { items, loading, fetch, create, remove } = useBirthdaysStore();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [remindDays, setRemindDays] = useState(0);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    await create({ name: name.trim(), date, note: note || undefined, remindDays });
    setName('');
    setDate('');
    setNote('');
    setRemindDays(0);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-4">
        <Cake className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-semibold">Дни рождения</h1>
          <p className="text-xs text-muted-foreground">
            Родственники и близкие. В календаре — особая ячейка. Напоминание в браузере в этот день.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-xl border bg-card p-4 space-y-3 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Input placeholder="Заметка (необязательно)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Напомнить</span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={remindDays}
            onChange={(e) => setRemindDays(Number(e.target.value))}
          >
            <option value={0}>В день рождения</option>
            <option value={1}>За 1 день</option>
            <option value={3}>За 3 дня</option>
            <option value={7}>За 7 дней</option>
          </select>
          <Button type="submit" size="sm" className="ml-auto gap-1">
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>
      </form>

      {loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
      <div className="space-y-2">
        {items.map((b) => {
          const age = ageFromDate(b.date);
          const d = new Date(b.date);
          return (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5"
            >
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-lg">
                🎂
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {b.name}{' '}
                  <span className="text-muted-foreground font-normal">({age} лет)</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  {b.note ? ` · ${b.note}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => remove(b.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Пока пусто — добавьте первый день рождения
          </p>
        )}
      </div>
    </div>
  );
}
