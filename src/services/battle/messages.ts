// Client -> Server
import { z } from 'zod';

export type ClientMessage =
  | { type: 'join_queue'; teamId: number }
  | { type: 'select_move'; moveId: number }
  | { type: 'forfeit' };

export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join_queue'),
    teamId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('select_move'),
    moveId: z.number().int().positive(),
  }),
  z.object({ type: z.literal('forfeit') }),
]);

// Server -> Client
export interface BattlePokemonState {
  pokemonId: number;
  hp: number;
  moves: number[];
}

export interface BattleSideState {
  userId: number;
  pokemon: BattlePokemonState[];
  activeSlot: number;
}

export interface MoveOutcome {
  userId: number;
  moveId: number;
  targetUserId: number;
  damageDealt: number;
  effectiveness: number;
  fainted: boolean;
  attackingPokemonId: number;
  defendingPokemonId: number;
}

export type ServerMessage =
  | { type: 'waiting' }
  | { type: 'battle_start'; you: BattleSideState; opponent: BattleSideState }
  | {
      type: 'turn_result';
      outcomes: MoveOutcome[];
      you: BattleSideState;
      opponent: BattleSideState;
    }
  | {
      type: 'battle_end';
      winner: 'you' | 'opponent';
      reason: 'knockout' | 'forfeit' | 'disconnect';
    }
  | { type: 'error'; message: string };
