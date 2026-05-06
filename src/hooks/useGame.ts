import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLeaveGame } from './useLeaveGame'
import { subjectRoleForRound, questionIndexForRound } from '../lib/gameUtils'
import type { Player, PlayerRole, Question, PlayerReactPayload } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

/** The phase a round can be in */
export type RoundPhase = 'loading' | 'answering' | 'revealed' | 'finished'

/** One player's setup answer for a question — includes the question data via join */
interface SetupAnswerWithQuestion {
  question_id: string
  answer: string          // the subject player's actual answer (used as correct answer)
  questions: Question     // joined question row
}

export interface GameState {
  loading: boolean
  error: string | null

  // Current round info
  roundNumber: number         // 1–20
  phase: RoundPhase
  subjectRole: PlayerRole     // whose answers are being guessed this round
  isAnswering: boolean        // true if it's MY turn to guess (I am NOT the subject)

  // Question + answers for the current round
  question: Question | null
  correctAnswer: string       // the subject player's actual setup answer
  submittedAnswer: string | null  // what the guesser selected
  isCorrect: boolean | null
  startedAt: string | null    // DB timestamp — used to sync timers across both clients

  // Player info and scores
  myName: string
  partnerName: string
  myRole: PlayerRole
  myScore: number
  partnerScore: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Core game logic hook. Manages 20 rounds of alternating subject/guesser play.
 *
 * Round structure:
 *   - Odd rounds  (1,3,5...): subject = Player A, guesser = Player B
 *   - Even rounds (2,4,6...): subject = Player B, guesser = Player A
 *
 * The subject player for each round is also the "initiator" — they insert the
 * game_round row and broadcast round_start. This is deterministic and avoids
 * race conditions without needing unique DB constraints.
 */
export function useGame() {
  const navigate = useNavigate()
  const { leaveGame } = useLeaveGame()

  // Session values set during lobby
  const playerId   = sessionStorage.getItem('player_id')   ?? ''
  const roomCode   = sessionStorage.getItem('room_code')   ?? ''
  const playerRole = (sessionStorage.getItem('player_role') ?? 'A') as PlayerRole

  // ── State ──────────────────────────────────────────────────────────────────

  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [roundNumber, setRoundNumber] = useState(1)
  const [phase,    setPhase]    = useState<RoundPhase>('loading')
  const [question, setQuestion] = useState<Question | null>(null)
  const [correctAnswer,   setCorrectAnswer]   = useState('')
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null)
  const [isCorrect,       setIsCorrect]       = useState<boolean | null>(null)
  const [startedAt,       setStartedAt]       = useState<string | null>(null)
  const [myScore,      setMyScore]      = useState(0)
  const [partnerScore, setPartnerScore] = useState(0)
  const [myName,      setMyName]      = useState('')

  // ── Reaction state ─────────────────────────────────────────────────────────
  const [myReaction,      setMyReaction]      = useState<string | null>(null)
  const [partnerReaction, setPartnerReaction] = useState<string | null>(null)
  // tracks whether the local player is on cooldown (3 s between reactions)
  const [onCooldown, setOnCooldown] = useState(false)
  // ref to the channel so sendReaction can broadcast without closing over a stale ref
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [partnerName, setPartnerName] = useState('')

  // ── Refs (avoid stale closures in Realtime handlers) ──────────────────────

  const roundNumberRef = useRef(1)
  const phaseRef       = useRef<RoundPhase>('loading')

  // Stable references to game data needed inside callbacks
  const roomIdRef      = useRef('')
  const playerARef     = useRef<Player | null>(null)  // Player A object
  const playerBRef     = useRef<Player | null>(null)  // Player B object

  // Setup answers per player sorted by created_at — the order defines round questions
  // Index 0 = questions for rounds 1&2, index 1 = rounds 3&4, etc.
  const answersARef = useRef<SetupAnswerWithQuestion[]>([]) // Player A's 10 setup answers
  const answersBRef = useRef<SetupAnswerWithQuestion[]>([]) // Player B's 10 setup answers

  // ── Derived values ─────────────────────────────────────────────────────────
  // subjectRoleForRound and questionIndexForRound are imported from gameUtils.ts

  /**
   * Returns the setup answer entry for the given round number.
   * Subject A uses answersARef, Subject B uses answersBRef.
   */
  function getSetupAnswerForRound(num: number): SetupAnswerWithQuestion | null {
    const role  = subjectRoleForRound(num)
    const index = questionIndexForRound(num)
    const arr   = role === 'A' ? answersARef.current : answersBRef.current
    return arr[index] ?? null
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!playerId || !roomCode) {
      navigate('/')
      return
    }

    initGame()

    const channel = supabase
      .channel(`game:${roomCode}`)
      // Partner sent an emoji reaction — show it above their name for 1.5 s
      .on('broadcast', { event: 'player_react' }, ({ payload }: { payload: PlayerReactPayload }) => {
        const isMe = payload.player_role === playerRole
        if (isMe) return // Supabase shouldn't echo back, but guard anyway
        setPartnerReaction(payload.emoji)
        setTimeout(() => setPartnerReaction(null), 1500)
      })
      // Partner started a round — load it on both screens
      .on('broadcast', { event: 'round_start' }, ({ payload }) => {
        handleRoundStart(payload.round_number, payload.started_at)
      })
      // Guesser submitted an answer — reveal result on both screens
      .on('broadcast', { event: 'answer_submitted' }, ({ payload }) => {
        handleAnswerSubmitted(payload.round_number, payload.answer, payload.is_correct)
      })
      // Guesser's timer ran out — treat as a null answer
      .on('broadcast', { event: 'timeout' }, ({ payload }) => {
        handleAnswerSubmitted(payload.round_number, null, false)
      })
      // Partner left the game — clear session and go home
      .on('broadcast', { event: 'game_abandoned' }, () => {
        sessionStorage.removeItem('player_id')
        sessionStorage.removeItem('room_code')
        sessionStorage.removeItem('player_role')
        navigate('/', { replace: true })
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      channelRef.current = null
      channel.unsubscribe()
    }
  }, [])

  /**
   * Loads all game data needed before the first round can start:
   * - Room ID (needed for DB inserts)
   * - Both players (names, roles)
   * - Setup answers with questions (to know correct answers and question text)
   * - Any existing game_rounds (to resume if the player refreshed mid-game)
   */
  async function initGame() {
    try {
      // Fetch room by code to get its UUID and status
      const { data: room, error: roomErr } = await supabase
        .from('rooms').select('id, status').eq('code', roomCode).single()
      if (roomErr || !room) throw roomErr ?? new Error('Room not found')
      roomIdRef.current = room.id

      // If the room is already finished, this player shouldn't be on the game screen —
      // send them home rather than assuming the sessionStorage belongs to their finished game.
      if (room.status === 'finished') {
        navigate('/', { replace: true })
        return
      }

      // Fetch both players in the room
      const { data: players, error: playersErr } = await supabase
        .from('players').select('*').eq('room_id', room.id)
      if (playersErr || !players) throw playersErr ?? new Error('Players not found')

      const me      = players.find(p => p.id === playerId)!
      const partner = players.find(p => p.id !== playerId)!
      playerARef.current = players.find(p => p.role === 'A') ?? null
      playerBRef.current = players.find(p => p.role === 'B') ?? null

      setMyName(me.display_name)
      setPartnerName(partner.display_name)

      // Fetch setup answers for both players, joined with question data
      // Sorted by created_at so the order matches the sequence each player answered
      const { data: allAnswers, error: answersErr } = await supabase
        .from('setup_answers')
        .select('question_id, answer, player_id, questions(*)')
        .in('player_id', [playerARef.current!.id, playerBRef.current!.id])
        .order('created_at', { ascending: true })
      if (answersErr) throw answersErr

      // Split answers by player and cast the joined questions shape
      answersARef.current = (allAnswers ?? [])
        .filter(a => a.player_id === playerARef.current!.id)
        .map(a => ({ question_id: a.question_id, answer: a.answer, questions: a.questions as unknown as Question }))

      answersBRef.current = (allAnswers ?? [])
        .filter(a => a.player_id === playerBRef.current!.id)
        .map(a => ({ question_id: a.question_id, answer: a.answer, questions: a.questions as unknown as Question }))

      // Check for existing rounds (player may have refreshed mid-game)
      const { data: existingRounds } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('room_id', room.id)
        .order('round_number', { ascending: true })

      if (existingRounds && existingRounds.length > 0) {
        // Resume: find the last incomplete round or pick up from completed ones
        await resumeFromExistingRounds(existingRounds)
      } else {
        // Fresh game: update room status to 'playing', then start round 1
        await supabase.from('rooms').update({ status: 'playing' }).eq('id', room.id)
        setLoading(false)
        maybeInitiateRound(1)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת המשחק')
      setLoading(false)
    }
  }

  /**
   * Resumes a game in progress after a page refresh.
   * Finds the current round state and restores the UI accordingly.
   */
  async function resumeFromExistingRounds(rounds: Array<{
    round_number: number
    subject_role: string
    question_id: string
    started_at: string | null
    submitted_answer: string | null
    is_correct: boolean | null
  }>) {
    // Compute scores from completed rounds
    let scoreA = 0
    let scoreB = 0
    for (const r of rounds) {
      if (r.is_correct) {
        // The guesser scores — guesser is the one whose role ≠ subject_role
        if (r.subject_role === 'A') scoreB++ // B was guessing
        else scoreA++                         // A was guessing
      }
    }

    // Update score state based on which role I am
    if (playerRole === 'A') { setMyScore(scoreA); setPartnerScore(scoreB) }
    else                    { setMyScore(scoreB); setPartnerScore(scoreA) }

    // Find the active round — the one without a submitted answer yet
    const activeRound = rounds.find(r => r.submitted_answer === null && r.started_at !== null)
    const lastRound   = rounds[rounds.length - 1]

    setLoading(false)

    if (activeRound) {
      // Re-enter an in-progress round
      handleRoundStart(activeRound.round_number, activeRound.started_at!)
    } else if (lastRound && lastRound.round_number < 20) {
      // Last round was completed — start the next one
      const nextRound = lastRound.round_number + 1
      maybeInitiateRound(nextRound)
    } else if (lastRound && lastRound.round_number === 20) {
      // All rounds done — go to results
      setPhase('finished')
      navigate('/results', { replace: true })
    }
  }

  // ── Round lifecycle ────────────────────────────────────────────────────────

  /**
   * Called by the subject player to insert a new round into the DB and broadcast it.
   * Only the initiator (subject player for this round) calls this.
   * The partner receives the round_start broadcast via Realtime.
   */
  async function initiateRound(num: number) {
    const setupAnswer = getSetupAnswerForRound(num)
    if (!setupAnswer) return

    const started_at = new Date().toISOString()

    // Insert the round into the DB — provides the started_at timestamp both clients will sync to
    const { error: insertErr } = await supabase.from('game_rounds').insert({
      room_id:       roomIdRef.current,
      round_number:  num,
      subject_role:  subjectRoleForRound(num),
      question_id:   setupAnswer.question_id,
      started_at,
    })

    // If insert fails (e.g. duplicate on refresh), still broadcast so we don't get stuck
    if (insertErr) {
      console.warn(`Round ${num} insert failed (may already exist):`, insertErr.message)
    }

    // Broadcast to the partner (Supabase doesn't echo back to sender, so we call the handler directly)
    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'round_start',
      payload: { round_number: num, started_at },
    })

    // Apply the round locally — the partner receives it via the broadcast handler above
    handleRoundStart(num, started_at)
  }

  /**
   * Checks if I am the initiator for the given round, then calls initiateRound.
   * The initiator is the subject player for that round — deterministic and race-condition free.
   */
  function maybeInitiateRound(num: number) {
    if (num > 20) {
      endGame()
      return
    }
    // Only the subject player for this round initiates it
    if (playerRole === subjectRoleForRound(num)) {
      initiateRound(num)
    }
    // The other player just waits for the round_start broadcast
  }

  /**
   * Handles the round_start broadcast. Called on BOTH clients (including the initiator).
   * Sets up the UI for the new round — question, timer, and phase.
   */
  function handleRoundStart(num: number, started: string) {
    // Idempotency: ignore if we already processed this round in a non-loading phase
    if (roundNumberRef.current === num && phaseRef.current !== 'loading') return

    const setupAnswer = getSetupAnswerForRound(num)
    if (!setupAnswer) return

    const subject  = subjectRoleForRound(num)
    const question = setupAnswer.questions

    roundNumberRef.current = num
    phaseRef.current       = 'answering'

    setRoundNumber(num)
    setPhase('answering')
    setQuestion(question)
    setCorrectAnswer(setupAnswer.answer)  // subject player's actual answer
    setSubmittedAnswer(null)
    setIsCorrect(null)
    setStartedAt(started)
    setLoading(false)

    // Log for debugging during development
    console.log(`Round ${num} started | subject: ${subject} | question: "${question.text}"`)
  }

  /**
   * Called by the guesser when they tap an answer.
   * Saves the result to the DB, broadcasts it, and triggers the reveal phase.
   * Only the guesser calls this — the subject player's screen shows a waiting state.
   */
  async function submitAnswer(answer: string) {
    if (phaseRef.current !== 'answering') return // guard: only allow during answering phase

    const correct = answer === correctAnswer
    phaseRef.current = 'revealed'

    // Optimistically update UI before DB write completes
    setSubmittedAnswer(answer)
    setIsCorrect(correct)
    setPhase('revealed')

    // Update score immediately for the guesser
    if (correct) setMyScore(s => s + 1)

    // Persist the round result
    await supabase.from('game_rounds')
      .update({ submitted_answer: answer, is_correct: correct })
      .eq('room_id', roomIdRef.current)
      .eq('round_number', roundNumberRef.current)

    // Broadcast result to the subject player's screen
    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'answer_submitted',
      payload: {
        round_number: roundNumberRef.current,
        answer,
        is_correct: correct,
      },
    })

    scheduleNextRound()
  }

  /**
   * Called by the guesser's Timer component when 20 seconds elapse with no answer.
   * Broadcasts a timeout event and advances the round with no points scored.
   */
  async function handleTimeout() {
    if (phaseRef.current !== 'answering') return // idempotent — ignore if already handled

    phaseRef.current = 'revealed'
    setSubmittedAnswer(null)
    setIsCorrect(false)
    setPhase('revealed')

    // Save null answer to DB
    await supabase.from('game_rounds')
      .update({ submitted_answer: null, is_correct: false })
      .eq('room_id', roomIdRef.current)
      .eq('round_number', roundNumberRef.current)

    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'timeout',
      payload: { round_number: roundNumberRef.current },
    })

    scheduleNextRound()
  }

  /**
   * Handles the answer_submitted / timeout broadcast received on the SUBJECT player's screen.
   * Updates their UI to show what the guesser picked and whether it was correct.
   */
  function handleAnswerSubmitted(num: number, answer: string | null, correct: boolean) {
    // Idempotency: ignore if this round was already revealed
    if (roundNumberRef.current !== num || phaseRef.current === 'revealed') return

    phaseRef.current = 'revealed'
    setSubmittedAnswer(answer)
    setIsCorrect(correct)
    setPhase('revealed')

    // Update partner's score on MY screen (I am the subject, so the guesser = partner)
    if (correct) setPartnerScore(s => s + 1)

    scheduleNextRound()
  }

  /**
   * Waits 3 seconds after a round is revealed, then starts the next round.
   * Only the initiator of the NEXT round actually calls initiateRound — the other player
   * waits for the round_start broadcast.
   */
  function scheduleNextRound() {
    setTimeout(() => {
      const next = roundNumberRef.current + 1
      if (next > 20) {
        endGame()
      } else {
        maybeInitiateRound(next)
      }
    }, 3000)
  }

  /**
   * Ends the game: updates room status to 'finished' and navigates to results.
   * Both clients will reach this independently via scheduleNextRound.
   */
  async function endGame() {
    setPhase('finished')
    await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomIdRef.current)
    navigate('/results', { replace: true })
  }

  // ── Reactions ──────────────────────────────────────────────────────────────

  /**
   * Broadcasts an emoji reaction to the partner and shows it locally.
   * Enforces a 3-second cooldown to prevent spam.
   */
  function sendReaction(emoji: string) {
    if (onCooldown || !channelRef.current) return

    // Show locally (Supabase doesn't echo back to sender)
    setMyReaction(emoji)
    setTimeout(() => setMyReaction(null), 1500)

    // Cooldown: block further reactions for 3 s
    setOnCooldown(true)
    setTimeout(() => setOnCooldown(false), 3000)

    // Broadcast to partner
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_react',
      payload: { emoji, player_role: playerRole } satisfies PlayerReactPayload,
    })
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  // I am answering if I am NOT the subject for this round
  const subjectRole  = subjectRoleForRound(roundNumber)
  const isAnswering  = playerRole !== subjectRole

  return {
    loading,
    error,
    roundNumber,
    phase,
    subjectRole,
    isAnswering,
    question,
    correctAnswer,
    submittedAnswer,
    isCorrect,
    startedAt,
    myName,
    partnerName,
    myRole: playerRole,
    myScore,
    partnerScore,
    submitAnswer,
    handleTimeout,
    leaveGame,
    sendReaction,
    myReaction,
    partnerReaction,
    onCooldown,
  }
}
