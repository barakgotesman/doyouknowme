import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  /** The raw Supabase User object, or null if not yet resolved */
  user: User | null
  /** True while the initial auth session is being loaded from Supabase */
  loading: boolean
  /** True if the user's profile row has is_admin = true */
  isAdmin: boolean
  /** First name from Google OAuth user_metadata, or null for anonymous users */
  googleFirstName: string | null
  /** True if the current session is from Google OAuth (not anonymous) */
  isGoogleUser: boolean
  /** Opens a Google OAuth popup for sign-in */
  signInWithGoogle: () => Promise<void>
  /** Creates a silent anonymous Supabase session for RLS identity */
  signInAsGuest: () => Promise<void>
  /** Signs out and clears the Supabase session */
  signOut: () => Promise<void>
}

/**
 * Subscribes to Supabase auth state changes and derives admin/name data.
 * On sign-in, checks the profiles table to determine if the user is an admin.
 * Returns a stable AuthState object safe to use in any component.
 */
export function useAuth(): AuthState {
  const [user, setUser]               = useState<User | null>(null)
  const [loading, setLoading]         = useState(true)
  const [isAdmin, setIsAdmin]         = useState(false)
  const [googleFirstName, setGoogleFirstName] = useState<string | null>(null)
  // true when the user authenticated via Google OAuth (has an email), false for anonymous
  const [isGoogleUser, setIsGoogleUser] = useState(false)

  /**
   * Queries the profiles table for the given user id and updates isAdmin state.
   * Called whenever the auth user changes (sign-in, token refresh, sign-out).
   */
  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()
    setIsAdmin(data?.is_admin === true)
  }

  /** Derives and sets display-name / isGoogleUser from a Supabase user object. */
  function applyUser(u: User | null) {
    setUser(u)
    if (u) {
      const fullName: string = u.user_metadata?.full_name ?? u.user_metadata?.name ?? ''
      const firstName = fullName.split(' ')[0] || null
      setGoogleFirstName(firstName)
      // Anonymous users have is_anonymous = true and no email
      setIsGoogleUser(!u.is_anonymous && !!u.email)
      fetchProfile(u.id)
    } else {
      setIsAdmin(false)
      setGoogleFirstName(null)
      setIsGoogleUser(false)
    }
  }

  useEffect(() => {
    // Load the current session immediately so we don't wait for the listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      applyUser(session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to future auth changes (sign-in, sign-out, token refresh, popup callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Opens a small popup window for Google OAuth.
   * The popup redirects back to the app origin after auth; Supabase's BroadcastChannel
   * syncs the new session to this window and fires onAuthStateChange automatically.
   */
  async function signInWithGoogle() {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect popup to the minimal callback page, not the full app
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })
    if (data.url) {
      const w = 500, h = 620
      const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
      const top  = Math.round(window.screenY + (window.outerHeight - h) / 2)
      window.open(data.url, 'google-signin', `width=${w},height=${h},left=${left},top=${top},noopener`)
    }
  }

  /** Creates a silent anonymous Supabase session so the player has an auth.uid() for RLS. */
  async function signInAsGuest() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      await supabase.auth.signInAnonymously()
    }
  }

  /** Signs out from Supabase and resets all auth state. */
  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, isAdmin, googleFirstName, isGoogleUser, signInWithGoogle, signInAsGuest, signOut }
}
