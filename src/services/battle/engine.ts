import { apiMove, apiPokemonStat, apiPokemonType } from '@db/apiSchema';
import { apiDb } from '@db/index';
import { getTypeMultiplier } from '@services/battle/typeChart';
import { eq } from 'drizzle-orm';
import type { MoveOutcome } from './messages';
import type { BattleRoom, BattlingPlayer } from './types';

const LEVEL = 50;

// stat_id constants
const STAT_HP = 1;
const STAT_ATTACK = 2;
const STAT_DEFENSE = 3;
const STAT_SP_ATK = 4;
const STAT_SP_DEF = 5;
const STAT_SPEED = 6;

// move_damage_class_id constants
const CLASS_PHYSICAL = 2;
const _CLASS_SPECIAL = 3;

interface MoveData {
  power: number | null;
  moveDamageClassId: number | null;
  priority: number | null;
  typeId: number | null;
}

interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

async function fetchMoveData(moveId: number): Promise<MoveData | null> {
  const rows = await apiDb
    .select({
      power: apiMove.power,
      moveDamageClassId: apiMove.moveDamageClassId,
      priority: apiMove.priority,
      typeId: apiMove.typeId,
    })
    .from(apiMove)
    .where(eq(apiMove.id, moveId))
    .limit(1);
  return rows[0] ?? null;
}

async function fetchStats(pokemonId: number): Promise<PokemonStats> {
  const rows = await apiDb
    .select({
      statId: apiPokemonStat.statId,
      baseStat: apiPokemonStat.baseStat,
    })
    .from(apiPokemonStat)
    .where(eq(apiPokemonStat.pokemonId, pokemonId));

  const byId: Record<number, number> = {};
  for (const row of rows) {
    if (row.statId != null) byId[row.statId] = row.baseStat;
  }

  return {
    hp: byId[STAT_HP] ?? 100,
    attack: byId[STAT_ATTACK] ?? 50,
    defense: byId[STAT_DEFENSE] ?? 50,
    spAtk: byId[STAT_SP_ATK] ?? 50,
    spDef: byId[STAT_SP_DEF] ?? 50,
    speed: byId[STAT_SPEED] ?? 50,
  };
}

async function fetchTypes(pokemonId: number): Promise<number[]> {
  const rows = await apiDb
    .select({ typeId: apiPokemonType.typeId })
    .from(apiPokemonType)
    .where(eq(apiPokemonType.pokemonId, pokemonId));

  return rows.map((r) => r.typeId).filter((t) => t != null);
}

function calcDamage(
  power: number,
  atk: number,
  def: number,
  multiplier: number,
): number {
  const base =
    Math.floor((Math.floor((2 * LEVEL) / 5 + 2) * power * atk) / def / 50) + 2;
  const roll = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.floor(base * roll * multiplier));
}

function applyMove(
  attacker: BattlingPlayer,
  defender: BattlingPlayer,
  moveId: number,
  moveData: MoveData,
  atkStats: PokemonStats,
  defStats: PokemonStats,
  defTypes: number[],
  outcomes: MoveOutcome[],
): boolean {
  const power = moveData.power;
  if (!power) return false; // status move, no damage

  const isPhysical = moveData.moveDamageClassId === CLASS_PHYSICAL;
  const atk = isPhysical ? atkStats.attack : atkStats.spAtk;
  const def = isPhysical ? defStats.defense : defStats.spDef;

  const target = defender.pokemon[defender.activeSlot];

  const effectiveness = getTypeMultiplier(moveData.typeId ?? 1, defTypes);

  const damage = calcDamage(power, atk, def, effectiveness);
  target.hp = Math.max(0, target.hp - damage);

  outcomes.push({
    userId: attacker.id,
    moveId,
    targetUserId: defender.id,
    damageDealt: damage,
    effectiveness,
    fainted: target.hp === 0,
  });

  return target.hp === 0;
}

export async function calcMaxHP(pokemonId: number): Promise<number> {
  const stats = await fetchStats(pokemonId);
  // Formula for level 50 pokemon with 31 IV and 0 EV
  return Math.floor((2 * stats.hp + 31) / 2) + 60;
}

export async function resolveTurn(
  room: BattleRoom,
  move1Id: number,
  move2Id: number,
): Promise<MoveOutcome[]> {
  const { player1, player2 } = room;
  const activePokemon1 = player1.pokemon[player1.activeSlot];
  const activePokemon2 = player2.pokemon[player2.activeSlot];

  const [move1, move2, stats1, stats2, types1, types2] = await Promise.all([
    fetchMoveData(move1Id),
    fetchMoveData(move2Id),
    fetchStats(activePokemon1.id),
    fetchStats(activePokemon2.id),
    fetchTypes(activePokemon1.id),
    fetchTypes(activePokemon2.id),
  ]);

  // Turn order: priority bracket first, then speed, then random tiebreak
  const priority1 = move1?.priority ?? 0;
  const priority2 = move2?.priority ?? 0;

  let p1First: boolean;
  if (priority1 !== priority2) {
    p1First = priority1 > priority2;
  } else if (stats1.speed !== stats2.speed) {
    p1First = stats1.speed > stats2.speed;
  } else {
    p1First = Math.random() < 0.5;
  }

  const outcomes: MoveOutcome[] = [];

  if (p1First) {
    if (move1) {
      const fainted = applyMove(
        player1,
        player2,
        move1Id,
        move1,
        stats1,
        stats2,
        types2,
        outcomes,
      );
      if (fainted) {
        return outcomes;
      }
    }
    if (move2)
      applyMove(
        player2,
        player1,
        move2Id,
        move2,
        stats2,
        stats1,
        types1,
        outcomes,
      );
  } else {
    if (move2) {
      const fainted = applyMove(
        player2,
        player1,
        move2Id,
        move2,
        stats2,
        stats1,
        types1,
        outcomes,
      );
      if (fainted) return outcomes;
    }
    if (move1)
      applyMove(
        player1,
        player2,
        move1Id,
        move1,
        stats1,
        stats2,
        types2,
        outcomes,
      );
  }

  return outcomes;
}
