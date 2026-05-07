import { useEffect, useRef, useState } from 'react'
import { ChatIcon } from '../ui/Icons'

/** Emoji options the player can send */
const REACTIONS = ['😂', '😮', '😤', '❤️', '🔥', 'חחחח']

/** Must match the cooldown duration in useReactions.ts */
const COOLDOWN_MS = 3000

/** Circumference of the SVG ring (r=20, so 2π×20 ≈ 125.66) */
const RING_CIRCUMFERENCE = 2 * Math.PI * 20

/**
 * Floating chat-bubble button that expands into a vertical emoji picker.
 * Click the button → vertical list of emojis appears above it.
 * Pick an emoji → list closes, a circular SVG arc sweeps around the button during cooldown.
 */
export default function ReactionBar({
  onReact,
  onCooldown,
}: {
  onReact: (emoji: string) => void
  onCooldown: boolean
}) {
  const [open, setOpen] = useState(false)
  // 0 = cooldown just started, 1 = fully recharged
  const [progress, setProgress] = useState(1)
  const rafRef   = useRef<number>(0)
  const startRef = useRef<number>(0)

  // Animate the ring from 0 → 1 over COOLDOWN_MS when cooldown starts
  useEffect(() => {
    if (onCooldown) {
      startRef.current = performance.now()
      setProgress(0)
      const tick = (now: number) => {
        const p = Math.min((now - startRef.current) / COOLDOWN_MS, 1)
        setProgress(p)
        if (p < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      setProgress(1)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [onCooldown])

  // Close picker when cooldown starts (after sending)
  useEffect(() => {
    if (onCooldown) setOpen(false)
  }, [onCooldown])

  /** Pick an emoji: fire callback, close picker */
  function handlePick(emoji: string) {
    onReact(emoji)
    setOpen(false)
  }

  // How much of the ring is filled (dashoffset goes from full → 0 as progress 0 → 1)
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress)

  return (
    <div className="relative flex items-center justify-center">

      {/* Vertical emoji list — floats above the button */}
      {open && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handlePick(emoji)}
              className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-outline/20 shadow-md text-xl flex items-center justify-center hover:scale-110 hover:-translate-y-0.5 active:scale-90 transition-transform duration-150"
              aria-label={`שלח ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main trigger button with cooldown ring */}
      <button
        onClick={() => { if (!onCooldown) setOpen(v => !v) }}
        disabled={onCooldown}
        className={[
          'relative z-50 w-12 h-12 rounded-full flex items-center justify-center',
          'bg-white/80 backdrop-blur-sm border border-outline/20 shadow-md',
          'transition-transform duration-150',
          onCooldown  ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95',
          open        ? 'bg-primary/10 border-primary/40' : '',
        ].join(' ')}
        aria-label="תגובות"
      >
        {/* Cooldown ring SVG — sits on top of everything in the button */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Track */}
          <circle cx="24" cy="24" r="20" stroke="rgba(99,14,212,0.12)" strokeWidth="3" />
          {/* Fill — sweeps clockwise as progress goes 0 → 1 */}
          {onCooldown && (
            <circle
              cx="24" cy="24" r="20"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-none"
            />
          )}
        </svg>

        {/* Chat bubble icon */}
        <ChatIcon className="w-5 h-5 text-primary relative z-10" />
      </button>

      {/* Backdrop — closes picker when clicking outside */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
