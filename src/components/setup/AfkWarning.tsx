/**
 * Shown when the partner hasn't sent any Realtime activity for 2+ minutes.
 * Gives the active player an explanation and a direct leave button.
 */
export default function AfkWarning({
  partnerName,
  onLeave,
}: {
  partnerName: string
  onLeave: () => void
}) {
  return (
    <div className="rounded-2xl border border-secondary-container bg-secondary-fixed px-4 py-3 flex flex-col gap-3 text-center">
      <p className="text-sm font-bold text-on-secondary-container">
        {partnerName || 'החבר שלך'} לא פעיל/ה כבר יותר מ-2 דקות
      </p>
      <p className="text-xs text-on-secondary-container/80 font-medium">
        ייתכן שהם עזבו. תרצה/י לסגור את המשחק?
      </p>
      <button
        onClick={onLeave}
        className="btn-destructive w-full py-2 rounded-xl text-sm font-bold disabled:opacity-60"
      >
        כן, עזוב את המשחק
      </button>
    </div>
  )
}
