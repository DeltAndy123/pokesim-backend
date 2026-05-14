import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as pokemonSchema from './pokemonSchema';
import * as schema from './schema';

const sqlite = new Database('game.db');
export const db = drizzle(sqlite, { schema });

// Static SQLite database from PokeAPI
const pokemonSqlite = new Database('pokemon.sqlite', { readonly: true });
export const pokemonDb = drizzle(pokemonSqlite, { schema: pokemonSchema });
