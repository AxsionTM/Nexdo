import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
import { AppError } from '../../common/middleware/error-handler';
import { AuthRequest } from '../../common/middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isArchived: false },
      include: {
        logs: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ habits });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        frequency: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
        targetDays: z.array(z.number()).optional(),
        targetCount: z.number().optional(),
        reminderTime: z.string().optional(),
      })
      .parse(req.body);

    const habit = await prisma.habit.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#4A90D9',
        frequency: data.frequency || 'DAILY',
        targetDays: data.targetDays || [],
        targetCount: data.targetCount || 1,
        reminderTime: data.reminderTime,
        userId: req.userId!,
      },
    });

    res.status(201).json({ habit });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/log', async (req: AuthRequest, res, next) => {
  try {
    const { date, count, note } = z
      .object({
        date: z.string(),
        count: z.number().optional(),
        note: z.string().optional(),
      })
      .parse(req.body);

    const habit = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!habit) {
      throw new AppError(404, 'Привычка не найдена');
    }

    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: req.params.id,
          date: logDate,
        },
      },
      create: {
        habitId: req.params.id,
        date: logDate,
        count: count || 1,
        note,
      },
      update: {
        count: count || 1,
        note,
      },
    });

    res.json({ log });
  } catch (err) {
    next(err);
  }
});

export { router as habitsRouter };
