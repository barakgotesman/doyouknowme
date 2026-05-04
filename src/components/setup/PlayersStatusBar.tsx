import type { PlayerStatus } from '../../hooks/useSetup'

const TOTAL_QUESTIONS = 10

/**
 * Side-by-side bar showing both players' names and setup progress.
 * Updates in real-time as each player broadcasts their answers via Supabase Realtime.
 */
export default function PlayersStatusBar({
  myStatus, partnerStatus,
}: {
  myStatus: PlayerStatus
  partnerStatus: PlayerStatus
}) {
  return (
    <div className="w-full flex gap-3">
      <PlayerBadge status={myStatus} isMe />
      <PlayerBadge status={partnerStatus} isMe={false} />
    </div>
  )
}

/**
 * Single player's progress pill inside the status bar.
 * Shows "X/10" while in progress, or a green "סיים ✓" badge when all questions are answered.
 */
function PlayerBadge({ status, isMe }: { status: PlayerStatus; isMe: boolean }) {
  return (
    <div className={`flex-1 rounded-2xl p-3 flex flex-col gap-1 ${isMe ? 'lobby-card-purple' : 'lobby-card-yellow'}`}>
      <p className="text-xs font-bold text-on-surface-variant truncate">
        {isMe ? '👤 אתה' : '👥 חבר/ה'}
      </p>
      <p className="text-sm font-extrabold text-on-surface truncate">
        {status.name || '...'}
      </p>
      {status.done ? (
        // Green pill — player finished all questions
        <span className="text-xs font-bold text-green-600 bg-green-50 rounded-full px-2 py-0.5 w-fit">
          סיים ✓
        </span>
      ) : (
        <span className="text-xs font-bold text-on-surface-variant">
          {status.progress}/{TOTAL_QUESTIONS}
        </span>
      )}
    </div>
  )
}
