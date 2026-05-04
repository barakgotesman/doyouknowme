import PlayersStatusBar from './PlayersStatusBar'
import type { PlayerStatus } from '../../hooks/useSetup'

/**
 * Shown after the player finishes their 10 questions, while waiting for their partner.
 * Live progress from PlayersStatusBar keeps the waiting player informed.
 * This screen disappears automatically when the partner finishes (setup_complete broadcast).
 */
export default function WaitingScreen({
  myStatus, partnerStatus,
}: {
  myStatus: PlayerStatus
  partnerStatus: PlayerStatus
}) {
  return (
    <div className="lobby-bg min-h-screen flex flex-col items-center justify-center px-5 gap-6">
      <div className="lobby-card-purple rounded-3xl p-8 flex flex-col items-center gap-5 text-center w-full max-w-sm">
        <span className="text-4xl">⏳</span>
        <h2 className="text-xl font-extrabold text-on-surface">סיימת!</h2>
        <p className="text-sm font-medium text-on-surface-variant">ממתין לחבר/ה שלך לסיים...</p>

        {/* Keep both players' progress visible so the waiting player isn't in the dark */}
        <PlayersStatusBar myStatus={myStatus} partnerStatus={partnerStatus} />

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="text-sm text-on-surface-variant">המשחק יתחיל בקרוב</span>
        </div>
      </div>
    </div>
  )
}
