import { useEffect, useRef } from 'react'

type Track = 'lobby' | 'setup' | 'gameplay' | 'results'

// Single shared Audio instance per track — prevents duplicate elements on re-renders
const audioInstances: Partial<Record<Track, HTMLAudioElement>> = {}

function getInstance(track: Track): HTMLAudioElement {
  if (!audioInstances[track]) {
    const el = new Audio(`/sounds/${track}.mp3`)
    el.loop = true
    el.volume = 0.35
    audioInstances[track] = el
  }
  return audioInstances[track]!
}

/**
 * Plays a looping background track for the current screen.
 * Stops the track automatically when the component unmounts (screen changes).
 * Respects the global mute preference stored in localStorage.
 *
 * Usage: call useAudio('lobby') at the top of any screen component.
 */
export function useAudio(track: Track) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = getInstance(track)
    audioRef.current = audio

    const muted = localStorage.getItem('audio_muted') === 'true'
    if (muted) return

    // Try playing immediately — succeeds if a prior gesture already unlocked audio
    audio.play().catch(() => {
      // Browser blocked autoplay: wait for the first user gesture then retry
      function onFirstInteraction() {
        audio.play().catch(() => {})
        document.removeEventListener('click', onFirstInteraction)
        document.removeEventListener('touchstart', onFirstInteraction)
        document.removeEventListener('keydown', onFirstInteraction)
      }
      document.addEventListener('click', onFirstInteraction)
      document.addEventListener('touchstart', onFirstInteraction)
      document.addEventListener('keydown', onFirstInteraction)
    })

    return () => {
      // Fade out on unmount instead of hard-stopping
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05)
        } else {
          audio.pause()
          audio.volume = 0.35
          clearInterval(fadeOut)
        }
      }, 50)
    }
  }, [track])
}

/**
 * Toggles mute state globally across all tracks.
 * Persists the preference to localStorage.
 * Returns the new muted state.
 */
export function toggleMute(): boolean {
  const current = localStorage.getItem('audio_muted') === 'true'
  const next = !current
  localStorage.setItem('audio_muted', String(next))

  Object.values(audioInstances).forEach(audio => {
    if (!audio) return
    if (next) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  })

  return next
}

/**
 * Sets volume (0–1) on all active tracks and persists it to localStorage.
 * Also unmutes if volume > 0.
 */
export function setGlobalVolume(volume: number) {
  localStorage.setItem('audio_volume', String(volume))
  // Treat volume === 0 as muted so useAudio skips autoplay on next mount
  localStorage.setItem('audio_muted', volume === 0 ? 'true' : 'false')

  Object.values(audioInstances).forEach(audio => {
    if (!audio) return
    audio.volume = volume
    if (volume > 0 && audio.paused) audio.play().catch(() => {})
    if (volume === 0) audio.pause()
  })
}

/** Returns the saved volume (0–1), defaulting to 0.35. */
export function getSavedVolume(): number {
  return parseFloat(localStorage.getItem('audio_volume') ?? '0.35')
}

/** Returns whether audio is currently muted (reads from localStorage). */
export function isMuted(): boolean {
  return localStorage.getItem('audio_muted') === 'true'
}
