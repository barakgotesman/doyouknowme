import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Question } from '../types'

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

  // Player status objects shown in the UI — me and my partner
  const [myStatus, setMyStatus] = useState<PlayerStatus>({ name: '', progress: 0, done: false })
  const [partnerStatus, setPartnerStatus] = useState<PlayerStatus>({ name: '', progress: 0, done: false })

  // Refs instead of state to avoid stale closures in the Realtime broadcast callbacks.
  // If we used useState, the handlers would always see the initial value captured at subscribe time.
  const doneRef = useRef(false)
  const partnerDoneRef = useRef(false)

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

    // Subscribe to the shared game channel to track partner progress and detect when they finish
    const channel = supabase
      .channel(`game:${roomCode}`)
      .on('broadcast', { event: 'progress_update' }, ({ payload }) => {
        // Only react to the OTHER player's progress updates
        if (payload.role !== playerRole) {
          setPartnerStatus(prev => ({ ...prev, progress: payload.count }))
        }
      })
      .on('broadcast', { event: 'setup_complete' }, ({ payload }) => {
        // Only react to the OTHER player's completion event
        if (payload.role !== playerRole) {
          setPartnerStatus(prev => ({ ...prev, progress: 10, done: true }))
          partnerDoneRef.current = true
          maybeAdvanceToGame()
        }
      })
      .subscribe()

    // Unsubscribe when the component unmounts to avoid memory leaks
    return () => { channel.unsubscribe() }
  }, [])

  /**
   * Fetches the 10 random questions and both players' display names in parallel.
   * Players are needed to show the status bar with names.
   */
  async function fetchQuestionsAndPlayers() {
    try {
      // Fetch questions and room (to get room_id for player lookup) in parallel
      const [questionsRes, roomRes] = await Promise.all([
        supabase.from('questions').select('*'),
        supabase.from('rooms').select('id').eq('code', roomCode).single(),
      ])

      if (questionsRes.error) throw questionsRes.error
      if (roomRes.error) throw roomRes.error

      // Shuffle using sort trick, then take first 10
      const shuffled = [...(questionsRes.data ?? [])].sort(() => Math.random() - 0.5).slice(0, 10)
      setQuestions(shuffled)

      // Fetch both players in the room
      const { data: players, error: playersErr } = await supabase
        .from('players')
        .select('id, display_name, role, setup_done')
        .eq('room_id', roomRes.data.id)

      if (playersErr) throw playersErr

      // Split into "me" and "partner" based on the stored role
      const me = players?.find(p => p.id === playerId)
      const partner = players?.find(p => p.id !== playerId)

      if (me) setMyStatus({ name: me.display_name, progress: 0, done: false })
      if (partner) setPartnerStatus({ name: partner.display_name, progress: 0, done: partner.setup_done })
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
      const { error: saveErr } = await supabase
        .from('setup_answers')
        .insert({ player_id: playerId, question_id: question.id, answer })
      if (saveErr) throw saveErr

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
    submitAnswer,
  }
}
