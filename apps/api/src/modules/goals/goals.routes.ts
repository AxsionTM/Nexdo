import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
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
        unit: z.string().optional(),
        deadline: z.string().datetime().optional(),
        color: z.string().optional(),
      })
      .parse(req.body);

    const goal = await prisma.goal.create({
      data: {
        name: data.name,
        description: data.description,
        targetValue: data.targetValue,
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

export { router as goalsRouter };
