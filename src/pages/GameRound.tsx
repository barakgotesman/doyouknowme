import { useGame } from '../hooks/useGame'
import { useAudio } from '../hooks/useAudio'
import LoadingScreen from '../components/shared/LoadingScreen'
import ErrorScreen from '../components/shared/ErrorScreen'
import LeaveGameButton from '../components/shared/LeaveGameButton'
import ScoreHeader from '../components/game/ScoreHeader'
import ReactionBar from '../components/shared/ReactionBar'
import AnsweringView from '../components/game/AnsweringView'
import SubjectView from '../components/game/SubjectView'
import RevealedView from '../components/game/RevealedView'

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
    submitAnswer, handleTimeout, leaveGame,
    sendReaction, myReaction, partnerReaction, onCooldown,
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
        myReaction={myReaction}
        partnerReaction={partnerReaction}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-5 pb-2">
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

        {/* Emoji reaction bar — always visible so players can react at any moment */}
        <ReactionBar onReact={sendReaction} onCooldown={onCooldown} />

        <LeaveGameButton partnerName={partnerName} />
      </div>
    </>
  )
}
