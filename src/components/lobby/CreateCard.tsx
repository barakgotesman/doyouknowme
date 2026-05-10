import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SmileIcon, SettingsIcon } from '../ui/Icons'

/**
 * Card for creating a new game room.
 * Name is collected above this card in Lobby.tsx — only the action button lives here.
 * onOpenSettings opens the advanced room configuration modal.
 * hasCustomSettings — when true, shows an orange dot badge on the settings button to
 *   indicate the host has changed at least one option from its default value.
 */
export default function CreateCard({
  name, loading, onCreate, onOpenSettings, hasCustomSettings,
}: {
  name: string
  loading: boolean
  onCreate: () => void
  onOpenSettings: () => void
  hasCustomSettings: boolean
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

        {/* Opens the advanced room settings modal; badge dot appears when settings were customised */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
            hasCustomSettings
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          dir="rtl"
        >
          {/* Relative wrapper so the orange dot can be positioned on the icon */}
          <span className="relative inline-flex">
            <SettingsIcon className={`w-3.5 h-3.5 transition-transform ${hasCustomSettings ? 'animate-spin [animation-duration:4s]' : ''}`} />
            {hasCustomSettings && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400 ring-1 ring-white" />
            )}
          </span>
          הגדרות מתקדמות
          {hasCustomSettings && (
            <span className="text-[10px] font-bold text-orange-500">(מותאם אישית)</span>
          )}
        </button>
      </CardContent>
    </Card>
  )
}
