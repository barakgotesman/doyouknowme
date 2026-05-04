/**
 * Full-screen error state — shown when a fatal error occurs during initialization.
 * Displays a red banner with the error message centred on screen.
 */
export default function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="lobby-bg min-h-screen flex items-center justify-center px-5">
      <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center max-w-sm">
        {message}
      </div>
    </div>
  )
}
