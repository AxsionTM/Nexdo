import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
import { AppError } from '../../common/middleware/error-handler';
import { AuthRequest } from '../../common/middleware/auth';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional().nullable(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isAllDay: z.boolean().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']).optional(),
  recurrenceRule: z.string().optional().nullable(),
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

const checklistItemSchema = z.object({
  title: z.string().min(1),
  isCompleted: z.boolean().optional(),
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
        project: { select: { id: true, name: true, color: true } },
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
        parentId: null,
        OR: [
          { dueDate: { gte: start, lte: end } },
          { startDate: { gte: start, lte: end } },
        ],
      },
      include: {
        tags: { include: { tag: true } },
        checklist: { orderBy: { sortOrder: 'asc' } },
        children: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { children: true } },
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
        parentId: null,
        dueDate: { lt: now },
      },
      include: {
        tags: { include: { tag: true } },
        checklist: true,
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { children: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});


// --- Trash & Archive (before /:id to avoid param capture) ---

router.get('/trash/list', async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { creatorId: req.userId, isDeleted: true },
      include: {
        project: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { deletedAt: 'desc' },
      take: 100,
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.post('/trash/empty', async (req: AuthRequest, res, next) => {
  try {
    await prisma.task.deleteMany({
      where: { creatorId: req.userId, isDeleted: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/restore', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId, isDeleted: true },
    });
    if (!existing) throw new AppError(404, 'Задача не найдена в корзине');

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { isDeleted: false, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        checklist: true,
        project: { select: { id: true, name: true, color: true } },
      },
    });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/permanent', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Задача не найдена');
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId, isDeleted: false },
    });
    if (!existing) throw new AppError(404, 'Задача не найдена');
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { isArchived: true },
    });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/unarchive', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Задача не найдена');
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { isArchived: false },
    });
    res.json({ task });
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
          include: {
            tags: { include: { tag: true } },
            checklist: true,
          },
        },
        attachments: true,
        reminders: true,
        project: { select: { id: true, name: true, color: true } },
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
        status: data.status || 'TODO',
        recurrenceType: data.recurrenceType || 'NONE',
        recurrenceRule: data.recurrenceRule,
        creatorId: req.userId!,
        tags: data.tagIds
          ? { create: data.tagIds.map((tagId) => ({ tagId })) }
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
        children: true,
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { children: true } },
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

    const tagIds = data.tagIds;
    delete updateData.tagIds;
    delete updateData.checklist;

    if (tagIds !== undefined) {
      await prisma.taskTag.deleteMany({ where: { taskId: req.params.id } });
      if (tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tagId) => ({ taskId: req.params.id, tagId })),
        });
      }
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        tags: { include: { tag: true } },
        checklist: { orderBy: { sortOrder: 'asc' } },
        children: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { children: true } },
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
      data: { isDeleted: true, deletedAt: new Date() },
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
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId, isDeleted: false },
    });

    if (!existing) {
      throw new AppError(404, 'Задача не найдена');
    }

    const newStatus = existing.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : null,
      },
      include: {
        tags: { include: { tag: true } },
        checklist: true,
        children: true,
        project: { select: { id: true, name: true, color: true } },
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

// Checklist endpoints
router.post('/:id/checklist', async (req: AuthRequest, res, next) => {
  try {
    const data = checklistItemSchema.parse(req.body);

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId, isDeleted: false },
    });

    if (!task) {
      throw new AppError(404, 'Задача не найдена');
    }

    const maxOrder = await prisma.checklistItem.aggregate({
      where: { taskId: req.params.id },
      _max: { sortOrder: true },
    });

    const item = await prisma.checklistItem.create({
      data: {
        taskId: req.params.id,
        title: data.title,
        isCompleted: data.isCompleted || false,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/checklist/:itemId', async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({
        title: z.string().min(1).optional(),
        isCompleted: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
      .parse(req.body);

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId, isDeleted: false },
    });

    if (!task) {
      throw new AppError(404, 'Задача не найдена');
    }

    const item = await prisma.checklistItem.update({
      where: { id: req.params.itemId },
      data,
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/checklist/:itemId', async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, creatorId: req.userId, isDeleted: false },
    });

    if (!task) {
      throw new AppError(404, 'Задача не найдена');
    }

    await prisma.checklistItem.delete({ where: { id: req.params.itemId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as tasksRouter };
