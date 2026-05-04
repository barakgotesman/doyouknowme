import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full-screen loading state shown while async data is being fetched.
 * Uses Skeleton placeholders so the layout doesn't feel empty.
 */
export default function LoadingScreen({ message = 'טוען...' }: { message?: string }) {
  return (
    <div className="lobby-bg min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col gap-4 items-center">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-40 rounded-full" />
        <p className="text-sm font-medium text-muted-foreground mt-2">{message}</p>
      </div>
    </div>
  )
}
