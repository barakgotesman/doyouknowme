import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import AppHeader from './layouts/AppHeader'
import AppFooter from './layouts/AppFooter'
import ReturnToGameFab from './components/shared/ReturnToGameFab'
import Lobby from './pages/Lobby'
import Setup from './pages/Setup'
import GameRound from './pages/GameRound'
import Results from './pages/Results'
import HowToPlay from './pages/HowToPlay'
import AuthCallback from './pages/AuthCallback'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'

interface SessionRestorerProps {
  /** Called when an active session is detected so Lobby can hide its create/join UI. */
  onSessionDetected: (hasSession: boolean) => void
}

/**
 * Checks sessionStorage on every root ("/") load.
 * For 'waiting' rooms: navigates to "/" with restoreWaiting state so Lobby shows WaitingView.
 * For active game phases (setup/playing/finished): signals the parent via onSessionDetected
 * instead of redirecting — the Lobby will show a "back to game" card in place of the
 * create/join UI, keeping the user on the home screen by choice.
 */
function SessionRestorer({ onSessionDetected }: SessionRestorerProps) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Only run session restore when the user lands on the home screen
    if (location.pathname !== '/') return

    const playerId  = sessionStorage.getItem('player_id')
    const roomCode  = sessionStorage.getItem('room_code')
    const playerRole = sessionStorage.getItem('player_role')
    if (!playerId || !roomCode || !playerRole) return

    // Look up the room to find out what phase the game is in
    supabase
      .from('rooms')
      .select('status')
      .eq('code', roomCode)
      .maybeSingle()
      .then(({ data: room }) => {
        if (!room || room.status === 'abandoned') {
          // Room gone or abandoned — clear stale session and stay on home
          sessionStorage.removeItem('player_id')
          sessionStorage.removeItem('room_code')
          sessionStorage.removeItem('player_role')
          onSessionDetected(false)
          return
        }

        if (room.status === 'waiting') {
          // Player A refreshed while waiting for Player B — re-enter lobby waiting state
          navigate('/', { replace: true, state: { restoreWaiting: true, roomCode } })
        } else {
          // setup / playing / finished — signal Lobby to show "back to game" card
          // instead of auto-redirecting so the user stays on home by choice
          onSessionDetected(true)
        }
      })
  }, [location.pathname])

  return null
}

/**
 * Wraps a route that requires the admin Google session.
 * Renders null while auth is loading (prevents flash-redirect).
 * Redirects to "/" if the user is not the admin.
 */
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [isAdmin, loading])

  if (loading || !isAdmin) return null
  return <>{children}</>
}

/** Root component — wires session detection state between SessionRestorer, ReturnToGameFab, and Lobby. */
function AppInner() {
  // True when the player has an ongoing game — causes Lobby to hide create/join cards
  const [hasActiveSession, setHasActiveSession] = useState(false)

  return (
    <div className="lobby-bg min-h-screen flex flex-col" dir="rtl">
      <AppHeader />
      <SessionRestorer onSessionDetected={setHasActiveSession} />
      <ReturnToGameFab onSessionDetected={setHasActiveSession} />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Lobby hasActiveSession={hasActiveSession} onSessionCleared={() => setHasActiveSession(false)} />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/game" element={<GameRound />} />
          <Route path="/results" element={<Results />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
                  Admin panel — coming soon
                </div>
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>
      <AppFooter />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
