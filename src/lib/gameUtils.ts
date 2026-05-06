import type { PlayerRole } from '../types'
import { supabase } from './supabase'

export type GamePhase = 'waiting' | 'setup' | 'playing' | 'finished'

/**
 * Resolves the true game phase from the DB for the given room code.
 *
 * Room status 'waiting' is ambiguous: it means "waiting for Player B to join" but
 * historically stayed 'waiting' even after both players moved to setup (if the
 * joinRoom update didn't fire). We disambiguate by checking the player count:
 * if 2 players are already in the room, setup has started.
 *
 * Side effect: clears sessionStorage if the room is abandoned or not found.
 */
export async function resolvePhase(roomCode: string): Promise<{ phase: GamePhase; roomId: string } | null> {
  const { data: room } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('code', roomCode)
    .maybeSingle()

  if (!room || room.status === 'abandoned') {
    sessionStorage.removeItem('player_id')
    sessionStorage.removeItem('room_code')
    sessionStorage.removeItem('player_role')
    return null
  }

  if (room.status !== 'waiting') {
    return { phase: room.status as GamePhase, roomId: room.id }
  }

  // status = 'waiting' — check if both players have joined already
  const { count } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)

  return { phase: (count ?? 0) >= 2 ? 'setup' : 'waiting', roomId: room.id }
}

// Excludes easily-confused characters (I, O, 0, 1) to avoid player mistakes when sharing codes
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

/**
 * Generates a random 4-letter room code (e.g. "XKZT").
 * Used when Player A creates a new game room.
 */
export function generateRoomCode(): string {
  return Array.from(
    { length: 4 },
    () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  ).join('')
}

/**
 * Returns which player role is the "subject" (the one being guessed about) for a given round.
 * Odd rounds → Player A is subject; even rounds → Player B is subject.
 * This alternation is deterministic so both clients agree without coordination.
 */
export function subjectRoleForRound(num: number): PlayerRole {
  return num % 2 === 1 ? 'A' : 'B'
}

/**
 * Maps a round number to an index into the subject's setup answers array.
 * Each player answered 10 questions, and each answer covers 2 rounds (one as subject, one as guesser).
 *   Round 1 → index 0, Round 2 → index 0, Round 3 → index 1, Round 4 → index 1, etc.
 */
export function questionIndexForRound(num: number): number {
  return Math.floor((num - 1) / 2)
}
