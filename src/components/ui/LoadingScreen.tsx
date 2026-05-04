/**
 * Full-screen loading state — shown while async data is being fetched.
 * Accepts an optional message so each screen can describe what it's loading.
 */
export default function LoadingScreen({ message = 'טוען...' }: { message?: string }) {
  return (
    <div className="lobby-bg min-h-screen flex items-center justify-center">
      <p className="text-sm font-medium text-on-surface-variant">{message}</p>
    </div>
  )
}
