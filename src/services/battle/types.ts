import type { WSContext } from 'hono/ws';

export interface BattlingPokemon {
  id: number;
  moves: number[];
  hp: number;
}

export interface BattlingPlayer {
  id: number;
  roomId?: string;
  pokemon: BattlingPokemon[];
  wsContext: WSContext;
  activeSlot: number;
}

export interface BattleRoom {
  id: string;
  player1: BattlingPlayer;
  player2: BattlingPlayer;
  pendingMoves: {
    player1?: number;
    player2?: number;
  };
}
