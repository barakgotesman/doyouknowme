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
    // getSession triggers Supabase to parse the #access_token hash from the URL
    supabase.auth.getSession().then(() => {
      window.close()
    })
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen text-sm text-on-surface-variant">
      מתחבר...
    </div>
  )
}
