import type { Question, PlayerRole } from '../../types'

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
  // Determine whose answers were being guessed to label the question correctly
  const subjectName = subjectRole === myRole ? myName : partnerName

  // Build the result banner text depending on who I am and what happened
  const resultText = isAnswering
    ? (isCorrect ? '✅ נכון! +1 נקודה' : submittedAnswer ? '❌ לא נכון' : '⏱ פג הזמן!')
    : (isCorrect ? `✅ ${partnerName} צדק/ה!` : submittedAnswer ? `❌ ${partnerName} טעה/תה` : `⏱ ${partnerName} לא הספיק/ה`)

  return (
    <div className="w-full max-w-lg flex flex-col gap-5">
      {/* Coloured result banner */}
      <div className={`rounded-2xl p-4 text-center font-extrabold text-base ${
        isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
      }`}>
        {resultText}
      </div>

      <div className="lobby-card-purple rounded-3xl p-6 flex flex-col gap-4">
        <div className="text-center">
          <p className="text-xs font-bold text-on-surface-variant mb-1">השאלה על {subjectName}:</p>
          <p className="text-base font-extrabold text-on-surface">{question.text}</p>
        </div>

        <div className="flex flex-col gap-2">
          {question.options.map(option => {
            // Apply green/red highlight to indicate correct and wrong picks
            const isCorrectOption  = option === correctAnswer
            const isSubmittedWrong = option === submittedAnswer && !isCorrect

            let className = 'answer-option w-full py-3 px-4 rounded-xl text-sm font-bold text-right'
            if (isCorrectOption)  className = 'answer-option-correct w-full py-3 px-4 rounded-xl text-sm font-bold text-right'
            if (isSubmittedWrong) className = 'answer-option-wrong w-full py-3 px-4 rounded-xl text-sm font-bold text-right'

            return (
              <div key={option} className={className} dir="rtl">
                {option}
                {isCorrectOption  && ' ✓'}
                {isSubmittedWrong && ' ✗'}
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-on-surface-variant">עובר לסיבוב הבא בעוד שנייה...</p>
      </div>
    </div>
  )
}
