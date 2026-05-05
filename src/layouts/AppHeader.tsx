import { useState } from 'react'
import { Link } from 'react-router-dom'
import { setGlobalVolume, getSavedVolume, isMuted, toggleMute } from '../hooks/useAudio'
import { SettingsIcon, VolumeOffIcon, VolumeLowIcon, VolumeMedIcon, VolumeHighIcon } from '../components/ui/Icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Global site header — rendered on every screen via App.tsx.
 * Layout: logo (left) | nav links (center) | settings dropdown (right).
 */

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
