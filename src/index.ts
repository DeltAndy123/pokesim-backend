import auth from '@routes/auth';
import teams from '@routes/teams';
import users from '@routes/users';
import { Hono } from 'hono';

const app = new Hono();

app.route('/auth', auth);
app.route('/users', users);
app.route('/teams', teams);

export default app;
