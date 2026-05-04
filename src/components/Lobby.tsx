import { useState } from 'react'
import { useRoom } from '../hooks/useRoom'
import { useAudio } from '../hooks/useAudio'
import Hero from './lobby/Hero'
import WaitingView from './lobby/WaitingView'
import JoinCard from './lobby/JoinCard'
import CreateCard from './lobby/CreateCard'
import FeatureCard from './lobby/FeatureCard'
import { TrophyIcon, PinIcon, HeartIcon } from './ui/Icons'

const FEATURE_CARDS = [
  { icon: <TrophyIcon className="w-7 h-7" />, title: 'תחרות חברים', desc: 'גלו מי מכיר את מי טוב יותר בסיבוב מהנה' },
  { icon: <PinIcon    className="w-7 h-7" />, title: 'שאלות מגוונות', desc: 'שאלות על העדפות, חלומות ואישיות' },
  { icon: <HeartIcon  className="w-7 h-7" />, title: 'זמן איכות', desc: 'חזקו את הקשר עם חברים ומשפחה' },
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

      <div className="w-full max-w-2xl flex flex-col gap-1">
        <label className="text-xs font-bold text-on-surface-variant">מה שמך?</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="הכנס את שמך..."
          dir="rtl"
          className="game-input w-full rounded-xl py-3 px-4 text-sm font-medium"
        />
      </div>

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
          onCreate={() => createRoom(name)}
        />
      </div>

      <div className="w-full max-w-2xl hidden md:grid grid-cols-3 gap-4 mt-2">
        {FEATURE_CARDS.map(({ icon, title, desc }) => (
          <FeatureCard key={title} icon={icon} title={title} desc={desc} />
        ))}
      </div>
    </div>
  )
}
