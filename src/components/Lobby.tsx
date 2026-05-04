import { useState } from 'react'
import { useRoom } from '../hooks/useRoom'
import LobbyLayout from '../layouts/LobbyLayout'
import Hero from './lobby/Hero'
import WaitingView from './lobby/WaitingView'
import JoinCard from './lobby/JoinCard'
import CreateCard from './lobby/CreateCard'
import FeatureCard from './lobby/FeatureCard'

const FEATURE_CARDS = [
  { icon: '🏆', title: 'תחרות חברים', desc: 'גלו מי מכיר את מי טוב יותר בסיבוב מהנה' },
  { icon: '📍', title: 'שאלות מגוונות', desc: 'שאלות על העדפות, חלומות ואישיות' },
  { icon: '💜', title: 'זמן איכות', desc: 'חזקו את הקשר עם חברים ומשפחה' },
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

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    joinRoom(name, roomCode.trim().toUpperCase())
  }

  // Once Player A creates a room, swap to the waiting screen until Partner joins
  if (waitingCode) {
    return <WaitingView code={waitingCode} onCancel={cancelWaiting} />
  }

  return (
    <LobbyLayout>
      <Hero />

      {/* Show inline error banner above the cards (e.g. "room not found") */}
      {error && (
        <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center w-full max-w-2xl">
          {error}
        </div>
      )}

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

      {/* Feature cards are hidden on mobile to keep the lobby clean */}
      <div className="w-full max-w-2xl hidden md:grid grid-cols-3 gap-4 mt-2">
        {FEATURE_CARDS.map(({ icon, title, desc }) => (
          <FeatureCard key={title} icon={icon} title={title} desc={desc} />
        ))}
      </div>
    </LobbyLayout>
  )
}
