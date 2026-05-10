import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLeaveGame } from './useLeaveGame'
import { useReactions } from './useReactions'
import type { Question } from '../types'

/** How long (ms) a partner can be idle before the AFK warning is shown */
const AFK_TIMEOUT_MS = 2 * 60 * 1000

/** Represents one player's display info and setup progress shown in the status bar */
export interface PlayerStatus {
  name: string
  progress: number  // number of questions answered so far (0–10)
  done: boolean
}

/**
 * Manages the setup phase: loading questions, saving answers, tracking both
 * players' progress live via Realtime, and auto-starting the game when both finish.
 */
export function useSetup() {
  const navigate = useNavigate()
  const { leaveGame } = useLeaveGame()

  // Read session from storage — set during lobby phase
  const playerId = sessionStorage.getItem('player_id') ?? ''
  const roomCode = sessionStorage.getItem('room_code') ?? ''
  const playerRole = sessionStorage.getItem('player_role') ?? '' // 'A' or 'B'

  const [questions, setQuestions] = useState<Question[]>([])   // the 10 questions for this player
  const [currentIndex, setCurrentIndex] = useState(0)           // which question is currently shown
  const [loading, setLoading] = useState(true)                  // true while fetching questions + players
  const [saving, setSaving] = useState(false)                   // true while an answer is being saved to DB
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)                       // true after this player finishes all 10
  const [partnerAfk, setPartnerAfk] = useState(false)           // true after partner is idle for AFK_TIMEOUT_MS

  // Player status objects shown in the UI — me and my partner
  const [myStatus, setMyStatus] = useState<PlayerStatus>({ name: '', progress: 0, done: false })
  const [partnerStatus, setPartnerStatus] = useState<PlayerStatus>({ name: '', progress: 0, done: false })

  // Refs instead of state to avoid stale closures in the Realtime broadcast callbacks.
  // If we used useState, the handlers would always see the initial value captured at subscribe time.
  const doneRef = useRef(false)
  const partnerDoneRef = useRef(false)

  // Shared reaction logic — broadcasts emojis to partner, tracks cooldown
  const { myReaction, partnerReaction, onCooldown, sendReaction, handleIncomingReaction, channelRef } = useReactions(playerRole)

  // Tracks when we last heard from the partner — used for AFK detection
  const partnerLastSeenRef = useRef<number>(Date.now())
  const afkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Navigates to the game screen only when BOTH players have finished setup.
   * Called after this player finishes AND when the partner's broadcast is received.
   */
  function maybeAdvanceToGame() {
    if (doneRef.current && partnerDoneRef.current) {
      navigate('/game', { replace: true })
    }
  }

  useEffect(() => {
    // Guard: if session is missing, kick back to lobby
    if (!playerId || !roomCode) {
      navigate('/')
      return
    }

    fetchQuestionsAndPlayers()

    // Start AFK watchdog — fires after AFK_TIMEOUT_MS with no partner activity
    function resetAfkTimer() {
      partnerLastSeenRef.current = Date.now()
      setPartnerAfk(false)
      if (afkTimerRef.current) clearTimeout(afkTimerRef.current)
      afkTimerRef.current = setTimeout(() => setPartnerAfk(true), AFK_TIMEOUT_MS)
    }
    resetAfkTimer()

    // Subscribe to the shared game channel to track partner progress and detect when they finish
    const channel = supabase
      .channel(`game:${roomCode}`)
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload.role !== playerRole) handleIncomingReaction(payload.emoji)
      })
      .on('broadcast', { event: 'progress_update' }, ({ payload }) => {
        // Only react to the OTHER player's progress updates
        if (payload.role !== playerRole) {
          setPartnerStatus(prev => ({ ...prev, progress: payload.count }))
          resetAfkTimer() // partner is active — reset AFK countdown
        }
      })
      .on('broadcast', { event: 'setup_complete' }, ({ payload }) => {
        // Only react to the OTHER player's completion event; guard against duplicates
        if (payload.role !== playerRole && !partnerDoneRef.current) {
          setPartnerStatus(prev => ({ ...prev, progress: 10, done: true }))
          partnerDoneRef.current = true
          resetAfkTimer()
          maybeAdvanceToGame()
        }
      })
      .on('broadcast', { event: 'game_abandoned' }, () => {
        // Partner left the game — clear session and go home
        sessionStorage.removeItem('player_id')
        sessionStorage.removeItem('room_code')
        sessionStorage.removeItem('player_role')
        navigate('/', { replace: true })
      })
      .subscribe()

    // Give useReactions access to the channel for outgoing broadcasts
    channelRef.current = channel

    // Unsubscribe and clear AFK timer when the component unmounts
    return () => {
      channel.unsubscribe()
      channelRef.current = null
      if (afkTimerRef.current) clearTimeout(afkTimerRef.current)
    }
  }, [])

  /**
   * Fetches the 10 random questions and both players' display names in parallel.
   * Also restores this player's progress from existing setup_answers in the DB
   * so a page refresh doesn't restart the questionnaire from zero.
   */
  async function fetchQuestionsAndPlayers() {
    try {
      // Fetch questions and room in parallel — room_id, category_ids, and questions_count needed
      const [questionsRes, roomRes] = await Promise.all([
        supabase.from('questions').select('*'),
        supabase.from('rooms')
          .select('id, category_ids, questions_count')
          .eq('code', roomCode)
          .single(),
      ])

      if (questionsRes.error) throw questionsRes.error
      if (roomRes.error) throw roomRes.error

      const roomId        = roomRes.data.id
      const categoryIds   = roomRes.data.category_ids as string[] | null
      // How many questions the host requested — may be capped below if the pool is smaller
      const requestedCount = roomRes.data.questions_count ?? 10

      // Fetch players and this player's saved answers in parallel
      const [playersRes, savedAnswersRes] = await Promise.all([
        supabase.from('players').select('id, display_name, role, setup_done').eq('room_id', roomId),
        supabase.from('setup_answers').select('question_id').eq('player_id', playerId),
      ])

      if (playersRes.error) throw playersRes.error

      const players = playersRes.data ?? []
      const me      = players.find(p => p.id === playerId)
      const partner = players.find(p => p.id !== playerId)

      // Build a set of question IDs already answered so we can skip them on resume
      const answeredIds = new Set((savedAnswersRes.data ?? []).map(a => a.question_id))
      const alreadyAnswered = answeredIds.size

      // Shuffle all questions with a stable seed-independent sort, then take questionsCount.
      // If category_ids is set, restrict to those categories first.
      // On resume, filter out already-answered questions so the player continues where they left off.
      const rawQuestions = questionsRes.data ?? []

      // Apply category filter when the host restricted categories in the room settings
      const allQuestions = categoryIds
        ? rawQuestions.filter(q => categoryIds.includes(q.category_id ?? ''))
        : rawQuestions

      // Cap to however many questions are actually available — prevents an infinite setup loop
      // when the selected category has fewer questions than the host requested.
      const questionsCount = Math.min(requestedCount, allQuestions.length)

      let shuffled: typeof allQuestions

      if (alreadyAnswered > 0) {
        // Restore: put answered questions first (in answered order isn't known, but we just need
        // the remaining ones in the same relative order — a deterministic shuffle here isn't
        // required because we'll jump currentIndex past the answered ones)
        const unanswered = allQuestions.filter(q => !answeredIds.has(q.id))
        const answered   = allQuestions.filter(q => answeredIds.has(q.id))
        shuffled = [...answered, ...unanswered.sort(() => Math.random() - 0.5)].slice(0, questionsCount)
      } else {
        shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, questionsCount)
      }

      setQuestions(shuffled)

      // Restore progress index — jump past already-answered questions
      if (alreadyAnswered > 0 && alreadyAnswered < questionsCount) {
        setCurrentIndex(alreadyAnswered)
      }

      if (me) {
        const myDone = me.setup_done || alreadyAnswered >= questionsCount
        setMyStatus({ name: me.display_name, progress: alreadyAnswered, done: myDone })
        if (myDone) {
          doneRef.current = true
          setDone(true)
        }
      }

      if (partner) {
        setPartnerStatus({ name: partner.display_name, progress: 0, done: partner.setup_done })
        if (partner.setup_done) {
          // Partner already finished before we refreshed — mark them done immediately
          partnerDoneRef.current = true
        }
      }

      // If both were already done when we refreshed, go straight to the game
      if (doneRef.current && partnerDoneRef.current) {
        navigate('/game', { replace: true })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Saves the player's answer for the current question to the DB,
   * broadcasts progress to the partner, then advances to the next question
   * or finishes setup if this was the last one.
   */
  async function submitAnswer(answer: string) {
    const question = questions[currentIndex]
    if (!question || saving) return // guard against double-tap

    setSaving(true)
    try {
      // Check if this answer was already saved (e.g. player refreshed mid-setup and is re-submitting)
      const { data: existing } = await supabase
        .from('setup_answers')
        .select('id')
        .eq('player_id', playerId)
        .eq('question_id', question.id)
        .maybeSingle()

      if (!existing) {
        const { error: saveErr } = await supabase
          .from('setup_answers')
          .insert({ player_id: playerId, question_id: question.id, answer })
        if (saveErr) throw saveErr
      }

      const newCount = currentIndex + 1 // number of questions answered after this one
      const isLast = newCount === questions.length

      // Update our own progress in the UI
      setMyStatus(prev => ({ ...prev, progress: newCount }))

      // Broadcast our progress so the partner's screen updates live
      await supabase.channel(`game:${roomCode}`).send({
        type: 'broadcast',
        event: 'progress_update',
        payload: { role: playerRole, count: newCount },
      })

      if (isLast) {
        await finishSetup()
      } else {
        setCurrentIndex(newCount)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת תשובה')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Called after the last answer is saved.
   * - Marks this player as done in the DB
   * - Broadcasts 'setup_complete' so the partner knows
   * - Checks if the partner already finished — if so, navigates immediately
   */
  async function finishSetup() {
    const { error: updateErr } = await supabase
      .from('players')
      .update({ setup_done: true })
      .eq('id', playerId)
    if (updateErr) throw updateErr

    // Broadcast to partner — they're listening in their own useSetup instance
    await supabase.channel(`game:${roomCode}`).send({
      type: 'broadcast',
      event: 'setup_complete',
      payload: { role: playerRole },
    })

    // Update ref first so maybeAdvanceToGame sees the correct value
    doneRef.current = true
    setMyStatus(prev => ({ ...prev, done: true }))
    setDone(true)
    maybeAdvanceToGame()
  }

  return {
    questions,
    currentIndex,
    loading,
    saving,
    error,
    done,
    myStatus,
    partnerStatus,
    partnerAfk,
    submitAnswer,
    leaveGame,
    sendReaction,
    myReaction,
    partnerReaction,
    onCooldown,
  }
}
