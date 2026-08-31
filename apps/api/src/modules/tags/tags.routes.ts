import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
import { AppError } from '../../common/middleware/error-handler';
import { AuthRequest } from '../../common/middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });
    res.json({ tags });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({
        name: z.string().min(1),
        color: z.string().optional(),
      })
      .parse(req.body);

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        color: data.color || '#808080',
        userId: req.userId!,
      },
    });

    res.status(201).json({ tag });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const tag = await prisma.tag.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!tag) {
      throw new AppError(404, 'Тег не найден');
    }

    await prisma.tag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as tagsRouter };
