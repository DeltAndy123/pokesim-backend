import { db } from '@db/index';
import { teamPokemon, teams } from '@db/schema';
import { authMiddleware } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { validateTeam } from '@services/validate';
import { and, eq, inArray } from 'drizzle-orm';
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

    if (userTeams.length === 0) return c.json([]);

    const teamIds = userTeams.map((t) => t.id);
    const allPokemon = await db
      .select({ teamId: teamPokemon.teamId, pokemonId: teamPokemon.pokemonId })
      .from(teamPokemon)
      .where(inArray(teamPokemon.teamId, teamIds));

    const pokemonByTeam = new Map<number, number[]>();
    for (const row of allPokemon) {
      const list = pokemonByTeam.get(row.teamId) ?? [];
      list.push(row.pokemonId);
      pokemonByTeam.set(row.teamId, list);
    }

    return c.json(
      userTeams.map((team) => ({
        ...team,
        pokemon: pokemonByTeam.get(team.id) ?? []
      }))
    );
  } catch (error) {
    console.error('Error fetching teams:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

const getTeamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

app.get('/:id', validate('param', getTeamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');

  try {
    const [team] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.userId, userId), eq(teams.id, id)))
      .limit(1);

    if (!team) return c.json({ message: 'Team not found' }, 404);

    const pokemon = await db
      .select()
      .from(teamPokemon)
      .where(eq(teamPokemon.teamId, team.id));

    return c.json({
      ...team,
      pokemon: pokemon.map((p) => ({
        id: p.id,
        teamId: p.teamId,
        moves: [p.moveOneId, p.moveTwoId, p.moveThreeId, p.moveFourId].filter(Boolean) as number[],
      }))
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

app.delete('/:id', validate('param', getTeamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');

  try {
    const deleteResult = await db
      .delete(teams)
      .where(and(eq(teams.userId, userId), eq(teams.id, id)))
      .returning();

    if (deleteResult.length === 0) {
      return c.json({ message: 'Team not found' }, 404);
    }

    return c.body(null, 204)
  } catch (error) {
    console.error('Error deleting team:', error);
    return c.json({ message: 'Internal server error' }, 500);
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

app.post('/', validate('json', teamSchema), async (c) => {
  const userId = c.get('userId');
  const { name, pokemon } = c.req.valid('json');

  try {
    const validation = await validateTeam(pokemon);
    if (!validation.result) {
      return c.json({ message: validation.reason }, 400);
    }

    const [team] = await db.insert(teams).values({ userId, name }).returning();

    await db.insert(teamPokemon).values(
      pokemon.map((p) => ({
        teamId: team.id,
        pokemonId: p.pokemonId,
        moveOneId: p.moves[0] ?? null,
        moveTwoId: p.moves[1] ?? null,
        moveThreeId: p.moves[2] ?? null,
        moveFourId: p.moves[3] ?? null,
      })),
    );

    return c.json({ teamId: team.id }, 201);
  } catch (error) {
    console.error('Error creating team:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

app.put('/:id', validate('param', getTeamSchema), validate('json', teamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const { name, pokemon } = c.req.valid('json');

  try {
    const validation = await validateTeam(pokemon);
    if (!validation.result) {
      return c.json({ message: validation.reason }, 400);
    }

    const [team] = await db
      .update(teams)
      .set({ name })
      .where(and(eq(teams.userId, userId), eq(teams.id, id)))
      .returning();

    if (!team) {
      return c.json({ message: 'Team not found' }, 404);
    }

    await db
      .delete(teamPokemon)
      .where(eq(teamPokemon.teamId, team.id));

    await db.insert(teamPokemon).values(
      pokemon.map((p) => ({
        teamId: team.id,
        pokemonId: p.pokemonId,
        moveOneId: p.moves[0] ?? null,
        moveTwoId: p.moves[1] ?? null,
        moveThreeId: p.moves[2] ?? null,
        moveFourId: p.moves[3] ?? null,
      })),
    );

    return c.body(null, 204);
  } catch (error) {
    console.error('Error updating team:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

export default app;
