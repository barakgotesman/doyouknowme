/**
 * Sticky top bar showing both players' names, their current scores, and the round counter.
 * Always visible during gameplay so players can track progress at a glance.
 */
export default function ScoreHeader({
  myName, partnerName, myScore, partnerScore, roundNumber,
}: {
  myName: string
  partnerName: string
  myScore: number
  partnerScore: number
  roundNumber: number
}) {
  return (
    <header className="flex items-center justify-between px-5 py-4 bg-white/70 backdrop-blur-sm border-b border-outline/30">
      {/* My score — left side */}
      <div className="flex flex-col items-start">
        <span className="text-xs font-bold text-on-surface-variant">{myName || 'אתה'}</span>
        <span className="text-2xl font-extrabold text-primary">{myScore}</span>
      </div>

      {/* Round badge — centre */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-on-surface-variant">סיבוב</span>
        <span className="text-lg font-extrabold text-on-surface">{roundNumber}/20</span>
      </div>

      {/* Partner score — right side */}
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-on-surface-variant">{partnerName || 'חבר/ה'}</span>
        <span className="text-2xl font-extrabold text-primary">{partnerScore}</span>
      </div>
    </header>
  )
}
