/**
 * Sticky top bar showing both players' names, scores, and the round counter.
 * When a reaction emoji is active for a player, it pops up above their name card.
 */
export default function ScoreHeader({
  myName, partnerName, myScore, partnerScore, roundNumber,
  myReaction, partnerReaction,
}: {
  myName: string
  partnerName: string
  myScore: number
  partnerScore: number
  roundNumber: number
  myReaction?: string | null
  partnerReaction?: string | null
}) {
  return (
    <header className="flex items-center justify-between px-5 py-4 bg-white/70 backdrop-blur-sm border-b border-outline/30">
      {/* My score — left side */}
      <div className="relative flex flex-col items-start">
        {/* Reaction bubble floats above the name */}
        {myReaction && (
          <span className="absolute -top-7 left-0 text-2xl animate-pop" key={myReaction + Date.now()}>
            {myReaction}
          </span>
        )}
        <span className="text-xs font-bold text-on-surface-variant">{myName || 'אתה'}</span>
        <span className="text-2xl font-extrabold text-primary">{myScore}</span>
      </div>

      {/* Round badge — centre */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-on-surface-variant">סיבוב</span>
        <span className="text-lg font-extrabold text-on-surface">{roundNumber}/20</span>
      </div>

      {/* Partner score — right side */}
      <div className="relative flex flex-col items-end">
        {/* Reaction bubble floats above the partner name */}
        {partnerReaction && (
          <span className="absolute -top-7 right-0 text-2xl animate-pop" key={partnerReaction + Date.now()}>
            {partnerReaction}
          </span>
        )}
        <span className="text-xs font-bold text-on-surface-variant">{partnerName || 'חבר/ה'}</span>
        <span className="text-2xl font-extrabold text-primary">{partnerScore}</span>
      </div>
    </header>
  )
}
