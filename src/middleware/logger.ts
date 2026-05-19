import { createMiddleware } from 'hono/factory';

export const loggerMiddleware = createMiddleware(async (c, next) => {
  console.log('Request received:', c.req.method, c.req.url);
  await next();
  console.log('Response sent:', c.res.status);
  console.log('Response body:', await c.res.clone().text());
  console.log('----------------------------------------');
});
