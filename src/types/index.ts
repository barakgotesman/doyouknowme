export type PlayerRole = 'A' | 'B'
export type RoomStatus = 'waiting' | 'setup' | 'playing' | 'finished'

export interface Room {
  id: string
  code: string
  status: RoomStatus
  player_a_id: string | null
  player_b_id: string | null
  created_at: string
  /** Timer enabled/disabled — when false, no countdown is shown and rounds never auto-expire */
  timer_enabled: boolean
  /** Seconds per round when timer is enabled (10 / 15 / 20 / 30) */
  timer_seconds: number
  /** Category UUIDs to include; null = all categories */
  category_ids: string[] | null
  /** Number of questions each player answers in setup (5 or 10), determines total rounds */
  questions_count: number
}

/** Subset of Room columns written when creating a room */
export interface RoomOptions {
  timer_enabled: boolean
  timer_seconds: number
  category_ids: string[] | null
  questions_count: number
}

export interface Player {
  id: string
  room_id: string
  display_name: string
  role: PlayerRole
  setup_done: boolean
  created_at: string
  /** auth.users id — set when the player has a Supabase auth session (anonymous or Google) */
  auth_id: string | null
}

/** One row per auth.users entry — tracks admin status. Created automatically via DB trigger. */
export interface Profile {
  id: string
  is_admin: boolean
}

export interface Category {
  id: string
  name: string
}

export interface Question {
  id: string
  text: string
  options: string[]
  category_id: string | null
  created_at: string
}

export interface SetupAnswer {
  id: string
  player_id: string
  question_id: string
  answer: string
}

/** Payload for the player_react broadcast event */
export interface PlayerReactPayload {
  emoji: string
  player_role: PlayerRole
}

export interface GameRound {
  id: string
  room_id: string
  round_number: number
  subject_role: PlayerRole
  question_id: string
  started_at: string | null
  submitted_answer: string | null
  is_correct: boolean | null
}
