import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resolvePhase, type GamePhase } from '../../lib/gameUtils'

/** Routes where the FAB pill is hidden (it's part of the active game flow) */
const HIDE_FAB_ROUTES = ['/setup', '/game', '/results']

/** Human-readable label for each game phase shown on the FAB */
const PHASE_LABELS: Record<GamePhase, string> = {
  waiting:  'ממתין לחבר',
  setup:    'שלב הכנה',
  playing:  'משחק בעיצומו',
  finished: 'תוצאות',
}

interface Props {
  /** Called whenever session detection resolves — true if an active session exists. */
  onSessionDetected?: (hasSession: boolean) => void
}

/**
 * Floating action button shown on non-game pages (e.g. how-to-play) when the
 * player has an active session. Displays the live game phase and navigates the
 * player back to the correct screen on tap.
 *
 * On the home screen ('/') the pill is hidden but detection still runs,
 * allowing the Lobby to collapse its Create/Join UI via onSessionDetected.
 */
export default function ReturnToGameFab({ onSessionDetected }: Props) {
  const location = useLocation()
  const navigate  = useNavigate()
  const [phase, setPhase] = useState<GamePhase | null>(null)

  useEffect(() => {
    const roomCode = sessionStorage.getItem('room_code')
    const playerId = sessionStorage.getItem('player_id')

    if (!roomCode || !playerId) {
      setPhase(null)
      onSessionDetected?.(false)
      return
    }

    resolvePhase(roomCode).then(result => {
      const resolved = result?.phase ?? null
      setPhase(resolved)
      onSessionDetected?.(resolved !== null)
    })
  }, [location.pathname])

  // On game-flow pages hide the pill entirely (detection still ran above)
  const showPill = phase !== null && !HIDE_FAB_ROUTES.includes(location.pathname) && location.pathname !== '/'
  if (!showPill) return null

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
      if (!result) { setPhase(null); onSessionDetected?.(false); return }
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
