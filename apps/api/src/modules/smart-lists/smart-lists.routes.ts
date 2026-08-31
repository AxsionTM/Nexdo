import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
import { AuthRequest } from '../../common/middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const lists = await prisma.smartList.findMany({
      where: { userId: req.userId },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ lists });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({
        name: z.string().min(1),
        filter: z.record(z.any()),
        icon: z.string().optional(),
        color: z.string().optional(),
      })
      .parse(req.body);

    const list = await prisma.smartList.create({
      data: {
        name: data.name,
        filter: data.filter,
        icon: data.icon,
        color: data.color,
        userId: req.userId!,
      },
    });

    res.status(201).json({ list });
  } catch (err) {
    next(err);
  }
});

export { router as smartListsRouter };
