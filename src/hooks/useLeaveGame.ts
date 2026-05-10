import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Shared leave-game logic used by both Setup and Game screens.
 * When called:
 *   1. Updates rooms.status to 'abandoned' in the DB (so the AFK player is kicked on return)
 *   2. Broadcasts 'game_abandoned' on the Realtime channel (kicks partner if still on page)
 *   3. Clears sessionStorage and navigates this player home
 * @param forceReload - if true, uses window.location.replace instead of React Router navigate.
 *   Required when leaving from the Lobby (WaitingView), because navigate('/')
 *   doesn't remount the component, so in-memory state like waitingCode won't reset.
 */
export function useLeaveGame() {
  const navigate = useNavigate()

  async function leaveGame({ forceReload = false }: { forceReload?: boolean } = {}) {
    const roomCode = sessionStorage.getItem('room_code') ?? ''

    try {
      // Mark room as abandoned so any player who returns gets redirected home by SessionRestorer
      await supabase
        .from('rooms')
        .update({ status: 'abandoned' })
        .eq('code', roomCode)

      // Notify partner immediately if they're still on the page
      await supabase.channel(`game:${roomCode}`).send({
        type: 'broadcast',
        event: 'game_abandoned',
        payload: {},
      })
    } catch {
      // Best-effort — still clear session and go home even if DB/broadcast fails
    }

    sessionStorage.removeItem('player_id')
    sessionStorage.removeItem('room_code')
    sessionStorage.removeItem('player_role')

    if (forceReload) {
      // Force full page reload so all in-memory React state (e.g. WaitingView's waitingCode) is cleared
      window.location.replace('/')
    } else {
      navigate('/', { replace: true })
    }
  }

  return { leaveGame }
}
