import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { UserIcon, CheckIcon, GoogleIcon } from '../ui/Icons'

interface Props {
  /** Current name value — controlled by parent */
  name: string
  /** Called whenever the name changes */
  onNameChange: (name: string) => void
  /** Called once the player has a valid auth session and a filled name, ready to proceed */
  onReady?: () => void
}

/**
 * Handles the "who are you?" step before a player can create or join a game.
 * Renders three states:
 *   loading   — skeleton shimmer while useAuth resolves the existing session
 *   choosing  — two buttons: "play as guest" or "continue with Google"
 *   ready     — name input (pre-filled from Google, editable)
 *
 * Anonymous session is created on-demand when the player chooses the guest path,
 * not eagerly on mount, so we don't pollute auth.users with unused rows.
 */
export default function AuthEntry({ name, onNameChange, onReady }: Props) {
  const { googleFirstName, isGoogleUser, loading: authLoading, signInWithGoogle, signInAsGuest } = useAuth()
  // 'loading' while session is resolving, 'choosing' = show two buttons, 'ready' = show name input
  const [mode, setMode] = useState<'loading' | 'choosing' | 'ready'>('loading')

  /**
   * Once useAuth resolves, determine starting mode:
   *   - Google user  → jump straight to ready (name pre-filled)
   *   - Anonymous    → jump straight to ready (name blank)
   *   - No session   → show choice buttons
   */
  /** Advances to ready mode and notifies the parent. */
  function goReady() {
    setMode('ready')
    onReady?.()
  }

  useEffect(() => {
    if (authLoading) return
    if (isGoogleUser) {
      // Already signed in with Google — skip the choice, go straight to name input
      goReady()
      if (googleFirstName && !name) onNameChange(googleFirstName)
    } else {
      // Anonymous or no session — always show the choice buttons so the user
      // can pick guest or upgrade to Google. Anonymous session is reused silently
      // when they click "המשך כאורח", so no extra DB row is created.
      // Clear the name so a previously-filled Google name doesn't carry over after logout.
      onNameChange('')
      setMode('choosing')
    }
  }, [authLoading, isGoogleUser])

  /** When Google popup completes and isGoogleUser flips to true, switch to ready and fill name. */
  useEffect(() => {
    if (isGoogleUser && mode !== 'ready') {
      goReady()
      if (googleFirstName) onNameChange(googleFirstName)
    }
  }, [isGoogleUser])

  /** Handle guest button — create anonymous session then advance to name input. */
  async function handleGuest() {
    await signInAsGuest()
    goReady()
  }

  if (mode === 'loading') {
    return <div className="h-14 rounded-2xl bg-surface-low animate-pulse" />
  }

  if (mode === 'choosing') {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleGuest}
          className="flex-1 flex items-center justify-center gap-3 rounded-2xl border-2 border-outline px-4 py-4 bg-surface-low hover:border-primary hover:bg-primary/5 transition-colors font-bold text-on-surface"
        >
          <UserIcon className="w-5 h-5 text-on-surface-variant shrink-0" />
          <span>המשך כאורח</span>
        </button>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex-1 flex items-center justify-center gap-3 rounded-2xl border-2 border-outline px-4 py-4 bg-surface-low hover:border-primary hover:bg-primary/5 transition-colors font-bold text-on-surface"
        >
          <GoogleIcon className="w-5 h-5 shrink-0" />
          <span>המשך עם Google</span>
        </button>
      </div>
    )
  }

  // ready — show name input, with a "back" button for guest users to switch to Google
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 bg-surface-low transition-colors ${name.trim() ? 'border-primary' : 'border-outline'}`}>
        <UserIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
        <input
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={isGoogleUser ? 'ערוך את שמך...' : 'הכנס את שמך...'}
          dir="rtl"
          autoFocus={!isGoogleUser}
          className="flex-1 bg-transparent outline-none text-base font-semibold text-on-surface placeholder:text-on-surface-variant/50"
        />
        {name.trim() && <CheckIcon className="w-5 h-5 text-primary shrink-0" />}
      </div>
      {/* Only guests can go back — Google users have no reason to switch */}
      {!isGoogleUser && (
        <button
          type="button"
          onClick={() => { onNameChange(''); setMode('choosing') }}
          className="self-start text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          ← חזרה לבחירת התחברות
        </button>
      )}
    </div>
  )
}

/** Expose the internal mode type so parents can track it if needed. */
export type AuthEntryMode = 'loading' | 'choosing' | 'ready'
