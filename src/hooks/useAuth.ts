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
  // Returns the resolved is_admin value so callers can wait for it before clearing loading
  async function fetchProfile(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle()
      const admin = data?.is_admin === true
      console.log('[fetchProfile]', { userId, data, error, admin })
      sessionStorage.setItem('__auth_debug', JSON.stringify({ userId, data, error: error?.message, admin, code: error?.code }))
      setIsAdmin(admin)
      return admin
    } catch (e) {
      console.error('[fetchProfile] exception', e)
      sessionStorage.setItem('__auth_debug', JSON.stringify({ userId, exception: (e as Error).message }))
      return false
    }
  }

  /**
   * Derives and sets display-name / isGoogleUser from a Supabase user object.
   * Returns a promise that resolves once the profile fetch is done, so callers
   * can delay clearing the loading flag until isAdmin is known.
   */
  async function applyUser(u: User | null): Promise<void> {
    setUser(u)
    if (u) {
      const fullName: string = u.user_metadata?.full_name ?? u.user_metadata?.name ?? ''
      const firstName = fullName.split(' ')[0] || null
      setGoogleFirstName(firstName)
      // Anonymous users have is_anonymous = true and no email
      setIsGoogleUser(!u.is_anonymous && !!u.email)
      await fetchProfile(u.id)
    } else {
      setIsAdmin(false)
      setGoogleFirstName(null)
      setIsGoogleUser(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    // Subscribe to auth state changes. onAuthStateChange fires immediately with INITIAL_SESSION,
    // so getSession() is redundant. Set loading=false right away, fetch profile in background.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      const u = session?.user ?? null
      setUser(u)
      setLoading(false)

      if (u) {
        const fullName: string = u.user_metadata?.full_name ?? u.user_metadata?.name ?? ''
        const firstName = fullName.split(' ')[0] || null
        setGoogleFirstName(firstName)
        setIsGoogleUser(!u.is_anonymous && !!u.email)
        // Fetch profile in background — don't block loading on this
        fetchProfile(u.id).then(admin => {
          if (isMounted) setIsAdmin(admin)
        })
      } else {
        setIsAdmin(false)
        setGoogleFirstName(null)
        setIsGoogleUser(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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

  /** Signs out from Supabase. State is cleared by onAuthStateChange when it fires SIGNED_OUT. */
  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[signOut] error:', e)
    }
  }

  return { user, loading, isAdmin, googleFirstName, isGoogleUser, signInWithGoogle, signInAsGuest, signOut }
}
