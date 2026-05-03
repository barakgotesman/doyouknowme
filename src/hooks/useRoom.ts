import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { generateRoomCode } from '../lib/gameUtils'

export function useRoom() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waitingCode, setWaitingCode] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  async function createRoom(name: string) {
    setLoading(true)
    setError(null)
    try {
      let code = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        code = generateRoomCode()
        const { data: existing } = await supabase
          .from('rooms').select('id').eq('code', code).maybeSingle()
        if (!existing) break
      }

      const { data: room, error: roomErr } = await supabase
        .from('rooms').insert({ code, status: 'waiting' }).select().single()
      if (roomErr || !room) throw roomErr ?? new Error('Failed to create room')

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: room.id, display_name: name.trim(), role: 'A', setup_done: false })
        .select().single()
      if (playerErr || !player) throw playerErr ?? new Error('Failed to create player')

      sessionStorage.setItem('player_id', player.id)
      sessionStorage.setItem('room_code', code)
      sessionStorage.setItem('player_role', 'A')

      channelRef.current = supabase
        .channel(`game:${code}`)
        .on('broadcast', { event: 'player_joined' }, () => {
          channelRef.current?.unsubscribe()
          navigate('/setup')
        })
        .subscribe()

      setWaitingCode(code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המשחק')
    } finally {
      setLoading(false)
    }
  }

  async function joinRoom(name: string, code: string) {
    setLoading(true)
    setError(null)
    try {
      const { data: room, error: roomErr } = await supabase
        .from('rooms').select('*').eq('code', code).eq('status', 'waiting').maybeSingle()
      if (roomErr) throw roomErr
      if (!room) throw new Error('קוד חדר לא נמצא או שהמשחק כבר התחיל')

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: room.id, display_name: name.trim() || 'אורח', role: 'B', setup_done: false })
        .select().single()
      if (playerErr || !player) throw playerErr ?? new Error('Failed to join room')

      await supabase.channel(`game:${code}`).send({
        type: 'broadcast',
        event: 'player_joined',
        payload: { player_b_name: player.display_name },
      })

      sessionStorage.setItem('player_id', player.id)
      sessionStorage.setItem('room_code', code)
      sessionStorage.setItem('player_role', 'B')
      navigate('/setup')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהצטרפות למשחק')
    } finally {
      setLoading(false)
    }
  }

  function cancelWaiting() {
    channelRef.current?.unsubscribe()
    channelRef.current = null
    setWaitingCode(null)
  }

  return { loading, error, waitingCode, createRoom, joinRoom, cancelWaiting }
}
