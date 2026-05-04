import { useSetup } from '../hooks/useSetup'
import { useAudio } from '../hooks/useAudio'
import LoadingScreen from './ui/LoadingScreen'
import ErrorScreen from './ui/ErrorScreen'
import PlayersStatusBar from './setup/PlayersStatusBar'
import ProgressHeader from './setup/ProgressHeader'
import QuestionCard from './setup/QuestionCard'
import WaitingScreen from './setup/WaitingScreen'

const TOTAL_QUESTIONS = 10

/**
 * Setup screen — shown after the lobby before the game begins.
 * Each player independently answers 10 questions about themselves.
 * Once both players finish, the game starts automatically via a Realtime broadcast.
 *
 * All setup logic (question fetching, answer saving, progress sync) lives in useSetup.
 * This component is purely presentational routing.
 */
export default function Setup() {
  const {
    questions, currentIndex, loading, saving, error, done,
    myStatus, partnerStatus, submitAnswer,
  } = useSetup()
  useAudio('setup')

  if (loading) return <LoadingScreen message="טוען שאלות..." />
  if (error)   return <ErrorScreen message={error} />
  if (done)    return <WaitingScreen myStatus={myStatus} partnerStatus={partnerStatus} />

  const question = questions[currentIndex]

  // Progress 0–100, consumed by ProgressHeader to drive the animated bar width
  const progress = (currentIndex / TOTAL_QUESTIONS) * 100

  return (
    <div className="flex-1 flex flex-col items-center px-5 md:px-10 pt-8 pb-6 gap-8">
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Live status bar — updates in real-time via Realtime broadcasts */}
        <PlayersStatusBar myStatus={myStatus} partnerStatus={partnerStatus} />

        <ProgressHeader current={currentIndex + 1} total={TOTAL_QUESTIONS} progress={progress} />

        <QuestionCard
          question={question.text}
          options={question.options}
          saving={saving}
          onAnswer={submitAnswer}
        />
      </div>
    </div>
  )
}
