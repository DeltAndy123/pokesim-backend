import { authMiddleware, type Variables } from '@middleware/auth';
import { ClientMessageSchema } from '@services/battleMessages';
import {
  disconnect,
  forfeit,
  joinQueue,
  submitMove,
} from '@services/battleState';
import { logger } from '@util/logger';
import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/bun';

const app = new Hono<{ Variables: Variables }>();

app.get(
  '/ws',
  authMiddleware,
  upgradeWebSocket(async (c) => {
    // const token = c.req.query('token')
    // let userId: number | null = null
    const userId: number = c.get('userId');

    return {
      onOpen(_event, ws) {
        if (userId === null) return ws.close(1008, 'Unauthorized');

        logger.debug(`user ${userId} connected`)
      },
      onMessage(event, ws) {
        if (userId === null) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(event.data as string);
        } catch {
          return ws.send(
            JSON.stringify({ type: 'error', message: 'Invalid JSON' }),
          );
        }

        const result = ClientMessageSchema.safeParse(parsed);
        if (!result.success) {
          ws.send(
            JSON.stringify({ type: 'error', message: 'Invalid message' }),
          );
          return;
        }

        const message = result.data;
        switch (message.type) {
          case 'join_queue':
            logger.debug(`user ${userId} joined queue with team ${message.teamId}`)
            void joinQueue(userId, message.teamId, ws);
            break;
          case 'select_move':
            logger.debug(`user ${userId} selected move ${message.moveId}`)
            void submitMove(userId, message.moveId);
            break;
          case 'forfeit':
            logger.debug(`user ${userId} forfeited`)
            void forfeit(userId);
            break;
        }
      },
      onClose() {
        logger.debug(`user ${userId} disconnected`)
        disconnect(userId);
      },
    };
  }),
);

export default app;
