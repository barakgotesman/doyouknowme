import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Minimal page loaded inside the Google OAuth popup after redirect.
 * Supabase processes the tokens from the URL hash, stores the session in
 * localStorage, and broadcasts it to the main window via BroadcastChannel.
 * Then we close the popup — the main window's onAuthStateChange fires automatically.
 */
export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically processes the hash from the URL when getSession is called
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthCallback] error getting session:', error)
          return
        }

        // Session is now stored in localStorage and synced to parent window
        // Give a moment for the parent window to receive the update via onAuthStateChange
        setTimeout(() => {
          window.close()
        }, 500)
      } catch (err) {
        console.error('[AuthCallback] unexpected error:', err)
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen text-sm text-on-surface-variant">
      מתחבר...
    </div>
  )
}
