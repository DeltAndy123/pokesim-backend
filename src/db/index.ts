import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as apiSchema from './apiSchema';
import * as schema from './schema';

const sqlite = new Database('game.db');
export const db = drizzle(sqlite, { schema });

// Static SQLite database from PokeAPI
const apiSqlite = new Database('pokemon.sqlite', { readonly: true });
export const apiDb = drizzle(apiSqlite, { schema: apiSchema });
