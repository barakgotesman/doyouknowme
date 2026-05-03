export type PlayerRole = 'A' | 'B'
export type RoomStatus = 'waiting' | 'setup' | 'playing' | 'finished'

export interface Room {
  id: string
  code: string
  status: RoomStatus
  player_a_id: string | null
  player_b_id: string | null
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  display_name: string
  role: PlayerRole
  setup_done: boolean
  created_at: string
}

export interface Question {
  id: string
  text: string
  options: string[]
  category: string
  created_at: string
}

export interface SetupAnswer {
  id: string
  player_id: string
  question_id: string
  answer: string
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
