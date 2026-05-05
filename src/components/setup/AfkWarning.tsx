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
    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 flex flex-col gap-3 text-center">
      <p className="text-sm font-bold text-amber-800">
        {partnerName || 'החבר שלך'} לא פעיל/ה כבר יותר מ-2 דקות
      </p>
      <p className="text-xs text-amber-700 font-medium">
        ייתכן שהם עזבו. תרצה/י לסגור את המשחק?
      </p>
      <button
        onClick={onLeave}
        className="w-full py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all"
      >
        כן, עזוב את המשחק
      </button>
    </div>
  )
}
