/**
 * Card for creating a new game room.
 * Player enters their display name here; the room code is generated on the server side.
 * The name input is shared with JoinCard via lifted state in Lobby.tsx.
 */
export default function CreateCard({
  name, loading, onNameChange, onCreate,
}: {
  name: string
  loading: boolean
  onNameChange: (v: string) => void
  onCreate: () => void
}) {
  return (
    <div className="lobby-card-purple rounded-2xl p-5 flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">😊</span>
        <div>
          <p className="text-sm font-extrabold text-on-surface">התחל משחק חדש</p>
          <p className="text-xs text-on-surface-variant">מלא פרטים ושתף את הקוד</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-bold text-on-surface-variant mb-1 block">שם</label>
          <input
            type="text"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="הכנס את שמך..."
            dir="rtl"
            className="game-input w-full rounded-xl py-3 px-4 text-sm font-medium"
          />
        </div>
        <button
          onClick={onCreate}
          disabled={!name.trim() || loading}
          className="btn-primary w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'צור משחק'}
        </button>
      </div>
    </div>
  )
}
