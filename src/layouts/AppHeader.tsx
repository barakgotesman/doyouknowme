import { useState } from 'react'
import { Link } from 'react-router-dom'
import { setGlobalVolume, getSavedVolume, isMuted, toggleMute } from '../hooks/useAudio'
import { useAuth } from '../hooks/useAuth'
import { useLeaveGame } from '../hooks/useLeaveGame'
import { VolumeOffIcon, VolumeLowIcon, VolumeMedIcon, VolumeHighIcon, LogoutIcon } from '../components/ui/Icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
 * Layout: logo (left) | right side: volume control + user avatar dropdown (if Google).
 */

export default function AppHeader() {
  const { user, isAdmin, isGoogleUser, signOut } = useAuth()
  const { leaveGame } = useLeaveGame()
  const [volume, setVolume] = useState(() => isMuted() ? 0 : getSavedVolume())
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [lastVolume, setLastVolume] = useState(() => getSavedVolume() || 0.35)

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    if (val > 0) setLastVolume(val)
    setVolume(val)
    setGlobalVolume(val)
  }

  /**
   * Logout flow: shows warning dialog if a game is in progress, otherwise signs out immediately.
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

  /** Toggles mute and syncs local volume state. */
  function handleToggleMute() {
    const nowMuted = toggleMute()
    setVolume(nowMuted ? 0 : lastVolume)
  }

  /** Returns the right volume icon based on current level. */
  function VolumeIcon() {
    if (volume === 0)   return <VolumeOffIcon className="w-4 h-4" />
    if (volume < 0.4)  return <VolumeLowIcon className="w-4 h-4" />
    if (volume < 0.75) return <VolumeMedIcon className="w-4 h-4" />
    return <VolumeHighIcon className="w-4 h-4" />
  }

  const avatarUrl: string | undefined = user?.user_metadata?.avatar_url
  const fullName: string = user?.user_metadata?.full_name ?? ''
  const initial = fullName[0]?.toUpperCase() ?? '?'

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-14 bg-white/90 backdrop-blur-md border-b border-outline-variant/40 shadow-sm"
        dir="ltr"
      >
        {/* Logo */}
        <Link to="/" className="text-sm font-extrabold text-primary tracking-tight shrink-0 select-none">
          Do You Know Me
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* How to play — desktop only, always visible */}
          <Link
            to="/how-to-play"
            className="hidden md:flex items-center h-8 px-3 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            איך משחקים
          </Link>

          {/* Volume dropdown — compact icon trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors outline-none"
              title="עוצמת מוזיקה"
            >
              <VolumeIcon />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 p-4 flex flex-col gap-3" dir="rtl">
              <p className="text-xs font-bold text-on-surface-variant tracking-wide">עוצמת מוזיקה</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleMute}
                  className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
                  title={volume === 0 ? 'בטל השתקה' : 'השתק'}
                >
                  <VolumeIcon />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 accent-primary h-1.5 cursor-pointer"
                />
                <span className="text-xs font-semibold text-on-surface-variant w-8 text-right tabular-nums">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Google user avatar + name dropdown */}
          {isGoogleUser && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-surface-container transition-colors outline-none ml-1"
                dir="ltr"
              >
                {/* Profile photo or initial fallback */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initial}
                  </div>
                )}
                {/* Name — hidden on mobile to keep header tight */}
                <span className="hidden sm:block text-sm font-semibold text-on-surface max-w-[120px] truncate">
                  {fullName}
                </span>
                {/* Small chevron */}
                <svg className="w-3.5 h-3.5 text-on-surface-variant hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48" dir="rtl">
                {/* User info header — plain div, not DropdownMenuLabel (requires Group wrapper) */}
                <div className="px-3 py-2 border-b border-outline-variant/40 mb-1">
                  <p className="text-sm font-semibold text-on-surface truncate">{fullName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email ?? ''}</p>
                </div>

                {/* Admin panel — only for admins */}
                {/* How to play — mobile only (desktop has the nav link) */}
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/how-to-play" className="cursor-pointer w-full flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    איך משחקים
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="md:hidden" />

                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer w-full flex items-center gap-2">
                        {/* shield icon */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        ניהול
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem
                  onClick={handleLogoutClick}
                  className="text-error focus:text-error focus:bg-error/8 cursor-pointer flex items-center gap-2"
                >
                  <LogoutIcon className="w-4 h-4" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Logout confirmation when a game is in progress */}
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
