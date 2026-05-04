import { useGame } from '../hooks/useGame'
import { useAudio } from '../hooks/useAudio'
import LoadingScreen from './ui/LoadingScreen'
import ErrorScreen from './ui/ErrorScreen'
import ScoreHeader from './game/ScoreHeader'
import AnsweringView from './game/AnsweringView'
import SubjectView from './game/SubjectView'
import RevealedView from './game/RevealedView'

/**
 * Main game screen. Orchestrates which view to render based on the current round phase:
 *   - Answering  → I am the guesser; see question + options + timer
 *   - Subject    → I am being asked about; see "friend is guessing" + timer
 *   - Revealed   → round over; both players see the correct answer + result
 *
 * All game logic lives in useGame — this component is purely presentational routing.
 */
export default function GameRound() {
  useAudio('gameplay')

  const {
    loading, error,
    roundNumber, phase, subjectRole, isAnswering,
    question, correctAnswer, submittedAnswer, isCorrect, startedAt,
    myName, partnerName, myRole,
    myScore, partnerScore,
    submitAnswer, handleTimeout,
  } = useGame()

  if (loading) return <LoadingScreen message="טוען משחק..." />
  if (error)   return <ErrorScreen message={error} />
  if (!question || phase === 'loading') return <LoadingScreen message="טוען משחק..." />

  return (
    <>
      {/* Scoreboard always visible at the top */}
      <ScoreHeader
        myName={myName}
        partnerName={partnerName}
        myScore={myScore}
        partnerScore={partnerScore}
        roundNumber={roundNumber}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-5">
        {/* Route to the correct view for the current phase + role */}
        {phase === 'revealed' ? (
          <RevealedView
            question={question}
            correctAnswer={correctAnswer}
            submittedAnswer={submittedAnswer}
            isCorrect={isCorrect}
            isAnswering={isAnswering}
            partnerName={partnerName}
            subjectRole={subjectRole}
            myRole={myRole}
            myName={myName}
          />
        ) : isAnswering ? (
          <AnsweringView
            question={question}
            startedAt={startedAt!}
            onAnswer={submitAnswer}
            onTimeout={handleTimeout}
          />
        ) : (
          <SubjectView
            question={question}
            partnerName={partnerName}
            startedAt={startedAt!}
          />
        )}
      </div>
    </>
  )
}
