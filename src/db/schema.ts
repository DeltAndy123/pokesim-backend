import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
});

export const teamPokemon = sqliteTable('team_pokemon', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  pokemonId: integer('pokemon_id').notNull(), // references apiPokemon ("pokemon_v2_pokemon")
  moveOneId: integer('move_one_id'), // references apiMove ("pokemon_v2_move")
  moveTwoId: integer('move_two_id'), // references apiMove ("pokemon_v2_move")
  moveThreeId: integer('move_three_id'), // references apiMove ("pokemon_v2_move")
  moveFourId: integer('move_four_id'), // references apiMove ("pokemon_v2_move")
});
