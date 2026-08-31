import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
import { AppError } from '../../common/middleware/error-handler';
import { AuthRequest } from '../../common/middleware/auth';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  projectId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isAllDay: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
  checklist: z
    .array(z.object({ title: z.string(), isCompleted: z.boolean().optional() }))
    .optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  sortOrder: z.number().optional(),
  isArchived: z.boolean().optional(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const {
      projectId,
      status,
      priority,
      dueBefore,
      dueAfter,
      parentId,
      search,
      includeCompleted,
      isArchived,
    } = req.query;

    const where: any = {
      creatorId: req.userId,
      isDeleted: false,
      parentId: parentId === 'null' ? null : parentId || undefined,
    };

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (isArchived === 'true') where.isArchived = true;
    else if (isArchived !== 'all') where.isArchived = false;

    if (includeCompleted !== 'true') {
      where.status = { not: 'COMPLETED' };
    }

    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) where.dueDate.lte = new Date(dueBefore as string);
      if (dueAfter) where.dueDate.gte = new Date(dueAfter as string);
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        checklist: { orderBy: { sortOrder: 'asc' } },
        children: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
          include: {
            tags: { include: { tag: true } },
            checklist: true,
          },
        },
        attachments: true,
        reminders: true,
        _count: { select: { children: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.get('/today', async (req: AuthRequest, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const tasks = await prisma.task.findMany({
      where: {
        creatorId: req.userId,
        isDeleted: false,
        isArchived: false,
        status: { not: 'COMPLETED' },
        OR: [
          { dueDate: { gte: start, lte: end } },
          { startDate: { gte: start, lte: end } },
        ],
      },
      include: {
        tags: { include: { tag: true } },
        checklist: true,
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.get('/overdue', async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        creatorId: req.userId,
        isDeleted: false,
        isArchived: false,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
      },
      include: {
        tags: { include: { tag: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        creatorId: req.userId,
        isDeleted: false,
      },
      include: {
        tags: { include: { tag: true } },
        checklist: { orderBy: { sortOrder: 'asc' } },
        children: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
        attachments: true,
        reminders: true,
        project: true,
        section: true,
      },
    });

    if (!task) {
      throw new AppError(404, 'Задача не найдена');
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'NONE',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        projectId: data.projectId,
        sectionId: data.sectionId,
        parentId: data.parentId,
        isAllDay: data.isAllDay ?? true,
        creatorId: req.userId!,
        tags: data.tagIds
          ? {
              create: data.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
        checklist: data.checklist
          ? {
              create: data.checklist.map((item, index) => ({
                title: item.title,
                isCompleted: item.isCompleted || false,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        checklist: true,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.userId}`).emit('task:created', task);
    }

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId, isDeleted: false },
    });

    if (!existing) {
      throw new AppError(404, 'Задача не найдена');
    }

    const updateData: any = { ...data };
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    if (data.status && data.status !== 'COMPLETED') {
      updateData.completedAt = null;
    }

    delete updateData.tagIds;
    delete updateData.checklist;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        tags: { include: { tag: true } },
        checklist: true,
        children: true,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.userId}`).emit('task:updated', task);
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId },
    });

    if (!existing) {
      throw new AppError(404, 'Задача не найдена');
    }

    await prisma.task.update({
      where: { id: req.params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.userId}`).emit('task:deleted', { id: req.params.id });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        tags: { include: { tag: true } },
        checklist: true,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.userId}`).emit('task:updated', task);
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

export { router as tasksRouter };
