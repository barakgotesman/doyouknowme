import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setGlobalVolume, getSavedVolume, isMuted, toggleMute } from '../hooks/useAudio'
import { SettingsIcon, VolumeOffIcon, VolumeLowIcon, VolumeMedIcon, VolumeHighIcon } from '../components/ui/Icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '../lib/supabase'

// Routes where the game is actively running — no banner needed on these
const GAME_ROUTES = ['/', '/setup', '/game', '/results']

/**
 * Global site header — rendered on every screen via App.tsx.
 * Layout: logo (left) | nav links (center) | settings dropdown (right).
 */
/**
 * Shows a "חזרה למשחק" pill whenever the player has an active session
 * but is browsing a non-game page (e.g. how-to-play).
 * Clicking it re-runs session restore logic to navigate back to the right screen.
 */
function ReturnToGameBanner() {
  const location = useLocation()
  const navigate  = useNavigate()
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Only show on pages outside the game flow
    if (GAME_ROUTES.includes(location.pathname)) { setActive(false); return }

    const roomCode = sessionStorage.getItem('room_code')
    const playerId = sessionStorage.getItem('player_id')
    if (!roomCode || !playerId) { setActive(false); return }

    // Verify the room is still live before showing the banner
    supabase.from('rooms').select('status').eq('code', roomCode).maybeSingle()
      .then(({ data: room }) => {
        setActive(!!room && room.status !== 'abandoned')
      })
  }, [location.pathname])

  if (!active) return null

  function handleReturn() {
    const roomCode = sessionStorage.getItem('room_code')
    if (!roomCode) return
    supabase.from('rooms').select('status').eq('code', roomCode).maybeSingle()
      .then(({ data: room }) => {
        if (!room || room.status === 'abandoned') { setActive(false); return }
        if (room.status === 'waiting')  navigate('/', { state: { restoreWaiting: true, roomCode } })
        else if (room.status === 'setup')   navigate('/setup')
        else if (room.status === 'playing') navigate('/game')
        else if (room.status === 'finished') navigate('/results')
      })
  }

  return (
    <button
      onClick={handleReturn}
      className="btn-primary px-4 py-1.5 rounded-full text-xs font-bold animate-pulse"
      dir="rtl"
    >
      חזרה למשחק ←
    </button>
  )
}

export default function AppHeader() {
  const [volume, setVolume] = useState(() => isMuted() ? 0 : getSavedVolume())
  // tracks the last non-zero volume so mute/unmute can restore it
  const [lastVolume, setLastVolume] = useState(() => getSavedVolume() || 0.35)

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    if (val > 0) setLastVolume(val)
    setVolume(val)
    setGlobalVolume(val)
  }

  /** Toggles mute: if muted restores lastVolume, if unmuted sets volume to 0. */
  function handleToggleMute() {
    const nowMuted = toggleMute()
    if (nowMuted) {
      setVolume(0)
    } else {
      setVolume(lastVolume)
    }
  }

  function VolumeIcon() {
    if (volume === 0)   return <VolumeOffIcon className="w-5 h-5" />
    if (volume < 0.4)  return <VolumeLowIcon className="w-5 h-5" />
    if (volume < 0.75) return <VolumeMedIcon className="w-5 h-5" />
    return <VolumeHighIcon className="w-5 h-5" />
  }

  return (
    <header className="flex items-center justify-between px-5 md:px-10 py-3 bg-white/80 backdrop-blur-sm border-b border-outline/20" dir="ltr">

      {/* Logo */}
      <Link to="/" className="text-base font-extrabold text-primary tracking-tight shrink-0">
        Do You Know Me
      </Link>

      {/* Nav links — desktop only */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
        <Link to="/how-to-play" className="hover:text-primary transition-colors">איך משחקים</Link>
        <ReturnToGameBanner />
      </nav>

      {/* Settings dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-lg outline-none"
          title="הגדרות"
        >
          <SettingsIcon className="w-5 h-5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52 p-4 flex flex-col gap-3" dir="rtl">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">עוצמת מוזיקה</p>
          <div className="flex items-center gap-3">
            {/* clicking the icon toggles mute/unmute */}
            <button onClick={handleToggleMute} className="text-on-surface-variant hover:text-primary transition-colors shrink-0" title={volume === 0 ? 'בטל השתקה' : 'השתק'}>
              <VolumeIcon />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 accent-primary"
            />
          </div>
          <p className="text-xs text-on-surface-variant text-center">{Math.round(volume * 100)}%</p>
        </DropdownMenuContent>
      </DropdownMenu>

    </header>
  )
}
