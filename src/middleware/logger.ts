import { logger } from '@util/logger';
import { createMiddleware } from 'hono/factory';

export const loggerMiddleware = createMiddleware(async (c, next) => {
  logger.debug('Request received:', c.req.method, c.req.url);
  await next();
  logger.debug('Response sent:', c.res.status);
  logger.debug('Response body:', await c.res.clone().text());
  logger.debug('----------------------------------------');
});
