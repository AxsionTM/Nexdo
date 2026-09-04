'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Maximize2, Minus, Pause, Play, Plus, RotateCcw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GraphNodeType = 'date' | 'task';
export type GraphEdgeType = 'date' | 'parent' | 'timeline';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  color: string;
  taskId?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  startDate?: string | null;
  dateKey?: string;
  dateKeys?: string[];
  isSubtask?: boolean;
  isToday?: boolean;
  dayOffset?: number;
  parentId?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  projectColor?: string | null;
  pageRank?: number;
  clusterId?: number;
  clusterColor?: string;
  subtaskColor?: string | null;
  statusColor?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
}

interface PointNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fixed?: boolean;
}

interface Camera { x: number; y: number; zoom: number }
interface Props { nodes: GraphNode[]; edges: GraphEdge[]; onOpenTask?: (taskId: string) => void }

const PRIORITY_LABEL: Record<string, string> = { HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий', NONE: 'Без приоритета' };
const PRIORITY_COLOR: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6', NONE: '#94a3b8' };

function truncate(value: string, max = 32) { return value.length > max ? `${value.slice(0, max - 1)}…` : value; }
function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(148,163,184,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16); const g = parseInt(clean.slice(2, 4), 16); const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ObsidianGraph({ nodes, edges, onOpenTask }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<PointNode[]>([]);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const animationRef = useRef<number | null>(null);
  const dprRef = useRef(1);
  const dragRef = useRef<{ kind: 'node' | 'pan'; nodeId?: string; lastX: number; lastY: number; downX: number; downY: number } | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [query, setQuery] = useState('');

  const dateNodes = useMemo(() => nodes.filter((node) => node.type === 'date').sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0)), [nodes]);
  const taskNodes = useMemo(() => nodes.filter((node) => node.type === 'task'), [nodes]);
  const taskById = useMemo(() => new Map(taskNodes.map((node) => [node.taskId!, node])), [taskNodes]);

  const visibleTaskIds = useMemo(() => {
    if (!expandedDate) return new Set<string>();
    const result = new Set<string>();
    const direct = taskNodes.filter((task) => !task.parentId && (task.dateKeys?.includes(expandedDate) || task.dateKey === expandedDate));
    const childrenByParent = new Map<string, GraphNode[]>();
    for (const task of taskNodes) {
      if (!task.parentId) continue;
      const list = childrenByParent.get(task.parentId) ?? [];
      list.push(task); childrenByParent.set(task.parentId, list);
    }
    const addDescendants = (id: string) => {
      if (result.has(id)) return;
      result.add(id);
      for (const child of childrenByParent.get(id) ?? []) addDescendants(child.taskId!);
    };
    const addAncestors = (task: GraphNode) => {
      if (result.has(task.taskId!)) return;
      result.add(task.taskId!);
      if (task.parentId && taskById.has(task.parentId)) addAncestors(taskById.get(task.parentId)!);
    };
    for (const task of direct) { addAncestors(task); addDescendants(task.taskId!); }
    return result;
  }, [expandedDate, taskNodes, taskById]);

  const q = query.trim().toLocaleLowerCase();
  const visibleNodes = useMemo(() => {
    const dates = dateNodes;
    const tasks = taskNodes.filter((node) => visibleTaskIds.has(node.taskId!) && (!q || node.label.toLocaleLowerCase().includes(q)));
    return [...dates, ...tasks];
  }, [dateNodes, taskNodes, visibleTaskIds, q]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const visibleEdges = useMemo(() => edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)), [edges, visibleIds]);

  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) ?? null, [nodes, selectedId]);
  const neighbors = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const result = new Set<string>([selectedId]);
    for (const edge of edges) {
      if (edge.source === selectedId) result.add(edge.target);
      if (edge.target === selectedId) result.add(edge.source);
    }
    return result;
  }, [edges, selectedId]);

  const syncCanvasSize = () => {
    const canvas = canvasRef.current; const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr; canvas.width = Math.max(1, Math.floor(rect.width * dpr)); canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
  };

  const fitView = () => {
    const points = pointsRef.current.filter((point) => visibleIds.has(point.id)); const wrap = wrapRef.current;
    if (!points.length || !wrap) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const point of points) { minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x); minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y); }
    const rect = wrap.getBoundingClientRect(); const width = Math.max(520, maxX - minX + 260); const height = Math.max(360, maxY - minY + 260);
    cameraRef.current.zoom = Math.max(0.34, Math.min(1.65, Math.min(rect.width / width, rect.height / height)));
    cameraRef.current.x = (minX + maxX) / 2; cameraRef.current.y = (minY + maxY) / 2;
  };

  useEffect(() => {
    const previous = new Map(pointsRef.current.map((point) => [point.id, point]));
    const dateCount = dateNodes.length;
    const next = visibleNodes.map((node, index) => {
      const old = previous.get(node.id); if (old) return { ...old, ...node };
      if (node.type === 'date') {
        const i = node.dayOffset ?? index; const spread = Math.max(190, dateCount * 62);
        return { ...node, x: (i - (dateCount - 1) / 2) * 125, y: i === 0 ? 0 : Math.sin(i * 1.2) * 65, vx: 0, vy: 0, radius: node.isToday ? 20 : 15 };
      }
      const parent = node.parentId ? previous.get(`task:${node.parentId}`) : undefined;
      const date = (node.dateKeys?.[0] ?? node.dateKey) ? dateNodes.find((d) => d.dateKey === (node.dateKeys?.[0] ?? node.dateKey)) : undefined;
      const dateBaseX = ((date?.dayOffset ?? 0) - (dateCount - 1) / 2) * 125;
      const baseX = parent?.x ?? dateBaseX;
      const angle = index * 2.3999632297; const radius = 75 + Math.sqrt(index + 1) * 24;
      return { ...node, x: (parent?.x ?? baseX) + Math.cos(angle) * radius, y: (parent?.y ?? 0) + Math.sin(angle) * radius, vx: 0, vy: 0, radius: node.isSubtask ? 5.5 : Math.min(13, 7 + (node.pageRank ?? 0) * 5) };
    });
    pointsRef.current = next;
    requestAnimationFrame(fitView);
  }, [visibleNodes, dateNodes, visibleIds]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { syncCanvasSize(); const observer = new ResizeObserver(syncCanvasSize); if (wrapRef.current) observer.observe(wrapRef.current); return () => observer.disconnect(); }, []);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const simulate = () => {
      const points = pointsRef.current.filter((point) => visibleIds.has(point.id));
      const byId = new Map(points.map((point) => [point.id, point]));
      if (running && points.length) {
        const cellSize = 170; const grid = new Map<string, PointNode[]>();
        const key = (x: number, y: number) => `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;
        for (const point of points) { const k = key(point.x, point.y); const bucket = grid.get(k); if (bucket) bucket.push(point); else grid.set(k, [point]); }
        const repulsion = points.length > 500 ? 3600 : 6200;
        for (const a of points) {
          const cx = Math.floor(a.x / cellSize), cy = Math.floor(a.y / cellSize);
          for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
            for (const b of grid.get(`${cx + ox}:${cy + oy}`) ?? []) {
              if (a === b) continue; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy;
              if (d2 < 36) { dx = a.id < b.id ? -6 : 6; dy = a.id < b.id ? 5 : -5; d2 = 61; }
              const distance = Math.sqrt(d2); if (distance > cellSize * 1.4) continue; const force = repulsion / d2;
              a.vx += (dx / distance) * force; a.vy += (dy / distance) * force;
            }
          }
        }
        for (const edge of visibleEdges) {
          const a = byId.get(edge.source), b = byId.get(edge.target); if (!a || !b) continue;
          const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy));
          const target = edge.type === 'timeline' ? 125 : edge.type === 'date' ? 150 : 92;
          const strength = edge.type === 'timeline' ? 0.008 : edge.type === 'date' ? 0.005 : 0.007;
          const force = (distance - target) * strength, nx = dx / distance, ny = dy / distance;
          a.vx += nx * force; a.vy += ny * force; b.vx -= nx * force; b.vy -= ny * force;
        }
        const today = points.find((point) => point.type === 'date' && point.isToday);
        for (const point of points) {
          let centerForce = point.type === 'date' ? (point.isToday ? 0.0015 : 0.00035) : 0.00015;
          if (today && point.type === 'date' && !point.isToday) { point.vx += (today.x - point.x) * 0.00004; point.vy += (today.y - point.y) * 0.00004; }
          point.vx += -point.x * centerForce; point.vy += -point.y * centerForce; point.vx *= 0.87; point.vy *= 0.87;
          const speed = Math.hypot(point.vx, point.vy); if (speed > 7) { point.vx = point.vx / speed * 7; point.vy = point.vy / speed * 7; }
          if (!point.fixed) { point.x += point.vx; point.y += point.vy; }
        }
      }

      const dpr = dprRef.current; const rect = canvas.getBoundingClientRect(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, rect.width, rect.height);
      const foreground = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
      const muted = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim();
      const border = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
      const camera = cameraRef.current; const toScreen = (x: number, y: number) => ({ x: (x - camera.x) * camera.zoom + rect.width / 2, y: (y - camera.y) * camera.zoom + rect.height / 2 });

      for (const edge of visibleEdges) {
        const a = byId.get(edge.source), b = byId.get(edge.target); if (!a || !b) continue;
        const start = toScreen(a.x, a.y), end = toScreen(b.x, b.y); const highlighted = neighbors.has(edge.source) && neighbors.has(edge.target);
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.lineWidth = highlighted ? 2.2 : edge.type === 'parent' ? 1.4 : edge.type === 'date' ? 1.8 : 1;
        ctx.setLineDash(edge.type === 'timeline' ? [5, 7] : []);
        ctx.strokeStyle = edge.type === 'date' ? (a.type === 'date' ? a.color : b.color) : edge.type === 'parent' ? (b.clusterColor || '#64748b') : '#475569';
        ctx.globalAlpha = highlighted ? 0.95 : edge.type === 'timeline' ? 0.48 : 0.58; ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;

      for (const point of points) {
        const screen = toScreen(point.x, point.y); const focus = point.id === selectedRef.current; const dimmed = Boolean(selectedRef.current) && !neighbors.has(point.id);
        const scale = Math.max(0.75, Math.min(1.2, camera.zoom));
        const depth = point.type === 'date' ? 1 : 0.85 + (point.pageRank ?? 0) * 0.35;
        const radius = point.radius * depth * (focus ? 1.35 : 1) * scale;
        const color = point.type === 'task'
          ? (point.isSubtask ? (point.subtaskColor || '#c084fc') : PRIORITY_COLOR[point.priority || 'NONE'])
          : point.color;
        if (point.type === 'date') {
          ctx.beginPath(); ctx.arc(screen.x, screen.y, radius + (point.isToday ? 11 : 6), 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.globalAlpha = dimmed ? 0.05 : point.isToday ? 0.13 : 0.08; ctx.fill();
        }
        // 3D-like node: soft shadow + radial highlight, while keeping the graph lightweight.
        ctx.save();
        ctx.shadowBlur = focus ? 24 : 14;
        ctx.shadowColor = hexToRgba(color, dimmed ? 0.08 : 0.42);
        const gradient = ctx.createRadialGradient(
          screen.x - radius * 0.35, screen.y - radius * 0.4, Math.max(1, radius * 0.08),
          screen.x, screen.y, Math.max(2, radius)
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.16, color);
        gradient.addColorStop(1, color);
        ctx.beginPath(); ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient; ctx.globalAlpha = dimmed ? 0.22 : 0.98; ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.arc(screen.x, screen.y, radius + (focus ? 2 : 1), 0, Math.PI * 2);
        ctx.strokeStyle = focus ? (foreground || '#fff') : (point.type === 'task' ? (point.statusColor || border || '#334155') : (border || '#334155'));
        ctx.lineWidth = focus ? 2 : point.type === 'date' ? 1.5 : point.isSubtask ? 1.2 : 1;
        ctx.globalAlpha = dimmed ? 0.18 : 0.9; ctx.stroke();
        if (point.type === 'date' || focus || camera.zoom > 0.62) {
          ctx.font = `${point.type === 'date' ? (focus ? 14 : 12) : (focus ? 13 : 10)}px Inter, ui-sans-serif, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = foreground || '#e5e7eb'; ctx.globalAlpha = dimmed ? 0.2 : 0.94;
          ctx.fillText(truncate(point.label, point.type === 'date' ? 18 : 30), screen.x, screen.y + radius + (point.type === 'date' ? 8 : 5));
        }
      }
      ctx.globalAlpha = 1; animationRef.current = requestAnimationFrame(simulate);
    };
    animationRef.current = requestAnimationFrame(simulate); return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [visibleEdges, visibleIds, running, neighbors]);

  const screenToWorld = (clientX: number, clientY: number) => { const canvas = canvasRef.current!; const rect = canvas.getBoundingClientRect(); const camera = cameraRef.current; return { x: (clientX - rect.left - rect.width / 2) / camera.zoom + camera.x, y: (clientY - rect.top - rect.height / 2) / camera.zoom + camera.y }; };
  const findNode = (clientX: number, clientY: number) => { const { x, y } = screenToWorld(clientX, clientY); let closest: PointNode | null = null; let closestDistance = Infinity; for (const point of pointsRef.current) { if (!visibleIds.has(point.id)) continue; const distance = Math.hypot(point.x - x, point.y - y); const hitRadius = Math.max(14 / cameraRef.current.zoom, point.radius + 9); if (distance <= hitRadius && distance < closestDistance) { closest = point; closestDistance = distance; } } return closest; };
  const zoomAt = (factor: number, clientX?: number, clientY?: number) => { const canvas = canvasRef.current; if (!canvas) return; const camera = cameraRef.current; const targetZoom = Math.max(0.28, Math.min(3, camera.zoom * factor)); if (clientX !== undefined && clientY !== undefined) { const before = screenToWorld(clientX, clientY); camera.zoom = targetZoom; const after = screenToWorld(clientX, clientY); camera.x += before.x - after.x; camera.y += before.y - after.y; } else camera.zoom = targetZoom; };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const node = findNode(event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { kind: node ? 'node' : 'pan', nodeId: node?.id, lastX: event.clientX, lastY: event.clientY, downX: event.clientX, downY: event.clientY };
    if (node) {
      node.fixed = true;
    }
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current; if (!drag) return;
    const dx = event.clientX - drag.lastX, dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX; drag.lastY = event.clientY;
    if (drag.kind === 'node' && drag.nodeId) {
      const point = pointsRef.current.find((item) => item.id === drag.nodeId);
      if (point) { point.x += dx / cameraRef.current.zoom; point.y += dy / cameraRef.current.zoom; point.vx = 0; point.vy = 0; }
    } else {
      cameraRef.current.x -= dx / cameraRef.current.zoom; cameraRef.current.y -= dy / cameraRef.current.zoom;
    }
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const moved = Math.hypot(event.clientX - drag.downX, event.clientY - drag.downY);
    if (drag.kind === 'node' && drag.nodeId) {
      const point = pointsRef.current.find((item) => item.id === drag.nodeId);
      if (point) point.fixed = false;
      // Selection/expansion happens only on an actual click. Hover and drag never select a date.
      if (moved < 5) {
        const point = pointsRef.current.find((item) => item.id === drag.nodeId);
        if (point) {
          setSelectedId(point.id);
          if (point.type === 'date') setExpandedDate(point.dateKey ?? null);
        }
      }
    }
    dragRef.current = null;
  };
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => { event.preventDefault(); zoomAt(event.deltaY > 0 ? 0.9 : 1.1, event.clientX, event.clientY); };
  const reset = () => { for (const point of pointsRef.current) { point.vx = 0; point.vy = 0; point.fixed = false; } cameraRef.current = { x: 0, y: 0, zoom: 1 }; requestAnimationFrame(fitView); setRunning(true); };

  const expandedTasks = useMemo(() => expandedDate ? taskNodes.filter((task) => !task.parentId && (task.dateKeys?.includes(expandedDate) || task.dateKey === expandedDate)) : [], [expandedDate, taskNodes]);
  const taskCount = expandedDate ? expandedTasks.length : 0;
  const expandedDateNode = dateNodes.find((node) => node.dateKey === expandedDate);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
        <div className="min-w-[220px] flex-1"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по задачам…" className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring" />{query && <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}</div></div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />Сегодня <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Дни <span className="h-2.5 w-2.5 rounded-full bg-red-500" />Приоритет <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />Подзадача <span className="text-muted-foreground">Размер = PageRank</span></div>
        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5"><button title="Уменьшить" onClick={() => zoomAt(0.85)} className="rounded p-1.5 hover:bg-accent"><Minus className="h-4 w-4" /></button><button title="Увеличить" onClick={() => zoomAt(1.18)} className="rounded p-1.5 hover:bg-accent"><Plus className="h-4 w-4" /></button><button title="Вписать граф" onClick={fitView} className="rounded p-1.5 hover:bg-accent"><Maximize2 className="h-4 w-4" /></button><button title="Сбросить" onClick={reset} className="rounded p-1.5 hover:bg-accent"><RotateCcw className="h-4 w-4" /></button><button title={running ? 'Пауза физики' : 'Запустить физику'} onClick={() => setRunning((v) => !v)} className="rounded p-1.5 hover:bg-accent">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button></div>
      </div>

      <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden bg-background">
        <canvas ref={canvasRef} className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel} onDoubleClick={() => selected?.taskId && onOpenTask?.(selected.taskId)} />

        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border bg-card/90 px-3 py-2 text-xs shadow-sm backdrop-blur"><div className="font-semibold">Дни и задачи</div><div className="mt-1 text-muted-foreground">{dateNodes.length} дней · {expandedDate ? `${taskCount} задач` : 'выберите день'}</div><div className="mt-1 text-[10px] text-muted-foreground">Нажмите день — раскрыть · перетаскивание — навигация · колесо — масштаб</div></div>

        <div className="pointer-events-none absolute bottom-4 left-4 flex max-w-[520px] flex-wrap gap-1.5">{dateNodes.map((date) => <button key={date.id} onClick={() => { setSelectedId(date.id); setExpandedDate((current) => current === date.dateKey ? null : date.dateKey!); }} className={cn('pointer-events-auto rounded-full border px-2.5 py-1 text-[11px] transition-all', expandedDate === date.dateKey ? 'scale-105 bg-accent' : 'bg-card/85')}><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: date.color }} />{date.label}</button>)}</div>

        {expandedDateNode && <div className="absolute right-4 top-4 w-80 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur"><div className="flex items-start gap-3"><span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ background: expandedDateNode.color, boxShadow: `0 0 18px ${hexToRgba(expandedDateNode.color, .45)}` }} /><div className="min-w-0 flex-1"><div className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">Выбранный день</div><div className="mt-1 text-lg font-semibold">{expandedDateNode.label}</div><div className="mt-1 text-xs text-muted-foreground">{taskCount ? `${taskCount} задач + все подзадачи` : 'На этот день открытых задач нет'}</div></div><button onClick={() => setExpandedDate(null)} className="rounded p-1 hover:bg-accent"><X className="h-4 w-4" /></button></div><div className="mt-4 space-y-1.5">{expandedTasks.slice(0, 8).map((task) => <button key={task.id} onClick={() => onOpenTask?.(task.taskId!)} className="flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs hover:bg-accent"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PRIORITY_COLOR[task.priority || 'NONE'] }} /><span className="min-w-0 flex-1 truncate">{task.label}</span>{task.parentId ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}</button>)}{taskCount > 8 && <div className="pt-1 text-[10px] text-muted-foreground">+ ещё {taskCount - 8}…</div>}</div></div>}

        {!expandedDate && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-2xl border bg-card/80 px-5 py-4 text-center shadow-sm backdrop-blur"><div className="text-sm font-semibold">Выберите день</div><p className="mt-1 text-xs text-muted-foreground">Сегодня — жёлтый центральный узел. Нажмите любой день, чтобы раскрыть его задачи.</p></div></div>}
      </div>
    </div>
  );
}
