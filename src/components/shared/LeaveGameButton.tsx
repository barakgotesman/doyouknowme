import { useState } from 'react'
import { useLeaveGame } from '../../hooks/useLeaveGame'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'

/**
 * Floating leave button that shows a shadcn Dialog confirmation before abandoning the game.
 * Used on both the Setup and Game screens.
 *
 * partnerName is shown in the dialog so the message is personal ("leave [name]?").
 */
export default function LeaveGameButton({ partnerName }: { partnerName: string }) {
  const { leaveGame } = useLeaveGame()
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  async function handleConfirm() {
    setLeaving(true)
    await leaveGame()
  }

  return (
    <>
      {/* Small leave button — unobtrusive, sits at the bottom of the screen */}
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-on-surface-variant underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity py-2"
      >
        עזוב משחק
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!leaving) setOpen(v) }}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center gap-1">
            <DialogTitle className="text-lg font-extrabold text-on-surface">
              עוזב את המשחק?
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium leading-relaxed">
              אם תעזוב, המשחק עם{' '}
              <span className="font-bold text-on-surface">{partnerName || 'החבר שלך'}</span>{' '}
              יסתיים לשניכם.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 mt-2 sm:flex-col">
            <button
              onClick={handleConfirm}
              disabled={leaving}
              className="btn-destructive w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
            >
              {leaving ? 'עוזב...' : 'כן, עזוב'}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={leaving}
              className="btn-secondary-custom w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
            >
              ביטול
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
