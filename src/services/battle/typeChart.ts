import { apiTypeEfficacy } from '@db/apiSchema';
import { apiDb } from '@db/index';

type TypeChart = Record<number, Record<number, number>>;
const typeChart: TypeChart = {};

export async function initTypeChart(): Promise<void> {
  const rows = await apiDb.select().from(apiTypeEfficacy);
  for (const row of rows) {
    if (row.damageTypeId == null || row.targetTypeId == null) continue;
    if (!typeChart[row.damageTypeId]) typeChart[row.damageTypeId] = {};
    typeChart[row.damageTypeId][row.targetTypeId] = row.damageFactor;
  }
}

export function getTypeMultiplier(
  moveTypeId: number,
  defenderTypeIds: number[],
): number {
  let multiplier = 1;
  for (const defTypeId of defenderTypeIds) {
    multiplier *= (typeChart[moveTypeId]?.[defTypeId] ?? 100) / 100;
  }
  return multiplier;
}
