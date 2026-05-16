import { apiMove, apiPokemon } from '@db/apiSchema';
import { apiDb } from '@db/index';
import { eq, inArray } from 'drizzle-orm';

interface InputPokemon {
  pokemonId: number;
  moves: number[];
}

export async function validateTeam(pokemon: InputPokemon[]): Promise<
  | {
      result: true;
    }
  | {
      result: false;
      reason: string;
    }
> {
  for (const p of pokemon) {
    const found = await apiDb
      .select()
      .from(apiPokemon)
      .where(eq(apiPokemon.id, p.pokemonId))
      .limit(1);

    if (found.length === 0) {
      return {
        result: false,
        reason: `Invalid Pokémon ID: ${p.pokemonId}`,
      };
    }

    const moves = await apiDb
      .select()
      .from(apiMove)
      .where(inArray(apiMove.id, p.moves))
      .limit(p.moves.length);

    if (moves.length !== p.moves.length) {
      return {
        result: false,
        reason: `One or more invalid move IDs for Pokémon ID: ${p.pokemonId}`,
      };
    }
  }

  return { result: true };
}
