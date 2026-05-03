import { useState } from 'react'
import { useRoom } from '../hooks/useRoom'
import LobbyLayout from '../layouts/LobbyLayout'

const FEATURE_CARDS = [
  { icon: '🏆', title: 'תחרות חברים', desc: 'גלו מי מכיר את מי טוב יותר בסיבוב מהנה' },
  { icon: '📍', title: 'שאלות מגוונות', desc: 'שאלות על העדפות, חלומות ואישיות' },
  { icon: '💜', title: 'זמן איכות', desc: 'חזקו את הקשר עם חברים ומשפחה' },
]

export default function Lobby() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const { loading, error, waitingCode, createRoom, joinRoom, cancelWaiting } = useRoom()

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    joinRoom(name, roomCode.trim().toUpperCase())
  }

  if (waitingCode) {
    return <WaitingView code={waitingCode} onCancel={cancelWaiting} />
  }

  return (
    <LobbyLayout>
      <Hero />

      {error && <ErrorBanner message={error} />}

      <div className="w-full max-w-2xl flex flex-col md:flex-row gap-4">
        <JoinCard
          name={name}
          roomCode={roomCode}
          loading={loading}
          onNameChange={setName}
          onRoomCodeChange={setRoomCode}
          onSubmit={handleJoin}
        />
        <CreateCard
          name={name}
          loading={loading}
          onNameChange={setName}
          onCreate={() => createRoom(name)}
        />
      </div>

      <div className="w-full max-w-2xl hidden md:grid grid-cols-3 gap-4 mt-2">
        {FEATURE_CARDS.map(({ icon, title, desc }) => (
          <FeatureCard key={title} icon={icon} title={title} desc={desc} />
        ))}
      </div>
    </LobbyLayout>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WaitingView({ code, onCancel }: { code: string; onCancel: () => void }) {
  return (
    <div className="lobby-bg min-h-screen flex flex-col items-center justify-center px-5 gap-6">
      <div className="lobby-card-purple rounded-3xl p-8 flex flex-col items-center gap-5 text-center w-full max-w-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">קוד החדר שלך</p>
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

function Hero() {
  return (
    <div className="flex flex-col items-center gap-3 text-center max-w-2xl">
      <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl overflow-hidden shadow-xl">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5UAANrg2DkcYlsLZYNmgZbbvWAOASTXGFdTMfwqdVhupouBUV-UJkYQe4shrK-c6hxlOF17SDSk3OXlbFlEP74vM8XAFh7wEfetSSnEeUNxIoZGj_9hmHrBCrwJ76wrCgK0QNIHaB1wQnZqXm-N5o9M9kepR9M9Rms6oVqd9noev7FV7Uxp1C4sPTIoBCgNX_thRN_Ve-EPTfQCPwBEcNbcb4xbi8MmWguXR3P1gd0ZIf5c8Vc0oMAOnMIn_P-WoO1uvhhfsSQaY"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface">מכירים אותי?</h1>
      <p className="text-sm md:text-base font-medium text-on-surface-variant max-w-md">
        בדקו כמה אתם באמת מכירים את החברים שלכם! ענו על שאלות, נחשו תשובות וגלו מי מכיר את מי.
      </p>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center w-full max-w-2xl">
      {message}
    </div>
  )
}

function JoinCard({
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

function CreateCard({
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

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/80 rounded-2xl p-4 flex flex-col items-center gap-2 text-center border border-outline/20">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm font-bold text-on-surface">{title}</p>
      <p className="text-xs text-on-surface-variant">{desc}</p>
    </div>
  )
}
