import { verifyToken } from '@services/auth';
import { createMiddleware } from 'hono/factory';

type Variables = {
  userId: number;
};

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const header = c.req.header('Authorization');
    const token = header?.replace('Bearer ', '');

    if (!token) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const payload = await verifyToken(token);
      c.set('userId', payload.userId);
      await next();
    } catch {
      return c.json({ error: 'Invalid token' }, 401);
    }
  },
);
