import { useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

/** Duration (ms) a reaction emoji is visible on screen */
const REACTION_DISPLAY_MS = 1500
/** Duration (ms) the player must wait before sending another reaction */
const COOLDOWN_MS = 3000

/**
 * Shared reaction logic used in both the Setup and Game phases.
 * Manages local + partner emoji state, cooldown, and broadcasting via a Supabase channel.
 *
 * Usage:
 *   const { myReaction, partnerReaction, onCooldown, sendReaction, handleIncomingReaction } = useReactions(playerRole)
 *
 * Call `handleIncomingReaction(emoji)` from inside a Realtime broadcast listener.
 * Pass `channelRef` the active channel so sendReaction can broadcast without a stale closure.
 */
export function useReactions(playerRole: string) {
  const [myReaction,      setMyReaction]      = useState<string | null>(null)
  const [partnerReaction, setPartnerReaction] = useState<string | null>(null)
  const [onCooldown,      setOnCooldown]      = useState(false)

  // Caller stores the active channel here so sendReaction always has a fresh reference
  const channelRef = useRef<RealtimeChannel | null>(null)

  /** Show the partner's incoming emoji for REACTION_DISPLAY_MS then clear it. */
  function handleIncomingReaction(emoji: string) {
    setPartnerReaction(emoji)
    setTimeout(() => setPartnerReaction(null), REACTION_DISPLAY_MS)
  }

  /**
   * Broadcasts an emoji reaction and shows it locally.
   * Blocked while on cooldown or before the channel is ready.
   */
  function sendReaction(emoji: string) {
    if (onCooldown || !channelRef.current) return

    setMyReaction(emoji)
    setTimeout(() => setMyReaction(null), REACTION_DISPLAY_MS)

    setOnCooldown(true)
    setTimeout(() => setOnCooldown(false), COOLDOWN_MS)

    channelRef.current.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji, role: playerRole },
    })
  }

  return { myReaction, partnerReaction, onCooldown, sendReaction, handleIncomingReaction, channelRef }
}
