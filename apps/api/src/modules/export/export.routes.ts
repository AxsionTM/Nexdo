import { Router } from 'express';
import { prisma } from '../../common/utils/prisma';
import { AuthRequest } from '../../common/middleware/auth';

const router = Router();

router.get('/json', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const [tasks, projects, tags, habits, goals, focusSessions] = await Promise.all([
      prisma.task.findMany({
        where: { creatorId: userId, isDeleted: false },
        include: {
          tags: { include: { tag: true } },
          checklist: true,
        },
      }),
      prisma.projectMember.findMany({
        where: { userId },
        include: { project: true },
      }),
      prisma.tag.findMany({ where: { userId } }),
      prisma.habit.findMany({
        where: { userId, isArchived: false },
        include: { logs: true },
      }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.focusSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 100,
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      tasks,
      projects: projects.map((p) => p.project),
      tags,
      habits,
      goals,
      focusSessions,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="taskflow-export-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get('/csv', async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { creatorId: req.userId, isDeleted: false, parentId: null },
      include: {
        project: { select: { name: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const header = 'title,status,priority,dueDate,project,tags,description';
    const rows = tasks.map((t) =>
      [
        escape(t.title),
        t.status,
        t.priority,
        t.dueDate ? t.dueDate.toISOString().slice(0, 10) : '',
        escape(t.project?.name || ''),
        escape(t.tags.map((tt) => tt.tag.name).join('; ')),
        escape(t.description || ''),
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="taskflow-tasks-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send('\uFEFF' + csv);
  } catch (err) {
    next(err);
  }
});

export { router as exportRouter };
