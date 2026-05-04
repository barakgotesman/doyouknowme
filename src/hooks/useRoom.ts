import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { generateRoomCode } from '../lib/gameUtils'

/**
 * Manages room creation and joining logic for the Lobby screen.
 * Handles Supabase DB writes, sessionStorage persistence, and Realtime signaling.
 */
export function useRoom() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When non-null, Player A is waiting for Player B — shows the waiting UI with this code
  const [waitingCode, setWaitingCode] = useState<string | null>(null)

  // Holds the active Realtime channel while Player A waits, so we can unsubscribe on cancel
  const channelRef = useRef<RealtimeChannel | null>(null)

  /**
   * Creates a new room as Player A.
   * - Inserts a room row with a unique 4-letter code
   * - Inserts a player row with role 'A'
   * - Saves session to sessionStorage
   * - Subscribes to Realtime and navigates to /setup when Player B joins
   */
  async function createRoom(name: string) {
    setLoading(true)
    setError(null)
    try {
      // Retry up to 5 times in case of a code collision (rare but possible)
      let code = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        code = generateRoomCode()
        const { data: existing } = await supabase
          .from('rooms').select('id').eq('code', code).maybeSingle()
        if (!existing) break // unique code found
      }

      const { data: room, error: roomErr } = await supabase
        .from('rooms').insert({ code, status: 'waiting' }).select().single()
      if (roomErr || !room) throw roomErr ?? new Error('Failed to create room')

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: room.id, display_name: name.trim(), role: 'A', setup_done: false })
        .select().single()
      if (playerErr || !player) throw playerErr ?? new Error('Failed to create player')

      // Persist session so the player can recover from a page refresh
      sessionStorage.setItem('player_id', player.id)
      sessionStorage.setItem('room_code', code)
      sessionStorage.setItem('player_role', 'A')

      // Listen for Player B joining via Realtime broadcast
      channelRef.current = supabase
        .channel(`game:${code}`)
        .on('broadcast', { event: 'player_joined' }, () => {
          channelRef.current?.unsubscribe()
          navigate('/setup', { replace: true })
        })
        .subscribe()

      setWaitingCode(code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המשחק')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Joins an existing room as Player B.
   * - Validates the room code exists and is still in 'waiting' status
   * - Inserts a player row with role 'B'
   * - Broadcasts 'player_joined' to notify Player A
   * - Saves session to sessionStorage and navigates to /setup
   */
  async function joinRoom(name: string, code: string) {
    setLoading(true)
    setError(null)
    try {
      // Only allow joining rooms that haven't started yet
      const { data: room, error: roomErr } = await supabase
        .from('rooms').select('*').eq('code', code).eq('status', 'waiting').maybeSingle()
      if (roomErr) throw roomErr
      if (!room) throw new Error('קוד חדר לא נמצא או שהמשחק כבר התחיל')

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: room.id, display_name: name.trim() || 'אורח', role: 'B', setup_done: false })
        .select().single()
      if (playerErr || !player) throw playerErr ?? new Error('Failed to join room')

      // Signal Player A that someone joined — triggers their navigation to /setup
      await supabase.channel(`game:${code}`).send({
        type: 'broadcast',
        event: 'player_joined',
        payload: { player_b_name: player.display_name },
      })

      sessionStorage.setItem('player_id', player.id)
      sessionStorage.setItem('room_code', code)
      sessionStorage.setItem('player_role', 'B')
      navigate('/setup', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהצטרפות למשחק')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Cancels the waiting state for Player A.
   * Unsubscribes from Realtime and returns to the main lobby form.
   */
  function cancelWaiting() {
    channelRef.current?.unsubscribe()
    channelRef.current = null
    setWaitingCode(null)
  }

  return { loading, error, waitingCode, createRoom, joinRoom, cancelWaiting }
}
