import Timer from './Timer'
import type { Question } from '../../types'

/**
 * Shown to the guesser — they see the question, answer options, and an optional countdown timer.
 * Tapping an option immediately submits the answer (no confirm step).
 * When timerEnabled is false, no timer is shown and onTimeout is never called automatically.
 */
export default function AnsweringView({
  question, startedAt, onAnswer, onTimeout, timerEnabled = true, timerSeconds = 20,
}: {
  question: Question
  startedAt: string
  onAnswer: (answer: string) => void
  onTimeout: () => void
  timerEnabled?: boolean
  timerSeconds?: number
}) {
  return (
    <div className="w-full max-w-lg flex flex-col gap-5">
      {/* Timer shown only when the host enabled it */}
      {timerEnabled && (
        <div className="flex justify-center">
          <Timer startedAt={startedAt} totalSeconds={timerSeconds} onExpire={onTimeout} />
        </div>
      )}

      <div className="lobby-card-purple rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">נחש!</p>
          <h2 className="text-lg font-extrabold text-on-surface leading-snug">{question.text}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {question.options.map(option => (
            <button
              key={option}
              onClick={() => onAnswer(option)}
              className="answer-option w-full py-3 px-4 rounded-xl text-sm font-bold text-right"
              dir="rtl"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
