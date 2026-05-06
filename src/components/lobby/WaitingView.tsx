import { useEffect, useState } from 'react'
import { ClipboardIcon, CheckIcon, UsersIcon, SendIcon, PhoneIcon, HeartIcon, WhatsAppIcon } from '../ui/Icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'

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
  const [copiedLink, setCopiedLink] = useState(false)
  // Controls the "close room?" confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

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

  /** Confirms the cancel — marks room abandoned, clears session. */
  async function handleConfirmCancel() {
    setCancelling(true)
    await onCancel()
  }

  /** Builds the shareable join link using the current origin so it works on localhost and prod. */
  function joinLink() {
    return `${window.location.origin}/?join=${code}`
  }

  /** Opens WhatsApp with a pre-filled invite message including the join link. */
  function handleWhatsApp() {
    const msg = encodeURIComponent(
      `בוא נבחן את ההיכרות שלנו במשחק "מכירים אותי?" 🎮\n${joinLink()}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(joinLink())
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
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

        {/* Primary share action — WhatsApp with pre-filled invite message and join link */}
        <button
          onClick={handleWhatsApp}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors"
        >
          <WhatsAppIcon className="w-5 h-5" />
          <span>שלח בוואטסאפ</span>
        </button>

        {/* Secondary share row — copy the code or the full join link */}
        <div className="flex gap-2 w-full">
          <button
            onClick={handleCopy}
            className="btn-primary flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
          >
            {copied
              ? <><CheckIcon className="w-3.5 h-3.5" /><span>הועתק!</span></>
              : <><ClipboardIcon className="w-3.5 h-3.5" /><span>העתק קוד</span></>
            }
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-secondary-custom flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
          >
            {copiedLink
              ? <><CheckIcon className="w-3.5 h-3.5" /><span>הועתק!</span></>
              : <><SendIcon className="w-3.5 h-3.5" /><span>העתק קישור</span></>
            }
          </button>
        </div>

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

        <button
          onClick={() => setConfirmOpen(true)}
          className="text-xs font-bold text-on-surface-variant underline"
        >
          ביטול
        </button>
      </div>

      {/* Confirmation dialog before destroying the room */}
      <Dialog open={confirmOpen} onOpenChange={(v) => { if (!cancelling) setConfirmOpen(v) }}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center gap-1">
            <DialogTitle className="text-lg font-extrabold text-on-surface">
              סגירת החדר?
            </DialogTitle>
            <DialogDescription className="text-sm text-on-surface-variant font-medium leading-relaxed">
              אם תסגור, החדר יימחק ולא ניתן יהיה להצטרף אליו יותר.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 mt-2 sm:flex-col">
            <button
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="btn-destructive w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
            >
              {cancelling ? 'סוגר...' : 'כן, סגור את החדר'}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={cancelling}
              className="btn-secondary-custom w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
            >
              המשך להמתין
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
