import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { useAudio } from '../hooks/useAudio'
import { resolvePhase } from '../lib/gameUtils'
import { supabase } from '../lib/supabase'
import Hero from '../components/lobby/Hero'
import WaitingView from '../components/lobby/WaitingView'
import JoinCard from '../components/lobby/JoinCard'
import CreateCard from '../components/lobby/CreateCard'
import FeatureCard from '../components/lobby/FeatureCard'
import AuthEntry from '../components/lobby/AuthEntry'
import { TrophyIcon, PinIcon, HeartIcon, KeyIcon } from '../components/ui/Icons'

const FEATURE_CARDS = [
  { icon: <TrophyIcon className="w-7 h-7" />, title: 'תחרות חברים',  desc: 'גלו מי מכיר את מי טוב יותר בסיבוב מהנה',  color: 'tertiary'  as const },
  { icon: <PinIcon    className="w-7 h-7" />, title: 'שאלות מגוונות', desc: 'שאלות על העדפות, חלומות ואישיות',         color: 'secondary' as const },
  { icon: <HeartIcon  className="w-7 h-7" />, title: 'זמן איכות',    desc: 'חזקו את הקשר עם חברים ומשפחה',           color: 'primary'   as const },
]

interface Props {
  /** When true, the player has an active game — hide create/join UI and show "back to game" card. */
  hasActiveSession: boolean
  /** Called after the player cancels their waiting room so the parent can reset hasActiveSession. */
  onSessionCleared?: () => void
}

/**
 * Home screen — lets a player create a new room or join an existing one.
 * After creating, transitions to WaitingView until the partner joins.
 * After joining, both players are navigated to /setup by useRoom.
 *
 * When hasActiveSession is true (an ongoing game exists in sessionStorage), the
 * create/join section is replaced with a "back to game" card so the player can
 * return to the correct phase without accidentally starting a new game.
 *
 * Name state is lifted here so AuthEntry, JoinCard and CreateCard share it.
 */
export default function Lobby({ hasActiveSession, onSessionCleared }: Props) {
  const [name, setName]         = useState('')
  const [roomCode, setRoomCode] = useState('')
  // tracks whether AuthEntry is still in the 'choosing' or 'loading' state
  // so we can hide Step 2 until the player has committed to an auth path
  const [authReady, setAuthReady] = useState(false)
  // Error message shown when a ?join= link points to an invalid or unavailable room
  const [joinLinkError, setJoinLinkError] = useState<string | null>(null)
  // When set, the player arrived via a share link — show simplified join-only UI
  const [joinLinkCode, setJoinLinkCode] = useState<string | null>(null)
  const { loading, error, waitingCode, createRoom, joinRoom, cancelWaiting, restoreWaiting } = useRoom()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  useAudio('lobby')

  /**
   * Validates the ?join=CODE query param on mount.
   * Covers five cases:
   *   1. Player A arriving via their own share link → restore waiting view
   *   2. Player with a session for a DIFFERENT room → ignore (SessionRestorer wins)
   *   3. Room not found → show error banner
   *   4. Room no longer waiting (started/abandoned) → show descriptive error
   *   5. Valid waiting room, no session → pre-fill code so guest just enters name
   */
  useEffect(() => {
    const joinCode = searchParams.get('join')?.toUpperCase()
    if (!joinCode) return

    // Remove from URL immediately so refresh doesn't re-run this
    setSearchParams({}, { replace: true })

    const sessionRoomCode = sessionStorage.getItem('room_code')

    // Case 2: active session for a different room — don't interfere
    if (sessionRoomCode && sessionRoomCode !== joinCode) return

    // Case 1: this player already owns this room (Player A using their own link)
    if (sessionRoomCode === joinCode) {
      restoreWaiting(joinCode)
      return
    }

    // Cases 3 & 4: no session — validate room status from DB before pre-filling
    supabase
      .from('rooms')
      .select('status')
      .eq('code', joinCode)
      .maybeSingle()
      .then(({ data: room }) => {
        if (!room) {
          setJoinLinkError('הקישור לא תקף — החדר לא נמצא.')
          return
        }
        if (room.status === 'abandoned') {
          setJoinLinkError('החדר נסגר ולא ניתן להצטרף אליו יותר.')
          return
        }
        if (room.status !== 'waiting') {
          setJoinLinkError('המשחק כבר התחיל — לא ניתן להצטרף כעת.')
          return
        }
        // Case 5: valid waiting room — enter simplified join-only mode
        setRoomCode(joinCode)
        setJoinLinkCode(joinCode)
      })
  }, [])

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    joinRoom(name, roomCode.trim().toUpperCase())
  }

  /** Resolves the live game phase and navigates to the correct screen. */
  async function handleReturnToGame() {
    const roomCode = sessionStorage.getItem('room_code')
    if (!roomCode) return
    const result = await resolvePhase(roomCode)
    if (!result) return
    const { phase } = result
    // For 'waiting' we can't navigate to '/' since Lobby is already mounted there —
    // the mount effect in useRoom wouldn't re-run. Call restoreWaiting directly instead.
    if (phase === 'waiting')       restoreWaiting(roomCode)
    else if (phase === 'setup')    navigate('/setup')
    else if (phase === 'playing')  navigate('/game')
    else if (phase === 'finished') navigate('/results')
  }

  if (waitingCode) {
    return (
      <WaitingView
        code={waitingCode}
        onCancel={async () => {
          await cancelWaiting()
          // Reset parent's hasActiveSession so the "back to game" card doesn't flash after cancel
          onSessionCleared?.()
        }}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center px-5 md:px-10 pt-8 pb-6 gap-8">
      <Hero />

      {(error || joinLinkError) && (
        <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center w-full max-w-2xl">
          {joinLinkError ?? error}
        </div>
      )}

      {hasActiveSession ? (
        /* Active game in progress — replace create/join section with a return card */
        <div className="w-full max-w-2xl card-surface flex flex-col items-center gap-4 py-8 px-6">
          {/* Pulsing indicator to communicate the game is live */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
          </span>
          <p className="text-base font-bold text-on-surface text-center">יש לך משחק פעיל</p>
          <p className="text-sm text-on-surface-variant text-center">המשחק שלך ממתין לך. לחץ כדי לחזור אליו.</p>
          <button
            onClick={handleReturnToGame}
            className="btn-primary w-full max-w-xs py-3 text-base font-extrabold rounded-2xl"
          >
            חזרה למשחק
          </button>
        </div>

      ) : joinLinkCode ? (
        /* Simplified join-only view — shown when arriving via a valid ?join= share link */
        <form
          onSubmit={handleJoin}
          className="w-full max-w-sm card-surface flex flex-col items-center gap-6 py-8 px-6 rounded-3xl"
        >
          {/* Room badge */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <KeyIcon className="w-7 h-7 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">הצטרפות למשחק</p>
            <p className="text-3xl font-extrabold tracking-[0.2em] text-primary">{joinLinkCode}</p>
          </div>

          {/* Auth + name — same component as main lobby, includes guest/Google choice */}
          <div className="w-full flex flex-col gap-2">
            <label className="text-sm font-extrabold text-on-surface">מה שמך?</label>
            <AuthEntry
              name={name}
              onNameChange={setName}
              onReady={() => setAuthReady(true)}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="btn-primary w-full py-3 rounded-2xl font-extrabold text-base disabled:opacity-50"
          >
            {loading ? '...' : 'הצטרף למשחק'}
          </button>
        </form>

      ) : (
        <>
          {/* Step 1 — auth choice / name entry */}
          <div className="w-full max-w-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-extrabold shrink-0">1</span>
              <span className="text-sm font-extrabold text-on-surface">כיצד תרצה להמשיך?</span>
            </div>
            <AuthEntry
              name={name}
              onNameChange={setName}
              onReady={() => setAuthReady(true)}
            />
          </div>

          {/* Step 2 — create or join, hidden until auth path is chosen, dimmed until name filled */}
          <div className={`w-full max-w-2xl flex flex-col gap-3 transition-opacity ${!authReady ? 'opacity-40 pointer-events-none' : name.trim() ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
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
        </>
      )}
    </div>
  )
}
