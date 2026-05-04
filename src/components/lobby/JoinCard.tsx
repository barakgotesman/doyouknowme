/**
 * Card for joining an existing room by entering a 4-letter code.
 * Submit is disabled until both the name field and a 4-character code are filled in.
 */
export default function JoinCard({
  name, roomCode, loading,
  onNameChange, onRoomCodeChange, onSubmit,
}: {
  name: string
  roomCode: string
  loading: boolean
  onNameChange: (v: string) => void
  onRoomCodeChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="lobby-card-yellow rounded-2xl p-5 flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔑</span>
        <div>
          <p className="text-sm font-extrabold text-on-surface">הצטרף למשחק</p>
          <p className="text-xs text-on-surface-variant">יש לך קוד חדר? הכנס אותו כאן</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="game-input rounded-xl py-3 px-4 text-center text-xl font-extrabold tracking-[0.3em] text-on-surface">
          <input
            type="text"
            value={roomCode}
            onChange={e => onRoomCodeChange(e.target.value.toUpperCase())}
            placeholder="A B C D"
            maxLength={4}
            dir="ltr"
            className="w-full bg-transparent text-center text-xl font-extrabold tracking-[0.3em] outline-none placeholder:text-on-surface-variant/50"
          />
        </div>
        <p className="text-xs text-on-surface-variant text-center">
          הכנס את שמך למעלה לפני ההצטרפות
        </p>
        <button
          type="submit"
          disabled={roomCode.trim().length !== 4 || !name.trim() || loading}
          className="btn-secondary w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'הצטרף למשחק'}
        </button>
      </form>
    </div>
  )
}
