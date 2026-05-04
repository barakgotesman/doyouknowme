import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SmileIcon } from '../ui/Icons'

/**
 * Card for creating a new game room.
 * Name is collected above this card in Lobby.tsx — only the action button lives here.
 */
export default function CreateCard({
  name, loading, onCreate,
}: {
  name: string
  loading: boolean
  onCreate: () => void
}) {
  return (
    <Card className="card-purple flex-1">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <SmileIcon className="w-6 h-6 text-primary" />
          <div>
            <p className="text-sm font-extrabold text-foreground">התחל משחק חדש</p>
            <p className="text-xs text-muted-foreground">צור חדר ושתף את הקוד לחבר</p>
          </div>
        </div>

        <Button
          variant="brand"
          size="game"
          onClick={onCreate}
          disabled={!name.trim() || loading}
          className="mt-auto"
        >
          {loading ? '...' : 'צור משחק'}
        </Button>
      </CardContent>
    </Card>
  )
}
