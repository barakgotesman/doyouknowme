import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  startedAt: string     // ISO timestamp from DB — source of truth for sync
  totalSeconds: number  // 20 for game rounds
  onExpire: () => void  // called exactly once when time runs out
}

/**
 * Countdown timer synced to a DB timestamp rather than local Date.now() alone.
 * Both players' timers stay in sync because they both compute from the same startedAt.
 * Calls onExpire once when remaining time hits zero.
 */
export default function Timer({ startedAt, totalSeconds, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds)

  // Ref prevents onExpire from being called more than once if the interval fires a few extra times
  const expiredRef = useRef(false)

  useEffect(() => {
    // Reset expired flag when a new round starts (startedAt changes)
    expiredRef.current = false

    const interval = setInterval(() => {
      // Compute remaining time relative to the DB timestamp, not a local counter
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const remaining = Math.max(0, totalSeconds - elapsed)

      setTimeLeft(Math.ceil(remaining))

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire()
        clearInterval(interval)
      }
    }, 100) // 100ms interval for smooth display without heavy CPU use

    return () => clearInterval(interval)
  }, [startedAt]) // re-run only when a new round starts

  // Turn red when 5 seconds or less remain
  const isUrgent = timeLeft <= 5

  return (
    <div className={`timer-display ${isUrgent ? 'timer-urgent' : ''}`}>
      {timeLeft}
    </div>
  )
}
