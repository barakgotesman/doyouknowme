import { useEffect, useRef, useState } from 'react'

/** Emoji options the player can send */
const REACTIONS = ['😂', '😮', '😤', '❤️', '🔥']

/** Must match the cooldown duration in useGame.ts */
const COOLDOWN_MS = 3000

/**
 * Emoji reaction bar with a visual cooldown progress bar.
 * While on cooldown, buttons are grayscale and a sweep animation
 * fills in from left to right to show when the bar is ready again.
 */
export default function ReactionBar({
  onReact,
  onCooldown,
}: {
  onReact: (emoji: string) => void
  onCooldown: boolean
}) {
  // progress: 0 = cooldown just started (gray), 1 = fully recharged (colorful)
  const [progress, setProgress] = useState(1)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  // When cooldown starts, animate progress from 0 → 1 over COOLDOWN_MS
  useEffect(() => {
    if (onCooldown) {
      startRef.current = performance.now()
      setProgress(0)

      const tick = (now: number) => {
        const elapsed = now - startRef.current
        const p = Math.min(elapsed / COOLDOWN_MS, 1)
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

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {/* Pill container with frosted background */}
      <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-outline/20 shadow-lvl2 overflow-hidden">

        {/* Progress bar underlay — sweeps left-to-right during cooldown */}
        {onCooldown && (
          <div
            className="absolute inset-0 origin-left transition-none"
            style={{
              background: 'linear-gradient(90deg, rgba(99,14,212,0.12) 0%, rgba(253,208,27,0.10) 100%)',
              transform: `scaleX(${progress})`,
              transformOrigin: 'left center',
            }}
          />
        )}

        {/* Emoji buttons */}
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            disabled={onCooldown}
            className={[
              'relative text-2xl w-11 h-11 rounded-full flex items-center justify-center',
              'transition-all duration-200',
              onCooldown
                ? 'grayscale opacity-50 cursor-not-allowed'
                : 'hover:-translate-y-1 hover:scale-110 active:scale-90',
            ].join(' ')}
            aria-label={`שלח ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Thin rechage strip below the pill — fills with primary color */}
      <div className="w-40 h-1 rounded-full bg-outline/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-none"
          style={{
            width: `${progress * 100}%`,
            background: progress === 1
              ? 'var(--color-primary)'
              : `linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary-container) 100%)`,
          }}
        />
      </div>
    </div>
  )
}
