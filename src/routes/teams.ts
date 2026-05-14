import { db } from '@db/index';
import { teamPokemon, teams } from '@db/schema';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@middleware/auth';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

type Variables = {
  userId: number;
};

const app = new Hono<{ Variables: Variables }>();

app.use(authMiddleware);

app.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const userTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.userId, userId));

    return c.json(userTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

const getTeamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

app.get('/:id', zValidator('param', getTeamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');

  try {
    const [team] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.userId, userId), eq(teams.id, id)))
      .limit(1);

    if (!team) return c.json({ error: 'Team not found' }, 404);

    const pokemon = await db
      .select()
      .from(teamPokemon)
      .where(eq(teamPokemon.teamId, team.id));

    return c.json({ ...team, pokemon });
  } catch (error) {
    console.error('Error fetching team:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

const teamSchema = z.object({
  name: z.string().min(1).max(100),
  pokemon: z
    .array(
      z.object({
        pokemonId: z.number().int().positive(),
        moves: z.array(z.number().int().positive()).min(1).max(4),
      }),
    )
    .min(1)
    .max(6),
});

app.post('/', zValidator('json', teamSchema), async (c) => {
  const userId = c.get('userId');
  const { name, pokemon } = c.req.valid('json');

  try {
    const [team] = await db.insert(teams).values({ userId, name }).returning();

    for (const p of pokemon) {
      await db.insert(teamPokemon).values({
        teamId: team.id,
        pokemonId: p.pokemonId,
        moveOneId: p.moves[0] ?? null,
        moveTwoId: p.moves[1] ?? null,
        moveThreeId: p.moves[2] ?? null,
        moveFourId: p.moves[3] ?? null,
      });
    }

    return c.json({ success: true, teamId: team.id }, 201);
  } catch (error) {
    console.error('Error creating team:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

export default app;
