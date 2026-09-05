'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Network, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useTasksStore } from '@/stores/tasks';
import { GraphNode, GraphEdge, ObsidianGraph } from './ObsidianGraph';

export function GraphView() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setSelectedTask = useTasksStore((state) => state.setSelectedTask);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    api.getGraph({ days: '8', limit: '2000', timezone })
      .then((data) => { if (!active) return; setNodes(data.nodes); setEdges(data.edges); setError(null); })
      .catch((err) => { if (active) setError(err?.message || 'Не удалось загрузить граф'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (error) return <div className="flex flex-1 items-center justify-center"><div className="rounded-lg border bg-card px-5 py-4 text-sm text-destructive">{error}</div></div>;

  const downloadVault = async () => {
    const token = api.getToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/export/obsidian`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { alert('Не удалось экспортировать Obsidian vault'); return; }
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `taskflow-obsidian-${new Date().toISOString().slice(0,10)}.zip`; a.click(); URL.revokeObjectURL(a.href);
  };

  const importVault = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append('file', file);
    const token = api.getToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/export/obsidian/import`;
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data?.message || 'Не удалось импортировать vault');
    else { alert(`Импортировано задач: ${data.imported}`); window.location.reload(); }
    event.target.value = '';
  };

  return <div className="flex min-h-0 flex-1 flex-col"><header className="tf-view-header flex items-center gap-3 border-b px-6 py-3"><Network className="h-5 w-5 text-primary" /><div><h1 className="text-xl font-semibold">Граф</h1><p className="text-sm text-muted-foreground">8 дней → задачи → подзадачи · force-directed · PageRank · кластеры</p></div><div className="ml-auto flex items-center gap-1"><button onClick={downloadVault} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent"><Download className="h-3.5 w-3.5" />Export .md + .obsidian</button><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent"><Upload className="h-3.5 w-3.5" />Import vault<input type="file" accept=".zip,.md" className="hidden" onChange={importVault} /></label></div></header><ObsidianGraph nodes={nodes} edges={edges} onOpenTask={setSelectedTask} /></div>;
}
