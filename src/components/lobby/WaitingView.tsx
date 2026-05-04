/**
 * Full-screen view shown to Player A after they create a room.
 * Displays the room code in large text so they can share it with their partner.
 * Disappears automatically when Player B joins (player_joined Realtime broadcast).
 */
export default function WaitingView({ code, onCancel }: { code: string; onCancel: () => void }) {
  return (
    <div className="lobby-bg min-h-screen flex flex-col items-center justify-center px-5 gap-6">
      <div className="lobby-card-purple rounded-3xl p-8 flex flex-col items-center gap-5 text-center w-full max-w-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">קוד החדר שלך</p>
        {/* Large spaced code for easy reading across a table or screen share */}
        <p className="text-5xl font-extrabold tracking-[0.2em] text-on-surface">{code}</p>
        <p className="text-sm font-medium text-on-surface-variant">שתף את הקוד עם חבר/ה שלך ✨</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="text-sm font-medium text-on-surface-variant">ממתין לשחקן שני...</span>
        </div>
        <button onClick={onCancel} className="text-xs font-bold text-on-surface-variant underline">
          ביטול
        </button>
      </div>
    </div>
  )
}
