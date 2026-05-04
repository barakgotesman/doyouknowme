import Timer from '../Timer'
import type { Question } from '../../types'
import { SilentIcon } from '../ui/Icons'

/**
 * Shown to the subject player while their partner is guessing about them.
 * They can see the question and the timer, but cannot interact — only the guesser can answer.
 * The Timer here is display-only; the guesser's Timer fires the actual timeout handler.
 */
export default function SubjectView({
  question, partnerName, startedAt,
}: {
  question: Question
  partnerName: string
  startedAt: string
}) {
  return (
    <div className="w-full max-w-lg flex flex-col gap-5">
      <div className="flex justify-center">
        <Timer startedAt={startedAt} totalSeconds={20} onExpire={() => {/* guesser handles timeout */}} />
      </div>

      <div className="lobby-card-yellow rounded-3xl p-6 flex flex-col gap-4 text-center">
        <div className="flex justify-center">
          <SilentIcon className="w-12 h-12 text-primary" />
        </div>
        <p className="text-sm font-bold text-on-surface">
          {partnerName || 'חבר/ה'} מנחש/ת עכשיו...
        </p>
        <div className="bg-surface-low rounded-2xl p-4">
          <p className="text-xs font-bold text-on-surface-variant mb-1">השאלה עליך:</p>
          <p className="text-base font-extrabold text-on-surface">{question.text}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-on-surface-variant">ממתין לתשובה...</span>
        </div>
      </div>
    </div>
  )
}
