import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Question } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

/** One row in the breakdown list shown at the bottom of the results screen */
export interface RoundResult {
  id: string
  roundNumber: number
  questionText: string
  subjectName: string       // who was being asked about
  guesserName: string       // who was guessing
  correctAnswer: string     // the subject's actual setup answer
  submittedAnswer: string | null // what the guesser picked (null = timeout)
  isCorrect: boolean
}

export interface ResultsState {
  loading: boolean
  error: string | null
  myName: string
  partnerName: string
  myScore: number
  partnerScore: number
  rounds: RoundResult[]
}

/**
 * State of the play-again negotiation between the two players.
 * - idle      → neither player has requested yet
 * - waiting   → I clicked "play again", waiting for partner to respond
 * - requested → partner clicked, I need to confirm or decline
 * - declined  → partner declined my request (or I declined theirs)
 */
export type PlayAgainStatus = 'idle' | 'waiting' | 'requested' | 'declined'

// ─── Score label helper ───────────────────────────────────────────────────────

/** Maps a combined score (0–20) to a label and emoji per the spec */
export function scoreLabel(combined: number): string {
  if (combined >= 18) return 'Soulmates 💞'
  if (combined >= 14) return 'Great Friends 🎉'
  if (combined >= 10) return 'Pretty Close 😊'
  if (combined >= 6)  return 'Getting There 🤔'
  return 'Total Strangers 😅'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all results data and manages the play-again negotiation flow.
 * Play-again requires both players to agree before resetting the game.
 */
export function useResults() {
  const navigate = useNavigate()

  const playerId  = sessionStorage.getItem('player_id')   ?? ''
  const roomCode  = sessionStorage.getItem('room_code')   ?? ''
  const playerRole = sessionStorage.getItem('player_role') ?? 'A'

  const [state, setState] = useState<ResultsState>({
    loading: true,
    error: null,
    myName: '',
    partnerName: '',
    myScore: 0,
    partnerScore: 0,
    rounds: [],
  })

  const [playAgainStatus, setPlayAgainStatus] = useState<PlayAgainStatus>('idle')

  // Ref to avoid stale closure in the Realtime callback
  const playAgainStatusRef = useRef<PlayAgainStatus>('idle')

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!playerId || !roomCode) {
      navigate('/', { replace: true })
      return
    }

    fetchResults()

    // Subscribe to play-again negotiation events on the shared game channel
    const channel = supabase
      .channel(`game:${roomCode}`)
      .on('broadcast', { event: 'play_again_request' }, () => {
        // Only react if I haven't already requested (avoid echo confusion)
        if (playAgainStatusRef.current === 'idle') {
          playAgainStatusRef.current = 'requested'
          setPlayAgainStatus('requested')
        }
      })
      .on('broadcast', { event: 'play_again_confirm' }, () => {
        // Partner confirmed — execute the reset and navigate
        executeReset()
      })
      .on('broadcast', { event: 'play_again_decline' }, () => {
        playAgainStatusRef.current = 'declined'
        setPlayAgainStatus('declined')
      })
      .on('broadcast', { event: 'play_again_cancel' }, () => {
        // Requester cancelled their own request — revert to idle
        playAgainStatusRef.current = 'idle'
        setPlayAgainStatus('idle')
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])

  // ── Data fetching ──────────────────────────────────────────────────────────

  /** Loads all results data in one pass */
  async function fetchResults() {
    try {
      const { data: room, error: roomErr } = await supabase
        .from('rooms').select('id').eq('code', roomCode).single()
      if (roomErr || !room) throw roomErr ?? new Error('Room not found')

      const { data: players, error: playersErr } = await supabase
        .from('players').select('id, display_name, role').eq('room_id', room.id)
      if (playersErr || !players) throw playersErr ?? new Error('Players not found')

      const me      = players.find(p => p.id === playerId)!
      const partner = players.find(p => p.id !== playerId)!
      const playerA = players.find(p => p.role === 'A')!
      const playerB = players.find(p => p.role === 'B')!

      const { data: rawRounds, error: roundsErr } = await supabase
        .from('game_rounds')
        .select('id, round_number, subject_role, question_id, submitted_answer, is_correct, questions(*)')
        .eq('room_id', room.id)
        .order('round_number', { ascending: true })
      if (roundsErr) throw roundsErr

      // Deduplicate by round_number defensively
      const seen = new Set<number>()
      const rounds = (rawRounds ?? []).filter(r => {
        if (seen.has(r.round_number)) return false
        seen.add(r.round_number)
        return true
      })

      const { data: setupAnswers, error: answersErr } = await supabase
        .from('setup_answers')
        .select('player_id, question_id, answer')
        .in('player_id', [playerA.id, playerB.id])
      if (answersErr) throw answersErr

      const answerMap = new Map<string, string>()
      for (const sa of setupAnswers ?? []) {
        answerMap.set(`${sa.player_id}:${sa.question_id}`, sa.answer)
      }

      let myScore = 0
      let partnerScore = 0

      const roundResults: RoundResult[] = rounds.map(r => {
        const question      = r.questions as unknown as Question
        const subjectPlayer = r.subject_role === 'A' ? playerA : playerB
        const guesserPlayer = r.subject_role === 'A' ? playerB : playerA
        const correctAnswer = answerMap.get(`${subjectPlayer.id}:${r.question_id}`) ?? '—'

        if (r.is_correct) {
          if (guesserPlayer.id === playerId) myScore++
          else partnerScore++
        }

        return {
          id:              r.id,
          roundNumber:     r.round_number,
          questionText:    question?.text ?? '',
          subjectName:     subjectPlayer.display_name,
          guesserName:     guesserPlayer.display_name,
          correctAnswer,
          submittedAnswer: r.submitted_answer,
          isCorrect:       r.is_correct ?? false,
        }
      })

      setState({
        loading: false,
        error: null,
        myName:      me?.display_name ?? '',
        partnerName: partner?.display_name ?? '',
        myScore,
        partnerScore,
        rounds: roundResults,
      })
    } catch (err: unknown) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'שגיאה בטעינת תוצאות',
      }))
    }
  }

  // ── Play-again actions ─────────────────────────────────────────────────────

  /**
   * Resets the room for a fresh game: deletes rounds + setup answers,
   * resets player setup_done flags, and navigates both players to /setup.
   * Called by the confirmer; the requester receives play_again_confirm broadcast.
   */
  async function executeReset() {
    try {
      const { data: room } = await supabase
        .from('rooms').select('id').eq('code', roomCode).single()
      if (!room) return

      const { data: players } = await supabase
        .from('players').select('id').eq('room_id', room.id)
      const playerIds = (players ?? []).map(p => p.id)

      await Promise.all([
        supabase.from('game_rounds').delete().eq('room_id', room.id),
        supabase.from('setup_answers').delete().in('player_id', playerIds),
        supabase.from('players').update({ setup_done: false }).eq('room_id', room.id),
        supabase.from('rooms').update({ status: 'setup' }).eq('id', room.id),
      ])
    } catch {
      // Best-effort reset — navigate regardless
    }
    navigate('/setup', { replace: true })
  }

  /** I click "שחק שוב" — broadcast the request and wait for partner response */
  async function requestPlayAgain() {
    playAgainStatusRef.current = 'waiting'
    setPlayAgainStatus('waiting')
    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'play_again_request',
      payload: {},
    })
  }

  /** I cancel my own play-again request — notify partner so their UI reverts */
  async function cancelPlayAgain() {
    playAgainStatusRef.current = 'idle'
    setPlayAgainStatus('idle')
    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'play_again_cancel',
      payload: {},
    })
  }

  /**
   * I confirm partner's play-again request.
   * I execute the DB reset and navigate; the requester receives the confirm broadcast and does the same.
   */
  async function confirmPlayAgain() {
    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'play_again_confirm',
      payload: {},
    })
    executeReset()
  }

  /** I decline partner's play-again request */
  async function declinePlayAgain() {
    playAgainStatusRef.current = 'declined'
    setPlayAgainStatus('declined')
    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'play_again_decline',
      payload: {},
    })
  }

  /** Clears session and returns to the home screen */
  function newGame() {
    sessionStorage.clear()
    navigate('/', { replace: true })
  }

  return {
    ...state,
    playAgainStatus,
    requestPlayAgain,
    cancelPlayAgain,
    confirmPlayAgain,
    declinePlayAgain,
    newGame,
    playerRole,
  }
}
