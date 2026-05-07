import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
  googleFirstName: string | null
  isGoogleUser: boolean
  signInWithGoogle: () => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [googleFirstName, setGoogleFirstName] = useState<string | null>(null)
  const [isGoogleUser, setIsGoogleUser] = useState(false)

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
      return admin
    } catch (e) {
      console.error('[fetchProfile] exception', e)
      sessionStorage.setItem('__auth_debug', JSON.stringify({ userId, exception: (e as Error).message }))
      return false
    }
  }

  useEffect(() => {
    let isMounted = true

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

  async function signInWithGoogle() {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })
    if (data.url) {
      const w = 500, h = 620
      const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
      const top = Math.round(window.screenY + (window.outerHeight - h) / 2)
      window.open(data.url, 'google-signin', `width=${w},height=${h},left=${left},top=${top},noopener`)
    }
  }

  async function signInAsGuest() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      await supabase.auth.signInAnonymously()
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[signOut] error:', e)
    }
  }

  const value: AuthState = {
    user,
    loading,
    isAdmin,
    googleFirstName,
    isGoogleUser,
    signInWithGoogle,
    signInAsGuest,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
