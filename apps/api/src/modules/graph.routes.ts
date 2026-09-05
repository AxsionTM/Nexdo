import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../common/utils/prisma';
import { AuthRequest } from '../common/middleware/auth';

const router = Router();

const querySchema = z.object({
  days: z.coerce.number().int().min(3).max(31).optional().default(7),
  limit: z.coerce.number().int().min(1).max(5000).optional().default(2000),
  timezone: z.string().min(1).max(100).optional().default('UTC'),
});

function dateKeyInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function addDaysKey(key: string, amount: number) {
  const date = new Date(`${key}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function priorityColor(priority: string, isSubtask = false) {
  if (isSubtask) return '#c084fc';
  if (priority === 'HIGH') return '#ef4444';
  if (priority === 'MEDIUM') return '#f59e0b';
  if (priority === 'LOW') return '#3b82f6';
  return '#22a06b';
}

function taskDateKeys(
  startDate: Date | null,
  dueDate: Date | null,
  startKey: string,
  endKeyExclusive: string,
  timezone: string,
) {
  const first = dateKeyInTimeZone(startDate ?? dueDate!, timezone);
  const last = dateKeyInTimeZone(dueDate ?? startDate!, timezone);
  const from = first <= last ? first : last;
  const to = first <= last ? last : first;
  if (to < startKey || from >= endKeyExclusive) return [];

  const result: string[] = [];
  // A task belongs to every calendar day touched by its time interval.
  // Clamp the cursor first so an old task cannot make us iterate through years of dates.
  let cursor = from < startKey ? startKey : from;
  while (cursor < endKeyExclusive && cursor <= to && result.length < 31) {
    result.push(cursor);
    if (cursor === to) break;
    cursor = addDaysKey(cursor, 1);
  }
  return result;
}


function clusterGraph(nodeIds: string[], edges: Array<{ source: string; target: string }>) {
  const adjacency = new Map<string, string[]>();
  for (const id of nodeIds) adjacency.set(id, []);
  for (const edge of edges) {
    // Timeline is a visual calendar spine, not a semantic cluster relation.
    if ((edge as any).type === 'timeline') continue;
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }
  const cluster = new Map<string, number>();
  let next = 0;
  for (const id of nodeIds) {
    if (cluster.has(id)) continue;
    const queue = [id]; cluster.set(id, next);
    while (queue.length) {
      const current = queue.shift()!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!cluster.has(neighbor)) { cluster.set(neighbor, next); queue.push(neighbor); }
      }
    }
    next++;
  }
  return cluster;
}

function pageRank(nodeIds: string[], edges: Array<{ source: string; target: string }>) {
  const n = Math.max(1, nodeIds.length);
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const id of nodeIds) { incoming.set(id, []); outgoing.set(id, []); }
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
  }
  let rank = new Map(nodeIds.map((id) => [id, 1 / n]));
  const damping = 0.85;
  for (let iteration = 0; iteration < 24; iteration++) {
    const next = new Map<string, number>();
    for (const id of nodeIds) {
      let value = (1 - damping) / n;
      for (const source of incoming.get(id) ?? []) {
        const degree = outgoing.get(source)?.length ?? 0;
        if (degree) value += damping * (rank.get(source) ?? 0) / degree;
      }
      next.set(id, value);
    }
    rank = next;
  }
  const max = Math.max(...rank.values(), 1e-9);
  return new Map([...rank].map(([id, value]) => [id, value / max]));
}

function clusterColor(index: number) {
  const palette = ['#38bdf8','#a78bfa','#34d399','#fb7185','#fbbf24','#22d3ee','#f472b6','#818cf8'];
  return palette[index % palette.length];
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { days, limit, timezone } = querySchema.parse(req.query);
    const userId = req.userId!;

    const now = new Date();
    const todayKey = dateKeyInTimeZone(now, timezone);
    const startKey = todayKey;
    const endKeyExclusive = addDaysKey(startKey, days);

    const roots = await prisma.task.findMany({
      where: {
        creatorId: userId,
        isDeleted: false,
        isArchived: false,
        status: { not: 'COMPLETED' },
        parentId: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        parentId: true,
        projectId: true,
        startDate: true,
        dueDate: true,
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ startDate: 'asc' }, { dueDate: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // Load the complete descendant tree separately. This guarantees that a parent
    // task created in Inbox still brings its subtasks into the graph even when the
    // root-task limit is reached.
    const descendants = roots.length
      ? await prisma.task.findMany({
          where: {
            creatorId: userId,
            isDeleted: false,
            isArchived: false,
            status: { not: 'COMPLETED' },
            parentId: { not: null },
          },
          select: {
            id: true, title: true, status: true, priority: true, parentId: true, projectId: true,
            startDate: true, dueDate: true,
            project: { select: { id: true, name: true, color: true } },
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          take: 5000,
        })
      : [];
    const tasks = [...roots, ...descendants];

    const taskNodes = tasks.map((task) => {
      const dateKeys = taskDateKeys(task.startDate, task.dueDate, startKey, endKeyExclusive, timezone);
      return {
        id: `task:${task.id}`,
        label: task.title,
        type: 'task' as const,
        color: priorityColor(task.priority, Boolean(task.parentId)),
        taskId: task.id,
        status: task.status,
        priority: task.priority,
        startDate: task.startDate,
        dueDate: task.dueDate,
        dateKey: dateKeys[0] ?? null,
        dateKeys,
        isSubtask: Boolean(task.parentId),
        parentId: task.parentId,
        projectId: task.projectId,
        projectName: task.project?.name ?? null,
        projectColor: task.project?.color ?? null,
      };
    });

    const dateNodes = Array.from({ length: days }, (_, index) => {
      const key = addDaysKey(startKey, index);
      const date = new Date(`${key}T12:00:00.000Z`);
      const formatter = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'UTC',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      return {
        id: `date:${key}`,
        label: index === 0 ? 'Сегодня' : index === 1 ? 'Завтра' : formatter.format(date).replace('.', '').replace(',', ' ·'),
        type: 'date' as const,
        color: index === 0 ? '#facc15' : `hsl(${205 + (index * 29) % 135} 82% 58%)`,
        dateKey: key,
        isToday: index === 0,
        dayOffset: index,
      };
    });

    const taskIds = new Set(tasks.map((task) => task.id));
    const edges: Array<{ id: string; source: string; target: string; type: 'date' | 'parent' | 'timeline' }> = [];
    const edgeKeys = new Set<string>();
    const addEdge = (source: string, target: string, type: 'date' | 'parent' | 'timeline') => {
      const id = `${source}|${target}|${type}`;
      if (edgeKeys.has(id)) return;
      edgeKeys.add(id);
      edges.push({ id, source, target, type });
    };

    for (let index = 1; index < dateNodes.length; index++) {
      addEdge(dateNodes[index - 1].id, dateNodes[index].id, 'timeline');
    }

    // Subtasks connect only to their parent. They never connect directly to a date node.
    for (const task of tasks) {
      if (task.parentId && taskIds.has(task.parentId)) {
        addEdge(`task:${task.parentId}`, `task:${task.id}`, 'parent');
      }
    }

    // Root tasks are attached to every calendar day touched by their interval.
    // This makes 04.09 20:00 → 05.09 10:00 visible from both dates.
    for (const task of taskNodes) {
      if (task.parentId) continue;
      for (const dateKey of task.dateKeys) {
        addEdge(`date:${dateKey}`, task.id, 'date');
      }
    }

    const allNodes = [...dateNodes, ...taskNodes];
    const graphIds = allNodes.map((node) => node.id);
    const rank = pageRank(graphIds, edges);
    const clusters = clusterGraph(graphIds, edges);
    const enrichedNodes = allNodes.map((node) => ({
      ...node,
      pageRank: rank.get(node.id) ?? 0,
      clusterId: clusters.get(node.id) ?? 0,
      clusterColor: clusterColor(clusters.get(node.id) ?? 0),
      subtaskColor: node.type === 'task' && node.isSubtask ? '#c084fc' : null,
      statusColor: node.type === 'task'
        ? (node.status === 'IN_PROGRESS' ? '#22c55e' : node.status === 'CANCELLED' ? '#64748b' : '#e2e8f0')
        : node.color,
    }));

    res.json({ timezone, todayKey, days, nodes: enrichedNodes, edges });
  } catch (err) {
    next(err);
  }
});

export { router as graphRouter };
