import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import AppHeader from './layouts/AppHeader'
import AppFooter from './layouts/AppFooter'
import Lobby from './components/Lobby'
import Setup from './components/Setup'
import GameRound from './components/GameRound'
import Results from './components/Results'
import { supabase } from './lib/supabase'

/**
 * Checks sessionStorage on every root ("/") load.
 * If the player has an active session, fetches the room status from DB
 * and redirects to the appropriate screen so they can recover from a refresh.
 */
function SessionRestorer() {
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
          return
        }

        if (room.status === 'waiting') {
          // Player A refreshed while waiting for Player B — re-enter lobby waiting state
          // We navigate to "/" with state so Lobby knows to restore the waiting UI
          navigate('/', { replace: true, state: { restoreWaiting: true, roomCode } })
        } else if (room.status === 'setup') {
          navigate('/setup', { replace: true })
        } else if (room.status === 'playing') {
          navigate('/game', { replace: true })
        } else if (room.status === 'finished') {
          navigate('/results', { replace: true })
        }
      })
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="lobby-bg min-h-screen flex flex-col" dir="rtl">
        <AppHeader />
        <SessionRestorer />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/game" element={<GameRound />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>
        <AppFooter />
      </div>
    </BrowserRouter>
  )
}
