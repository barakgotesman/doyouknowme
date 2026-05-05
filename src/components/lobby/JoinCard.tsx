import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KeyIcon } from '../ui/Icons'

/**
 * Card for joining an existing room by entering a 4-letter code.
 * Submit is disabled until both the name field and a 4-character code are filled in.
 */
export default function JoinCard({
  name, roomCode, loading,
  onRoomCodeChange, onSubmit,
}: {
  name: string
  roomCode: string
  loading: boolean
  onNameChange: (v: string) => void
  onRoomCodeChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <Card className="card-yellow flex-1">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <KeyIcon className="w-6 h-6 text-primary" />
          <div>
            <p className="text-sm font-extrabold text-foreground">הצטרף למשחק</p>
            <p className="text-xs text-muted-foreground">יש לך קוד חדר? הכנס אותו כאן</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            type="text"
            value={roomCode}
            onChange={e => onRoomCodeChange(e.target.value.toUpperCase())}
            placeholder="A B C D"
            maxLength={4}
            dir="ltr"
            className="text-center text-xl font-extrabold tracking-[0.3em] bg-surface-low border-2 border-transparent focus-visible:border-secondary-container focus-visible:ring-0 h-12"
          />

          <Button
            type="submit"
            variant="brandYellow"
            size="game"
            disabled={roomCode.trim().length !== 4 || !name.trim() || loading}
          >
            {loading ? '...' : 'הצטרף למשחק'}
          </Button>

          {!name.trim() && (
            <p className="text-xs text-muted-foreground text-center">יש להכניס שם למעלה תחילה</p>
          )}
          {name.trim() && roomCode.trim().length !== 4 && (
            <p className="text-xs text-muted-foreground text-center">יש להכניס קוד חדר בן 4 אותיות</p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
