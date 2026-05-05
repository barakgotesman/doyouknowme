import { useState } from 'react'
import { useRoom } from '../hooks/useRoom'
import { useAudio } from '../hooks/useAudio'
import Hero from './lobby/Hero'
import WaitingView from './lobby/WaitingView'
import JoinCard from './lobby/JoinCard'
import CreateCard from './lobby/CreateCard'
import FeatureCard from './lobby/FeatureCard'
import { TrophyIcon, PinIcon, HeartIcon, UserIcon, CheckIcon } from './ui/Icons'

const FEATURE_CARDS = [
  { icon: <TrophyIcon className="w-7 h-7" />, title: 'תחרות חברים',  desc: 'גלו מי מכיר את מי טוב יותר בסיבוב מהנה',  color: 'tertiary'  as const },
  { icon: <PinIcon    className="w-7 h-7" />, title: 'שאלות מגוונות', desc: 'שאלות על העדפות, חלומות ואישיות',         color: 'secondary' as const },
  { icon: <HeartIcon  className="w-7 h-7" />, title: 'זמן איכות',    desc: 'חזקו את הקשר עם חברים ומשפחה',           color: 'primary'   as const },
]

/**
 * Home screen — lets a player create a new room or join an existing one.
 * After creating, transitions to WaitingView until the partner joins.
 * After joining, both players are navigated to /setup by useRoom.
 *
 * Name state is lifted here so both JoinCard and CreateCard share the same input field.
 */
export default function Lobby() {
  const [name, setName]         = useState('')
  const [roomCode, setRoomCode] = useState('')
  const { loading, error, waitingCode, createRoom, joinRoom, cancelWaiting } = useRoom()
  useAudio('lobby')

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    joinRoom(name, roomCode.trim().toUpperCase())
  }

  if (waitingCode) {
    return <WaitingView code={waitingCode} onCancel={cancelWaiting} />
  }

  return (
    <div className="flex-1 flex flex-col items-center px-5 md:px-10 pt-8 pb-6 gap-8">
      <Hero />

      {error && (
        <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center w-full max-w-2xl">
          {error}
        </div>
      )}

      {/* Step 1 — name entry, visually prominent so players know where to start */}
      <div className="w-full max-w-2xl flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-extrabold shrink-0">1</span>
          <span className="text-sm font-extrabold text-on-surface">מה שמך?</span>
        </div>
        <div className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 bg-surface-low transition-colors ${name.trim() ? 'border-primary' : 'border-outline'}`}>
          {/* User avatar icon */}
          <UserIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="הכנס את שמך..."
            dir="rtl"
            className="flex-1 bg-transparent outline-none text-base font-semibold text-on-surface placeholder:text-on-surface-variant/50"
          />
          {/* Checkmark appears once a name is entered */}
          {name.trim() && <CheckIcon className="w-5 h-5 text-primary shrink-0" />}
        </div>
      </div>

      {/* Step 2 — choose to create or join, dimmed until a name is entered */}
      <div className={`w-full max-w-2xl flex flex-col gap-3 transition-opacity ${name.trim() ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-extrabold shrink-0">2</span>
          <span className="text-sm font-extrabold text-on-surface">בחר פעולה</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
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
          onCreate={() => createRoom(name)}
        />
        </div>
      </div>

      <div className="w-full max-w-2xl hidden md:grid grid-cols-3 gap-4 mt-2">
        {FEATURE_CARDS.map(({ icon, title, desc, color }) => (
          <FeatureCard key={title} icon={icon} title={title} desc={desc} color={color} />
        ))}
      </div>
    </div>
  )
}
