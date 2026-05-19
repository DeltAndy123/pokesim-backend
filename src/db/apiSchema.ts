import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// CREATE TABLE IF NOT EXISTS "pokemon_v2_pokemon" ("id" INTEGER NOT NULL, "name" TEXT NOT NULL, "order" INTEGER, "height" INTEGER, "weight" INTEGER, "base_experience" INTEGER, "is_default" INTEGER NOT NULL, "pokemon_species_id" INTEGER);
export const apiPokemon = sqliteTable('pokemon_v2_pokemon', {
  id: integer('id').notNull(),
  name: text('name').notNull(),
  order: integer('order'),
  height: integer('height'),
  weight: integer('weight'),
  baseExperience: integer('base_experience'),
  isDefault: integer('is_default').notNull(),
  pokemonSpeciesId: integer('pokemon_species_id'),
});

// CREATE TABLE IF NOT EXISTS "pokemon_v2_pokemonspecies" ("id" INTEGER NOT NULL, "name" TEXT NOT NULL, "order" INTEGER, "gender_rate" INTEGER, "capture_rate" INTEGER, "base_happiness" INTEGER, "is_baby" INTEGER NOT NULL, "hatch_counter" INTEGER, "has_gender_differences" INTEGER NOT NULL, "forms_switchable" INTEGER NOT NULL, "evolution_chain_id" INTEGER, "evolves_from_species_id" INTEGER, "generation_id" INTEGER, "growth_rate_id" INTEGER, "pokemon_color_id" INTEGER, "pokemon_habitat_id" INTEGER, "pokemon_shape_id" INTEGER, "is_legendary" INTEGER NOT NULL, "is_mythical" INTEGER NOT NULL);
export const apiPokemonSpecies = sqliteTable('pokemon_v2_pokemonspecies', {
  id: integer('id').notNull(),
  name: text('name').notNull(),
  order: integer('order'),
  genderRate: integer('gender_rate'),
  captureRate: integer('capture_rate'),
  baseHappiness: integer('base_happiness'),
  isBaby: integer('is_baby').notNull(),
  hatchCounter: integer('hatch_counter'),
  hasGenderDifferences: integer('has_gender_differences').notNull(),
  formsSwitchable: integer('forms_switchable').notNull(),
  evolutionChainId: integer('evolution_chain_id'),
  evolvesFromSpeciesId: integer('evolves_from_species_id'),
  generationId: integer('generation_id'),
  growthRateId: integer('growth_rate_id'),
  pokemonColorId: integer('pokemon_color_id'),
  pokemonHabitatId: integer('pokemon_habitat_id'),
  pokemonShapeId: integer('pokemon_shape_id'),
  isLegendary: integer('is_legendary').notNull(),
  isMythical: integer('is_mythical').notNull(),
});

// CREATE TABLE IF NOT EXISTS "pokemon_v2_move" ("id" INTEGER NOT NULL, "name" TEXT NOT NULL, "power" INTEGER, "pp" INTEGER, "accuracy" INTEGER, "priority" INTEGER, "move_effect_chance" INTEGER, "generation_id" INTEGER, "move_damage_class_id" INTEGER, "move_effect_id" INTEGER, "move_target_id" INTEGER, "type_id" INTEGER, "contest_effect_id" INTEGER, "contest_type_id" INTEGER, "super_contest_effect_id" INTEGER);
export const apiMove = sqliteTable('pokemon_v2_move', {
  id: integer('id').notNull(),
  name: text('name').notNull(),
  power: integer('power'),
  pp: integer('pp'),
  accuracy: integer('accuracy'),
  priority: integer('priority'),
  moveEffectChance: integer('move_effect_chance'),
  generationId: integer('generation_id'),
  moveDamageClassId: integer('move_damage_class_id'),
  moveEffectId: integer('move_effect_id'),
  moveTargetId: integer('move_target_id'),
  typeId: integer('type_id'),
  contestEffectId: integer('contest_effect_id'),
  contestTypeId: integer('contest_type_id'),
  superContestEffectId: integer('super_contest_effect_id'),
});

// CREATE TABLE IF NOT EXISTS "pokemon_v2_pokemonstat" ("id" INTEGER NOT NULL, "base_stat" INTEGER NOT NULL, "effort" INTEGER NOT NULL, "pokemon_id" INTEGER, "stat_id" INTEGER);
export const apiPokemonStat = sqliteTable('pokemon_v2_pokemonstat', {
  id: integer('id').notNull(),
  baseStat: integer('base_stat').notNull(),
  effort: integer('effort').notNull(),
  pokemonId: integer('pokemon_id'),
  statId: integer('stat_id'),
});

// CREATE TABLE IF NOT EXISTS "pokemon_v2_pokemontype" ("id" INTEGER NOT NULL, "slot" INTEGER NOT NULL, "pokemon_id" INTEGER, "type_id" INTEGER);
export const apiPokemonType = sqliteTable('pokemon_v2_pokemontype', {
  id: integer('id').notNull(),
  slot: integer('slot').notNull(),
  pokemonId: integer('pokemon_id'),
  typeId: integer('type_id'),
});

// CREATE TABLE IF NOT EXISTS "pokemon_v2_typeefficacy" ("id" INTEGER NOT NULL, "damage_factor" INTEGER NOT NULL, "damage_type_id" INTEGER, "target_type_id" INTEGER);
export const apiTypeEfficacy = sqliteTable('pokemon_v2_typeefficacy', {
  id: integer('id').notNull(),
  damageFactor: integer('damage_factor').notNull(),
  damageTypeId: integer('damage_type_id'),
  targetTypeId: integer('target_type_id'),
});

// CREATE TABLE IF NOT EXISTS "pokemon_v2_pokemonmove" ("id" INTEGER NOT NULL, "order" INTEGER, "level" INTEGER NOT NULL, "move_id" INTEGER, "pokemon_id" INTEGER, "version_group_id" INTEGER, "move_learn_method_id" INTEGER, "mastery" INTEGER);
export const apiPokemonMove = sqliteTable('pokemon_v2_pokemonmove', {
  id: integer('id').notNull(),
  order: integer('order'),
  level: integer('level').notNull(),
  moveId: integer('move_id'),
  pokemonId: integer('pokemon_id'),
  versionGroupId: integer('version_group_id'),
  moveLearnMethodId: integer('move_learn_method_id'),
  mastery: integer('mastery'),
});
