import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Card displaying the current setup question and its multiple-choice answer buttons.
 * Uses the animated rainbow border via the question-card-animated CSS class.
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
    <Card className="question-card-animated rounded-3xl">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-3xl">🤔</span>
          <h2 className="text-lg font-extrabold text-foreground leading-snug">{question}</h2>
          <p className="text-xs text-muted-foreground">ענה על עצמך — חברך ינחש בהמשך</p>
        </div>

        <div className="flex flex-col gap-3">
          {options.map(option => (
            <Button
              key={option}
              variant="brandOutline"
              size="game"
              onClick={() => onAnswer(option)}
              disabled={saving}
              dir="rtl"
              className="text-right justify-end"
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
