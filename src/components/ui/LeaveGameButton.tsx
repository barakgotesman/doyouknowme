import { useState } from 'react'
import { useLeaveGame } from '../../hooks/useLeaveGame'

/**
 * Floating leave button that shows a confirmation dialog before abandoning the game.
 * Used on both the Setup and Game screens.
 *
 * partnerName is shown in the dialog so the message is personal ("leave [name]?").
 */
export default function LeaveGameButton({ partnerName }: { partnerName: string }) {
  const { leaveGame } = useLeaveGame()
  const [showConfirm, setShowConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)

  async function handleConfirm() {
    setLeaving(true)
    await leaveGame()
  }

  return (
    <>
      {/* Small leave button — unobtrusive, sits at the bottom of the screen */}
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs font-medium text-on-surface-variant underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity py-2"
      >
        עזוב משחק
      </button>

      {/* Confirmation overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/40">
          <div className="lobby-card rounded-3xl p-6 flex flex-col gap-5 w-full max-w-sm text-center shadow-xl">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-extrabold text-on-surface">עוזב את המשחק?</h2>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                אם תעזוב, המשחק עם{' '}
                <span className="font-bold text-on-surface">{partnerName || 'החבר שלך'}</span>{' '}
                יסתיים לשניכם.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                disabled={leaving}
                className="w-full py-3 rounded-2xl font-bold text-sm bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all disabled:opacity-60"
              >
                {leaving ? 'עוזב...' : 'כן, עזוב'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={leaving}
                className="btn-secondary-custom w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
