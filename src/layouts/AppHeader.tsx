import { useEffect, useRef, useState } from 'react'
import { setGlobalVolume, getSavedVolume, isMuted } from '../hooks/useAudio'
import { SettingsIcon, VolumeOffIcon, VolumeLowIcon, VolumeMedIcon, VolumeHighIcon } from '../components/ui/Icons'

/**
 * Global site header — rendered on every screen via App.tsx.
 * Contains the settings dropdown with a volume slider.
 */
export default function AppHeader() {
  const [open, setOpen] = useState(false)
  const [volume, setVolume] = useState(() => isMuted() ? 0 : getSavedVolume())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    setVolume(val)
    setGlobalVolume(val)
  }

  function VolumeIcon() {
    if (volume === 0)    return <VolumeOffIcon className="w-5 h-5" />
    if (volume < 0.4)   return <VolumeLowIcon className="w-5 h-5" />
    if (volume < 0.75)  return <VolumeMedIcon className="w-5 h-5" />
    return <VolumeHighIcon className="w-5 h-5" />
  }

  return (
    <header className="flex items-center justify-between px-5 md:px-10 py-4 bg-white/70 backdrop-blur-sm border-b border-outline/30">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-on-surface-variant hover:text-primary transition-colors p-1"
          title="הגדרות"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>

        {open && (
          <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-lg border border-outline/20 p-4 w-52 flex flex-col gap-3 z-[200]" dir="rtl">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">עוצמת מוזיקה</p>
            <div className="flex items-center gap-3">
              <span className="text-on-surface-variant"><VolumeIcon /></span>
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
          </div>
        )}
      </div>

      <span className="text-lg font-extrabold text-primary hidden md:block">Do You Know Me</span>

      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
        <a href="#" className="hover:text-primary transition-colors">אודות</a>
        <a href="#" className="hover:text-primary transition-colors">איך משחקים</a>
        <a href="#" className="hover:text-primary transition-colors">תנאי שימוש</a>
      </nav>

      <button className="btn-primary px-4 py-2 rounded-full text-sm font-bold">צור משחק</button>
    </header>
  )
}
