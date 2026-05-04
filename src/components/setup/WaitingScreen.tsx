import { useEffect, useState } from 'react'
import PlayersStatusBar from './PlayersStatusBar'
import type { PlayerStatus } from '../../hooks/useSetup'

// Rotating tips shown while the player waits — keeps the screen from feeling frozen
const TIPS = [
  'כל תשובה שנתת תהפוך לשאלה שהחבר שלך יצטרך לנחש 🎯',
  'ככל שהכרתם אחד את השני יותר — כך תצליחו יותר 🧠',
  'אין תשובות נכונות או לא נכונות — רק מה שאמרת 💬',
  'חשוב: החבר שלך יצטרך לנחש את תשובותיך בדיוק 🔍',
]

/**
 * Shown after the local player finishes all 10 questions, while waiting for their partner.
 * Cycles through tips and animates the waiting state so the screen feels alive.
 * Disappears automatically when setup_complete broadcast arrives in useSetup.
 */
export default function WaitingScreen({
  myStatus, partnerStatus,
}: {
  myStatus: PlayerStatus
  partnerStatus: PlayerStatus
}) {
  // Rotate tips every 3 seconds
  const [tipIndex, setTipIndex] = useState(0)
  const [tipVisible, setTipVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, swap tip, fade in
      setTipVisible(false)
      setTimeout(() => {
        setTipIndex(i => (i + 1) % TIPS.length)
        setTipVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="lobby-bg flex-1 flex flex-col items-center justify-center px-5 gap-6">
      <div className="lobby-card-purple rounded-3xl p-8 flex flex-col items-center gap-6 text-center w-full max-w-sm">

        {/* Animated trophy — spins in on mount */}
        <div className="text-5xl animate-bounce">🎉</div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-on-surface">כל הכבוד, סיימת!</h2>
          <p className="text-sm font-medium text-on-surface-variant">ממתין לחבר/ה שלך לסיים...</p>
        </div>

        {/* Live partner progress */}
        <PlayersStatusBar myStatus={myStatus} partnerStatus={partnerStatus} />

        {/* Rotating tip — fades between messages */}
        <div
          className="bg-surface-low rounded-2xl px-4 py-3 text-xs text-on-surface-variant font-medium leading-relaxed transition-opacity duration-400"
          style={{ opacity: tipVisible ? 1 : 0 }}
        >
          {TIPS[tipIndex]}
        </div>

        {/* Three bouncing dots */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">המשחק יתחיל בקרוב</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-container inline-block animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary-container inline-block animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary-container inline-block animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

      </div>
    </div>
  )
}
