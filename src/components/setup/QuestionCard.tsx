/**
 * Card displaying the current setup question and its multiple-choice answer buttons.
 * Buttons are disabled while the previous answer is being saved, preventing double-taps.
 */
export default function QuestionCard({
  question, options, saving, onAnswer,
}: {
  question: string
  options: string[]
  saving: boolean
  onAnswer: (answer: string) => void
}) {
  return (
    <div className="lobby-card-purple rounded-3xl p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <span className="text-3xl">🤔</span>
        <h2 className="text-lg font-extrabold text-on-surface leading-snug">{question}</h2>
        <p className="text-xs text-on-surface-variant">ענה על עצמך — חברך ינחש בהמשך</p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onAnswer(option)}
            disabled={saving}
            className="btn-outline w-full py-3 px-4 rounded-xl text-sm font-bold text-right transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            dir="rtl"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
