import { db } from '@db/index';
import { teamPokemon } from '@db/schema';
import { calcMaxHP, resolveTurn } from '@services/battleEngine';
import type { BattleSideState, ServerMessage } from '@services/battleMessages';
import type { BattleRoom, BattlingPlayer } from '@services/battleTypes';
import { logger } from '@util/logger';
import { eq } from 'drizzle-orm';
import type { WSContext } from 'hono/ws';

const battlingPlayers: Map<number, BattlingPlayer> = new Map();
const rooms: Map<string, BattleRoom> = new Map();
let waitingPlayer: BattlingPlayer | null = null;

function send(player: BattlingPlayer, message: ServerMessage) {
  player.wsContext.send(JSON.stringify(message));
}

export async function joinQueue(
  userId: number,
  teamId: number,
  wsContext: WSContext,
) {
  if (waitingPlayer?.id === userId)
    return wsContext.send(
      JSON.stringify({
        type: 'error',
        message: 'You are already in the queue',
      }),
    );
  if (battlingPlayers.has(userId))
    return wsContext.send(
      JSON.stringify({ type: 'error', message: 'You are already in a battle' }),
    );

  let dbPokemon: {
    id: number;
    teamId: number;
    pokemonId: number;
    moveOneId: number | null;
    moveTwoId: number | null;
    moveThreeId: number | null;
    moveFourId: number | null;
  }[];
  try {
    dbPokemon = await db
      .select()
      .from(teamPokemon)
      .where(eq(teamPokemon.teamId, teamId));
  } catch (error) {
    logger.error('Error fetching user:', error);
    return wsContext.send(
      JSON.stringify({ type: 'error', message: 'Internal server error' }),
    );
  }

  const player: BattlingPlayer = {
    id: userId,
    pokemon: await Promise.all(
      dbPokemon.map(async (p) => ({
        id: p.pokemonId,
        moves: [p.moveOneId, p.moveTwoId, p.moveThreeId, p.moveFourId].filter(
          Boolean,
        ) as number[],
        hp: await calcMaxHP(p.pokemonId),
      })),
    ),
    wsContext,
    activeSlot: 0,
  };

  if (waitingPlayer) {
    const player1 = waitingPlayer;
    const player2 = player;

    const roomId = `room_${Date.now()}`;
    const room: BattleRoom = {
      id: roomId,
      player1,
      player2,
      pendingMoves: {},
    };
    rooms.set(roomId, room);
    player1.roomId = roomId;
    player2.roomId = roomId;
    battlingPlayers.set(player1.id, player1);
    battlingPlayers.set(player2.id, player2);

    waitingPlayer = null;

    const player1State: BattleSideState = {
      userId: player1.id,
      pokemon: player1.pokemon.map((p) => ({
        pokemonId: p.id,
        hp: p.hp,
        moves: p.moves,
      })),
      activeSlot: player1.activeSlot,
    };
    const player2State: BattleSideState = {
      userId: player2.id,
      pokemon: player2.pokemon.map((p) => ({
        pokemonId: p.id,
        hp: p.hp,
        moves: p.moves,
      })),
      activeSlot: player2.activeSlot,
    };

    send(player1, {
      type: 'battle_start',
      you: player1State,
      opponent: player2State,
    });
    send(player2, {
      type: 'battle_start',
      you: player2State,
      opponent: player1State,
    });
  } else {
    waitingPlayer = player;
    send(player, { type: 'waiting' });
  }
}

export async function disconnect(userId: number) {
  if (waitingPlayer?.id === userId) {
    waitingPlayer = null;
  } else {
    const roomId = battlingPlayers.get(userId)?.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const opponent = room.player1.id === userId ? room.player2 : room.player1;
    send(opponent, { type: 'battle_end', winner: 'you', reason: 'disconnect' });
    rooms.delete(room.id);
    battlingPlayers.delete(userId);
    battlingPlayers.delete(opponent.id);
  }
}

export async function forfeit(userId: number) {
  const roomId = battlingPlayers.get(userId)?.roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.player1.id === userId ? room.player1 : room.player2;
  const opponent = room.player1.id === userId ? room.player2 : room.player1;
  send(player, { type: 'battle_end', winner: 'opponent', reason: 'forfeit' });
  send(opponent, { type: 'battle_end', winner: 'you', reason: 'forfeit' });
  rooms.delete(room.id);
  battlingPlayers.delete(userId);
  battlingPlayers.delete(opponent.id);
}

export async function submitMove(userId: number, moveId: number) {
  const roomId = battlingPlayers.get(userId)?.roomId;
  const room = roomId ? rooms.get(roomId) : undefined;
  if (!room) return;

  const isPlayer1 = room.player1.id === userId;

  if (isPlayer1 && room.pendingMoves.player1) return;
  if (!isPlayer1 && room.pendingMoves.player2) return;

  const player = isPlayer1 ? room.player1 : room.player2;
  const move = player.pokemon[player.activeSlot].moves.find(
    (m) => m === moveId,
  );
  if (!move) return send(player, { type: 'error', message: 'Invalid move' });

  if (isPlayer1) {
    room.pendingMoves.player1 = moveId;
  } else {
    room.pendingMoves.player2 = moveId;
  }

  if (room.pendingMoves.player1 && room.pendingMoves.player2) {
    const move1Id = room.pendingMoves.player1;
    const move2Id = room.pendingMoves.player2;
    room.pendingMoves = {};

    const outcomes = await resolveTurn(room, move1Id, move2Id);

    const advanceSlot = (p: BattlingPlayer) => {
      while (
        p.activeSlot < p.pokemon.length &&
        p.pokemon[p.activeSlot].hp === 0
      ) {
        p.activeSlot++;
      }
    };

    advanceSlot(room.player1);
    advanceSlot(room.player2);

    const toSideState = (p: BattlingPlayer): BattleSideState => ({
      userId: p.id,
      pokemon: p.pokemon.map((pk) => ({
        pokemonId: pk.id,
        hp: pk.hp,
        moves: pk.moves,
      })),
      activeSlot: p.activeSlot,
    });

    const allFainted = (p: BattlingPlayer) =>
      p.pokemon.every((pk) => pk.hp === 0);

    if (allFainted(room.player2)) {
      send(room.player1, {
        type: 'battle_end',
        winner: 'you',
        reason: 'knockout',
      });
      send(room.player2, {
        type: 'battle_end',
        winner: 'opponent',
        reason: 'knockout',
      });
      rooms.delete(room.id);
      battlingPlayers.delete(room.player1.id);
      battlingPlayers.delete(room.player2.id);
    } else if (allFainted(room.player1)) {
      send(room.player1, {
        type: 'battle_end',
        winner: 'opponent',
        reason: 'knockout',
      });
      send(room.player2, {
        type: 'battle_end',
        winner: 'you',
        reason: 'knockout',
      });
      rooms.delete(room.id);
      battlingPlayers.delete(room.player1.id);
      battlingPlayers.delete(room.player2.id);
    } else {
      send(room.player1, {
        type: 'turn_result',
        outcomes,
        you: toSideState(room.player1),
        opponent: toSideState(room.player2),
      });
      send(room.player2, {
        type: 'turn_result',
        outcomes,
        you: toSideState(room.player2),
        opponent: toSideState(room.player1),
      });
    }
  }
}
