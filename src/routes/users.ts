import { db } from '@db/index';
import { users } from '@db/schema';
import { authMiddleware, type Variables } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { logger } from '@util/logger';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono<{ Variables: Variables }>();

app.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return c.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

const userSchema = z.object({
  id: z.coerce.number().int().positive(),
});

app.get('/:id', validate('param', userSchema), async (c) => {
  const { id } = c.req.valid('param');

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return c.json({ message: 'User not found' }, 404);

    return c.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

export default app;
