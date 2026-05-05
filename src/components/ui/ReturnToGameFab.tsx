import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

/** Routes that are part of the active game flow — FAB is hidden on these */
const GAME_ROUTES = ['/', '/setup', '/game', '/results']

type GamePhase = 'waiting' | 'setup' | 'playing' | 'finished'

/** Human-readable label for each game phase shown on the FAB */
const PHASE_LABELS: Record<GamePhase, string> = {
  waiting:  'ממתין לחבר',
  setup:    'שלב הכנה',
  playing:  'משחק בעיצומו',
  finished: 'תוצאות',
}

/**
 * Resolves the true game phase from the DB.
 *
 * Room status 'waiting' is ambiguous: it means "waiting for Player B to join" but
 * historically stayed 'waiting' even after both players moved to setup (if the
 * joinRoom update didn't fire). We disambiguate by checking the player count:
 * if 2 players are already in the room, setup has started.
 */
async function resolvePhase(roomCode: string): Promise<{ phase: GamePhase; roomId: string } | null> {
  const { data: room } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('code', roomCode)
    .maybeSingle()

  if (!room || room.status === 'abandoned') {
    // Partner abandoned — clear stale session so home screen shows clean
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

  // 2 players present means setup has started even if DB status wasn't updated
  return { phase: (count ?? 0) >= 2 ? 'setup' : 'waiting', roomId: room.id }
}

/**
 * Floating action button shown on non-game pages (e.g. how-to-play) when the
 * player has an active session. Displays the live game phase and navigates the
 * player back to the correct screen on tap.
 */
export default function ReturnToGameFab() {
  const location = useLocation()
  const navigate  = useNavigate()
  const [phase, setPhase] = useState<GamePhase | null>(null)

  useEffect(() => {
    if (GAME_ROUTES.includes(location.pathname)) { setPhase(null); return }

    const roomCode = sessionStorage.getItem('room_code')
    const playerId = sessionStorage.getItem('player_id')
    if (!roomCode || !playerId) { setPhase(null); return }

    resolvePhase(roomCode).then(result => {
      setPhase(result?.phase ?? null)
    })
  }, [location.pathname])

  if (!phase) return null

  /** Navigates to the screen matching the current game phase. */
  function navigateToPhase(p: GamePhase, roomCode: string) {
    if (p === 'waiting') navigate('/', { state: { restoreWaiting: true, roomCode } })
    else if (p === 'setup')    navigate('/setup')
    else if (p === 'playing')  navigate('/game')
    else if (p === 'finished') navigate('/results')
  }

  /** Re-resolves the live phase before navigating so stale state can't misdirect. */
  function handleReturn() {
    const roomCode = sessionStorage.getItem('room_code')
    if (!roomCode) return
    resolvePhase(roomCode).then(result => {
      if (!result) { setPhase(null); return }
      setPhase(result.phase)
      navigateToPhase(result.phase, roomCode)
    })
  }

  return (
    <button
      onClick={handleReturn}
      dir="rtl"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 btn-primary px-5 py-3 rounded-full text-sm font-bold shadow-xl"
    >
      {/* Pulsing green dot — signals an active live session */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
      </span>
      <span>חזרה למשחק</span>
      <span className="opacity-75 text-xs font-medium">({PHASE_LABELS[phase]})</span>
    </button>
  )
}
