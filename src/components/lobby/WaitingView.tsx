import { useEffect, useState } from 'react'
import { ClipboardIcon, CheckIcon, UsersIcon, SendIcon, PhoneIcon, HeartIcon } from '../ui/Icons'

// Rotating hype messages while Player A waits
const MESSAGES = [
  'שלח את הקוד בוואטסאפ',
  'הזמן את החבר/ה שלך עכשיו!',
  'תוכלו לשחק בכל מקום מהטלפון',
  'כשהחבר יצטרף — המשחק יתחיל אוטומטית',
]

const MESSAGE_ICONS = [SendIcon, HeartIcon, PhoneIcon, CheckIcon]

/**
 * Full-screen view shown to Player A after they create a room.
 * Displays the room code large + copy button, animated dots, and rotating tips.
 * Disappears automatically when Player B joins (player_joined Realtime broadcast).
 */
export default function WaitingView({ code, onCancel }: { code: string; onCancel: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const [copied, setCopied] = useState(false)

  // Rotate messages every 3s with a crossfade
  useEffect(() => {
    const id = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length)
        setMsgVisible(true)
      }, 350)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const MsgIcon = MESSAGE_ICONS[msgIndex]

  return (
    <div className="lobby-bg flex-1 flex flex-col items-center justify-center px-5 gap-6">
      <div className="lobby-card-purple rounded-3xl p-8 flex flex-col items-center gap-6 text-center w-full max-w-sm">

        <div className="animate-bounce">
          <UsersIcon className="w-12 h-12 text-primary" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">קוד החדר שלך</p>
          <p className="text-5xl font-extrabold tracking-[0.25em] text-on-surface mt-1">{code}</p>
        </div>

        <button
          onClick={handleCopy}
          className="btn-primary w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          {copied
            ? <><CheckIcon className="w-4 h-4" /><span>הועתק!</span></>
            : <><ClipboardIcon className="w-4 h-4" /><span>העתק קוד</span></>
          }
        </button>

        <div
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant transition-opacity duration-400"
          style={{ opacity: msgVisible ? 1 : 0 }}
        >
          <MsgIcon className="w-4 h-4 shrink-0" />
          <span>{MESSAGES[msgIndex]}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface-variant">ממתין לשחקן שני</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        <button onClick={onCancel} className="text-xs font-bold text-on-surface-variant underline">
          ביטול
        </button>
      </div>
    </div>
  )
}
