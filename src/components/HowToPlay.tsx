import { Link } from 'react-router-dom'
import { useAudio } from '../hooks/useAudio'
import { TrophyIcon, KeyIcon, SmileIcon, CheckIcon, HeartIcon, BrainIcon } from './ui/Icons'

/** A single numbered step card in the how-to-play guide. */
function Step({ number, icon, title, desc }: { number: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-extrabold">{number}</span>
        <div className="w-px flex-1 bg-outline/30" />
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-primary">{icon}</span>
          <p className="font-extrabold text-on-surface">{title}</p>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/**
 * Static "How to Play" page explaining the game flow step by step.
 * Purely presentational — no DB or Realtime interaction.
 */
export default function HowToPlay() {
  useAudio('lobby')

  return (
    <div className="flex-1 flex flex-col items-center px-5 md:px-10 pt-8 pb-10 gap-8">
      {/* Page title */}
      <div className="text-center max-w-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-2">איך משחקים?</h1>
        <p className="text-sm md:text-base text-on-surface-variant">
          המדריך המהיר לשחק במכירים אותי עם חבר
        </p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-lg">
        <Step
          number={1}
          icon={<SmileIcon className="w-5 h-5" />}
          title="הכנסו שם ופתחו חדר"
          desc="שחקן ראשון מזין שם ולוחץ על 'צור משחק'. מתקבל קוד חדר בן 4 אותיות לשתף לחבר."
        />
        <Step
          number={2}
          icon={<KeyIcon className="w-5 h-5" />}
          title="החבר מצטרף עם הקוד"
          desc="השחקן השני פותח את האתר, מזין שם ואת קוד החדר — ומצטרף למשחק."
        />
        <Step
          number={3}
          icon={<BrainIcon className="w-5 h-5" />}
          title="כל אחד עונה על 10 שאלות על עצמו"
          desc="בשלב ההכנה, כל שחקן עונה לבד על 10 שאלות אישיות. התשובות נשמרות בסתר."
        />
        <Step
          number={4}
          icon={<CheckIcon className="w-5 h-5" />}
          title="נחשו את תשובות החבר"
          desc="20 סיבובים בסך הכל — כל סיבוב אחד השחקנים מנחש את תשובת החבר בתוך 20 שניות."
        />
        <Step
          number={5}
          icon={<TrophyIcon className="w-5 h-5" />}
          title="גלו את הציון הסופי"
          desc="בסוף רואים את פירוט כל התשובות ומי הכיר את מי יותר טוב. תוכלו גם לשחק שוב!"
        />
      </div>

      {/* Scoring legend */}
      <div className="w-full max-w-lg bg-surface-low rounded-2xl p-5 flex flex-col gap-3">
        <p className="font-extrabold text-on-surface flex items-center gap-2">
          <HeartIcon className="w-5 h-5 text-primary" />
          דרגות ידידות
        </p>
        {[
          { range: '18–20', label: 'נשמות תאומות' },
          { range: '14–17', label: 'חברים מעולים' },
          { range: '10–13', label: 'חברים טובים' },
          { range: '6–9',  label: 'מכרים' },
          { range: '0–5',  label: 'זרים' },
        ].map(({ range, label }) => (
          <div key={range} className="flex justify-between text-sm">
            <span className="font-semibold text-on-surface">{label}</span>
            <span className="text-on-surface-variant">{range} נקודות</span>
          </div>
        ))}
      </div>

      {/* CTA back to home */}
      <Link
        to="/"
        className="btn-primary px-8 py-3 rounded-full text-sm font-bold"
      >
        יאללה, נתחיל לשחק
      </Link>
    </div>
  )
}
