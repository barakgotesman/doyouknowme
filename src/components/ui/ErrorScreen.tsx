import { Card, CardContent } from '@/components/ui/card'

/**
 * Full-screen error state shown when a fatal error occurs during initialization.
 */
export default function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="lobby-bg min-h-screen flex items-center justify-center px-5">
      <Card className="max-w-sm w-full border-destructive/40 bg-destructive/5">
        <CardContent className="p-4 text-destructive text-sm font-medium text-center">
          {message}
        </CardContent>
      </Card>
    </div>
  )
}
