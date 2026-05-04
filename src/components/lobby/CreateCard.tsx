/**
 * Card for creating a new game room.
 * Name is collected above this card in Lobby.tsx — only the action button lives here.
 */
export default function CreateCard({
  name, loading, onCreate,
}: {
  name: string
  loading: boolean
  onCreate: () => void
}) {
  return (
    <div className="lobby-card-purple rounded-2xl p-5 flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">😊</span>
        <div>
          <p className="text-sm font-extrabold text-on-surface">התחל משחק חדש</p>
          <p className="text-xs text-on-surface-variant">צור חדר ושתף את הקוד לחבר</p>
        </div>
      </div>

      <button
        onClick={onCreate}
        disabled={!name.trim() || loading}
        className="btn-primary w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
      >
        {loading ? '...' : 'צור משחק'}
      </button>
    </div>
  )
}
