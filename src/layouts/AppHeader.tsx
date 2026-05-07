import { useState } from 'react'
import { Link } from 'react-router-dom'
import { setGlobalVolume, getSavedVolume, isMuted, toggleMute } from '../hooks/useAudio'
import { useAuth } from '../hooks/useAuth'
import { useLeaveGame } from '../hooks/useLeaveGame'
import { SettingsIcon, VolumeOffIcon, VolumeLowIcon, VolumeMedIcon, VolumeHighIcon, LogoutIcon } from '../components/ui/Icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog'

/**
 * Global site header — rendered on every screen via App.tsx.
 * Layout: logo (left) | nav links (center) | settings dropdown (right).
 */

export default function AppHeader() {
  const { isAdmin, isGoogleUser, signOut } = useAuth()
  const { leaveGame } = useLeaveGame()
  const [volume, setVolume] = useState(() => isMuted() ? 0 : getSavedVolume())
  // controls the "logout while in game" warning dialog
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  // tracks the last non-zero volume so mute/unmute can restore it
  const [lastVolume, setLastVolume] = useState(() => getSavedVolume() || 0.35)

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    if (val > 0) setLastVolume(val)
    setVolume(val)
    setGlobalVolume(val)
  }

  /**
   * Logout flow: if the user has an active game session, show a warning dialog
   * so they can leave the game cleanly before signing out. Otherwise sign out immediately.
   */
  function handleLogoutClick() {
    const hasActiveGame = !!sessionStorage.getItem('room_code')
    if (hasActiveGame) {
      setLogoutDialogOpen(true)
    } else {
      signOut()
    }
  }

  /** Leaves the active game then signs out. */
  async function handleLogoutConfirm() {
    setLoggingOut(true)
    await leaveGame()
    await signOut()
    setLoggingOut(false)
    setLogoutDialogOpen(false)
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
    <>
    <header className="flex items-center justify-between px-5 md:px-10 py-3 bg-white/80 backdrop-blur-sm border-b border-outline/20" dir="ltr">

      {/* Logo */}
      <Link to="/" className="text-base font-extrabold text-primary tracking-tight shrink-0">
        Do You Know Me
      </Link>

      {/* Nav links — desktop only */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
        <Link to="/how-to-play" className="hover:text-primary transition-colors">איך משחקים</Link>
        {/* Admin panel link — only shown to admin users */}
        {isAdmin && (
          <Link to="/admin" className="hover:text-primary transition-colors">ניהול</Link>
        )}
        {/* Logout button — only shown when signed in via Google */}
        {isGoogleUser && (
          <button
            onClick={handleLogoutClick}
            title="התנתק"
            className="flex items-center gap-1.5 hover:text-error transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
            <span>התנתק</span>
          </button>
        )}
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

    {/* Warning shown when the user tries to log out while an active game is in progress */}
    <Dialog open={logoutDialogOpen} onOpenChange={(v) => { if (!loggingOut) setLogoutDialogOpen(v) }}>
      <DialogContent className="max-w-sm rounded-3xl p-6">
        <DialogHeader className="text-center gap-1">
          <DialogTitle className="text-lg font-extrabold text-on-surface">
            התנתקות במהלך משחק?
          </DialogTitle>
          <DialogDescription className="text-sm text-on-surface-variant font-medium leading-relaxed">
            יש לך משחק פעיל. התנתקות תעזוב את המשחק ותסיים אותו עבור שניכם.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 mt-2 sm:flex-col">
          <button
            onClick={handleLogoutConfirm}
            disabled={loggingOut}
            className="btn-destructive w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
          >
            {loggingOut ? 'מתנתק...' : 'כן, עזוב והתנתק'}
          </button>
          <button
            onClick={() => setLogoutDialogOpen(false)}
            disabled={loggingOut}
            className="btn-secondary-custom w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
          >
            ביטול
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
