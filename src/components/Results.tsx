import { useResults, scoreLabel, type PlayAgainStatus } from '../hooks/useResults'
import { useAudio } from '../hooks/useAudio'
import LoadingScreen from './ui/LoadingScreen'
import ErrorScreen from './ui/ErrorScreen'
import { RefreshIcon, HomeIcon, ClockIcon, CheckIcon, XIcon, LightbulbIcon } from './ui/Icons'

/**
 * Renders the play-again action area based on the current negotiation state.
 * Both players must agree before the game resets.
 */
function PlayAgainPanel({
  status, partnerName, onRequest, onCancel, onConfirm, onDecline, onNewGame,
}: {
  status: PlayAgainStatus
  partnerName: string
  onRequest: () => void
  onCancel: () => void
  onConfirm: () => void
  onDecline: () => void
  onNewGame: () => void
}) {
  if (status === 'idle') {
    return (
      <div className="w-full flex gap-3">
        <button onClick={onRequest} className="btn-primary flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
          <RefreshIcon className="w-4 h-4" /> שחק שוב
        </button>
        <button onClick={onNewGame} className="btn-secondary-custom flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
          <HomeIcon className="w-4 h-4" /> משחק חדש
        </button>
      </div>
    )
  }

  if (status === 'waiting') {
    return (
      <div className="w-full lobby-card rounded-2xl p-4 text-center flex flex-col gap-2">
        <p className="text-sm font-bold text-on-surface flex items-center justify-center gap-2">
          <ClockIcon className="w-4 h-4 animate-spin" />
          ממתין לתגובת {partnerName}...
        </p>
        <button onClick={onCancel} className="btn-secondary-custom py-2 rounded-xl text-xs font-bold">
          בטל בקשה
        </button>
      </div>
    )
  }

  if (status === 'requested') {
    return (
      <div className="w-full lobby-card-purple rounded-2xl p-4 text-center flex flex-col gap-3">
        <p className="text-sm font-bold text-on-surface flex items-center justify-center gap-2">
          <RefreshIcon className="w-4 h-4" />
          {partnerName} רוצה לשחק שוב!
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-primary flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1">
            <CheckIcon className="w-4 h-4" /> אשר
          </button>
          <button onClick={onDecline} className="btn-secondary-custom flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1">
            <XIcon className="w-4 h-4" /> לא תודה
          </button>
        </div>
      </div>
    )
  }

  // declined
  return (
    <div className="w-full flex flex-col gap-3">
      <p className="text-center text-sm text-on-surface-variant">המשחק הסתיים</p>
      <button onClick={onNewGame} className="btn-primary w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
        <HomeIcon className="w-4 h-4" /> משחק חדש
      </button>
    </div>
  )
}

/**
 * Results screen — shown to both players after all 20 rounds complete.
 * Displays individual scores, a combined score with a label, and a full round breakdown.
 */
export default function Results() {
  useAudio('results')

  const {
    loading, error,
    myName, partnerName,
    myScore, partnerScore,
    rounds,
    playerRole,
    playAgainStatus,
    requestPlayAgain,
    cancelPlayAgain,
    confirmPlayAgain,
    declinePlayAgain,
    newGame,
  } = useResults()

  if (loading) return <LoadingScreen message="טוען תוצאות..." />
  if (error)   return <ErrorScreen message={error} />

  const combined = myScore + partnerScore
  const label    = scoreLabel(combined)

  // "X knew Y" phrasing depends on who was guessing whom
  // My score = rounds I guessed correctly about my partner
  // Partner score = rounds they guessed correctly about me
  const iAmA = playerRole === 'A'
  // Player A guesses about B (even rounds), Player B guesses about A (odd rounds)
  const aKnewB = iAmA ? myScore    : partnerScore
  const bKnewA = iAmA ? partnerScore : myScore
  const nameA  = iAmA ? myName : partnerName
  const nameB  = iAmA ? partnerName : myName

  return (
    <div className="flex-1 flex flex-col items-center px-5 py-8 gap-6 max-w-lg mx-auto w-full" dir="rtl">

      {/* ── Combined score hero ───────────────────────────────────────────── */}
      <div className="lobby-card-purple rounded-3xl p-6 w-full text-center flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">אתם מכירים אחד את השני</p>
        <p className="text-6xl font-extrabold text-on-surface"><span>{combined}</span><span className="text-2xl text-on-surface-variant">/20</span></p>
        <p className="text-lg font-bold text-primary">{label}</p>
      </div>

      {/* ── Individual scores ─────────────────────────────────────────────── */}
      <div className="w-full flex gap-3">
        <div className="lobby-card flex-1 rounded-2xl p-4 text-center flex flex-col gap-1">
          <p className="text-xs font-bold text-on-surface-variant">{nameA} הכיר/ה את {nameB}</p>
          <p className="text-3xl font-extrabold text-primary"><span>{aKnewB}</span><span className="text-base text-on-surface-variant">/10</span></p>
        </div>
        <div className="lobby-card flex-1 rounded-2xl p-4 text-center flex flex-col gap-1">
          <p className="text-xs font-bold text-on-surface-variant">{nameB} הכיר/ה את {nameA}</p>
          <p className="text-3xl font-extrabold text-primary"><span>{bKnewA}</span><span className="text-base text-on-surface-variant">/10</span></p>
        </div>
      </div>

      {/* ── Actions — play-again negotiation ─────────────────────────────── */}
      <PlayAgainPanel
        status={playAgainStatus}
        partnerName={partnerName}
        onRequest={requestPlayAgain}
        onCancel={cancelPlayAgain}
        onConfirm={confirmPlayAgain}
        onDecline={declinePlayAgain}
        onNewGame={newGame}
      />

      {/* ── Round breakdown ───────────────────────────────────────────────── */}
      <div className="w-full flex flex-col gap-2">
        <p className="text-sm font-bold text-on-surface-variant">פירוט סיבובים</p>

        {rounds.map(r => (
          <div
            key={r.id ?? r.roundNumber}
            className={`lobby-card rounded-2xl p-4 flex flex-col gap-2 border-r-4 ${r.isCorrect ? 'border-green-400' : 'border-red-400'}`}
          >
            {/* Question + round number */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-on-surface leading-snug flex-1">{r.questionText}</p>
              <span className="text-xs text-on-surface-variant shrink-0">#{r.roundNumber}</span>
            </div>

            {/* Subject label */}
            <p className="text-xs text-on-surface-variant">
              על <span className="font-bold">{r.subjectName}</span> — ניחש/ה <span className="font-bold">{r.guesserName}</span>
            </p>

            {/* Answers */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {r.isCorrect
                  ? <CheckIcon className="w-4 h-4 text-green-500 shrink-0" />
                  : <XIcon     className="w-4 h-4 text-red-400 shrink-0" />
                }
                <span className="text-xs text-on-surface-variant">ניחוש:</span>
                <span className="text-xs font-bold text-on-surface">
                  {r.submittedAnswer ?? 'לא ענה/תה (פג הזמן)'}
                </span>
              </div>
              {!r.isCorrect && (
                <div className="flex items-center gap-2">
                  <LightbulbIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-on-surface-variant">תשובה נכונה:</span>
                  <span className="text-xs font-bold text-green-600">{r.correctAnswer}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
