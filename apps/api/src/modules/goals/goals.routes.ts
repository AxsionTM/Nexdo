import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
import { AppError } from '../../common/middleware/error-handler';
import { AuthRequest } from '../../common/middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      include: {
        habits: { include: { habit: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ goals });
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
        targetValue: z.number().optional(),
        currentValue: z.number().optional(),
        unit: z.string().optional(),
        deadline: z.string().datetime().optional().nullable(),
        color: z.string().optional(),
      })
      .parse(req.body);

    const goal = await prisma.goal.create({
      data: {
        name: data.name,
        description: data.description,
        targetValue: data.targetValue,
        currentValue: data.currentValue ?? 0,
        unit: data.unit,
        deadline: data.deadline ? new Date(data.deadline) : null,
        color: data.color || '#4A90D9',
        userId: req.userId!,
      },
    });

    res.status(201).json({ goal });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        targetValue: z.number().optional().nullable(),
        currentValue: z.number().optional(),
        unit: z.string().optional().nullable(),
        deadline: z.string().datetime().optional().nullable(),
        color: z.string().optional(),
        isCompleted: z.boolean().optional(),
      })
      .parse(req.body);

    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Цель не найдена');

    const updateData: any = { ...data };
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    if (
      data.currentValue !== undefined &&
      existing.targetValue &&
      data.currentValue >= existing.targetValue
    ) {
      updateData.isCompleted = true;
    }

    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ goal });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Цель не найдена');

    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as goalsRouter };
