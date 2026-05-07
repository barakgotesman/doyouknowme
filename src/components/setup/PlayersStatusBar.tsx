import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PlayerStatus } from '../../hooks/useSetup'
import { UserIcon, UsersIcon, CheckIcon } from '../ui/Icons'

const TOTAL_QUESTIONS = 10

/**
 * Side-by-side bar showing both players' names and setup progress.
 * Updates in real-time as each player broadcasts answers via Supabase Realtime.
 */
export default function PlayersStatusBar({
  myStatus, partnerStatus, myReaction, partnerReaction,
}: {
  myStatus: PlayerStatus
  partnerStatus: PlayerStatus
  myReaction?: string | null
  partnerReaction?: string | null
}) {
  return (
    // pt-8 reserves space above so reaction bubbles (absolute -top-7) aren't clipped
    <div className="w-full flex gap-3 pt-8">
      <PlayerBadge status={myStatus} isMe reaction={myReaction} />
      <PlayerBadge status={partnerStatus} isMe={false} reaction={partnerReaction} />
    </div>
  )
}

/**
 * Single player's progress card inside the status bar.
 * Shows "X/10" progress or a green "סיים" badge with a check icon when done.
 */
function PlayerBadge({ status, isMe, reaction }: { status: PlayerStatus; isMe: boolean; reaction?: string | null }) {
  return (
    <Card className={`flex-1 relative overflow-visible ${isMe ? 'card-purple' : 'card-yellow'}`}>
      {/* Emoji reaction bubble — pops above the card when active */}
      {reaction && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl animate-pop" key={reaction + Date.now()}>
          {reaction}
        </span>
      )}
      <CardContent className="p-3 flex flex-col gap-1">
        <p className="text-xs font-bold text-muted-foreground truncate flex items-center gap-1">
          {isMe
            ? <><UserIcon className="w-3 h-3" /> אתה</>
            : <><UsersIcon className="w-3 h-3" /> חבר/ה</>
          }
        </p>
        <p className="text-sm font-extrabold text-foreground truncate">
          {status.name || '...'}
        </p>
        {status.done ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 w-fit text-xs flex items-center gap-1">
            <CheckIcon className="w-3 h-3" /> סיים
          </Badge>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {status.progress}/{TOTAL_QUESTIONS}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
