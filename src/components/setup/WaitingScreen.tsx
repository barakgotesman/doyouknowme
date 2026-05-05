import { useEffect, useState } from 'react'
import PlayersStatusBar from './PlayersStatusBar'
import AfkWarning from './AfkWarning'
import LeaveGameButton from '../ui/LeaveGameButton'
import type { PlayerStatus } from '../../hooks/useSetup'
import { CelebrationIcon, SearchIcon, BrainIcon, ChatIcon } from '../ui/Icons'

const TIPS = [
  'כל תשובה שנתת תהפוך לשאלה שהחבר שלך יצטרך לנחש',
  'ככל שהכרתם אחד את השני יותר — כך תצליחו יותר',
  'אין תשובות נכונות או לא נכונות — רק מה שאמרת',
  'חשוב: החבר שלך יצטרך לנחש את תשובותיך בדיוק',
]

const TIP_ICONS = [SearchIcon, BrainIcon, ChatIcon, SearchIcon]

/**
 * Shown after the local player finishes all 10 questions, while waiting for their partner.
 * Cycles through tips and animates the waiting state so the screen feels alive.
 * Disappears automatically when setup_complete broadcast arrives in useSetup.
 * Shows an AFK warning + leave option if partner has been idle for 2+ minutes.
 */
export default function WaitingScreen({
  myStatus, partnerStatus, partnerAfk, onLeave,
}: {
  myStatus: PlayerStatus
  partnerStatus: PlayerStatus
  partnerAfk: boolean
  onLeave: () => void
}) {
  const [tipIndex, setTipIndex] = useState(0)
  const [tipVisible, setTipVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipVisible(false)
      setTimeout(() => {
        setTipIndex(i => (i + 1) % TIPS.length)
        setTipVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const TipIcon = TIP_ICONS[tipIndex]

  return (
    <div className="lobby-bg flex-1 flex flex-col items-center justify-center px-5 gap-6">
      <div className="lobby-card-purple rounded-3xl p-8 flex flex-col items-center gap-6 text-center w-full max-w-sm">

        <div className="animate-bounce">
          <CelebrationIcon className="w-12 h-12 text-primary" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-on-surface">כל הכבוד, סיימת!</h2>
          <p className="text-sm font-medium text-on-surface-variant">ממתין לחבר/ה שלך לסיים...</p>
        </div>

        <PlayersStatusBar myStatus={myStatus} partnerStatus={partnerStatus} />

        <div
          className="bg-surface-low rounded-2xl px-4 py-3 flex items-start gap-2 text-xs text-on-surface-variant font-medium leading-relaxed transition-opacity duration-400"
          style={{ opacity: tipVisible ? 1 : 0 }}
        >
          <TipIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{TIPS[tipIndex]}</span>
        </div>

        {partnerAfk ? (
          <AfkWarning partnerName={partnerStatus.name} onLeave={onLeave} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">המשחק יתחיל בקרוב</span>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary inline-block animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary inline-block animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <LeaveGameButton partnerName={partnerStatus.name} />

      </div>
    </div>
  )
}
