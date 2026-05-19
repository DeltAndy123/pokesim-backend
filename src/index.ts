import { loggerMiddleware } from '@middleware/logger';
import auth from '@routes/auth';
import battle from '@routes/battle';
import teams from '@routes/teams';
import users from '@routes/users';
import { initTypeChart } from '@services/battle/typeChart';
import { Hono } from 'hono';
import { websocket } from 'hono/bun';

await initTypeChart();

const app = new Hono();

app.use(loggerMiddleware);

app.route('/auth', auth);
app.route('/users', users);
app.route('/teams', teams);
app.route('/battle', battle);

export default {
  fetch: app.fetch,
  websocket,
};
