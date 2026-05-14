import { SQLiteError } from 'bun:sqlite';
import { db } from '@db/index';
import { users } from '@db/schema';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { createToken } from '../services/auth';

const app = new Hono();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
});

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { username, password } = c.req.valid('json');

  try {
    const [user] = await db
      .insert(users)
      .values({
        username,
        passwordHash: await Bun.password.hash(password),
        createdAt: new Date(),
      })
      .returning();

    const token = await createToken(user.id);

    return c.json({ success: true, token }, 201);
  } catch (error) {
    if (
      error instanceof SQLiteError &&
      error.code === 'SQLITE_CONSTRAINT_UNIQUE'
    ) {
      return c.json(
        { success: false, message: 'Username already exists' },
        400,
      );
    }

    console.error('Error during registration:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

const loginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user) {
      const success = await Bun.password.verify(password, user.passwordHash);
      if (success) {
        const token = await createToken(user.id);
        return c.json({ success: true, token });
      }
    }

    return c.json(
      { success: false, message: 'Invalid username or password' },
      401,
    );
  } catch (error) {
    console.error('Error during login:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

export default app;
