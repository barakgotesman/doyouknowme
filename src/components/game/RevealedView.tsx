import type { Question, PlayerRole } from '../../types'
import { CheckIcon, XIcon, ClockIcon } from '../ui/Icons'

/**
 * Shown to BOTH players after an answer is submitted or a timeout fires.
 * Highlights the correct answer in green; the wrong pick (if any) in red.
 * Displays a contextual result message based on whether I was the guesser or subject.
 */
export default function RevealedView({
  question, correctAnswer, submittedAnswer, isCorrect, isAnswering,
  partnerName, subjectRole, myRole, myName,
}: {
  question: Question
  correctAnswer: string
  submittedAnswer: string | null
  isCorrect: boolean | null
  isAnswering: boolean
  partnerName: string
  subjectRole: PlayerRole
  myRole: PlayerRole
  myName: string
}) {
  const subjectName = subjectRole === myRole ? myName : partnerName

  const isTimeout = !submittedAnswer

  return (
    <div className="w-full max-w-lg flex flex-col gap-5">
      {/* Result banner */}
      <div className={`rounded-2xl p-4 flex items-center justify-center gap-2 font-extrabold text-base ${
        isCorrect ? 'bg-green-50 text-green-700 border border-green-200'
        : isTimeout ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-red-50 text-red-700 border border-red-200'
      }`}>
        {isTimeout
          ? <><ClockIcon className="w-5 h-5" /><span>{isAnswering ? 'פג הזמן!' : `${partnerName} לא הספיק/ה`}</span></>
          : isCorrect
            ? <><CheckIcon className="w-5 h-5" /><span>{isAnswering ? 'נכון! +1 נקודה' : `${partnerName} צדק/ה!`}</span></>
            : <><XIcon className="w-5 h-5" /><span>{isAnswering ? 'לא נכון' : `${partnerName} טעה/תה`}</span></>
        }
      </div>

      <div className="lobby-card-purple rounded-3xl p-6 flex flex-col gap-4">
        <div className="text-center">
          <p className="text-xs font-bold text-on-surface-variant mb-1">השאלה על {subjectName}:</p>
          <p className="text-base font-extrabold text-on-surface">{question.text}</p>
        </div>

        <div className="flex flex-col gap-2">
          {question.options.map(option => {
            const isCorrectOption  = option === correctAnswer
            const isSubmittedWrong = option === submittedAnswer && !isCorrect

            let className = 'answer-option w-full py-3 px-4 rounded-xl text-sm font-bold text-right'
            if (isCorrectOption)  className = 'answer-option-correct w-full py-3 px-4 rounded-xl text-sm font-bold text-right'
            if (isSubmittedWrong) className = 'answer-option-wrong w-full py-3 px-4 rounded-xl text-sm font-bold text-right'

            return (
              <div key={option} className={`${className} flex items-center justify-between`} dir="rtl">
                <span>{option}</span>
                {isCorrectOption  && <CheckIcon className="w-4 h-4 text-green-600 shrink-0" />}
                {isSubmittedWrong && <XIcon     className="w-4 h-4 text-red-500 shrink-0" />}
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-on-surface-variant">עובר לסיבוב הבא בעוד שנייה...</p>
      </div>
    </div>
  )
}
