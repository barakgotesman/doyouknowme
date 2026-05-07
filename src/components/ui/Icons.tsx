/**
 * Custom SVG icon library for the app.
 * All icons share a consistent style: 24×24 viewBox, 2px stroke, round linecap/linejoin.
 * Pass className to control size and color (e.g. "w-5 h-5 text-primary").
 */

interface IconProps {
  className?: string
}

const defaults = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export function CheckIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function XIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function RefreshIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

export function HomeIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

export function ClockIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function LightbulbIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  )
}

export function SettingsIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function VolumeOffIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

export function VolumeLowIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

export function VolumeMedIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

export function VolumeHighIcon({ className = 'w-5 h-5' }: IconProps) {
  return <VolumeMedIcon className={className} />
}

export function TrophyIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="10" />
      <path d="M6.5 5H4a1 1 0 0 0-1 1v3a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V6a1 1 0 0 0-1-1h-2.5" />
      <rect x="6" y="3" width="12" height="8" rx="2" />
    </svg>
  )
}

export function KeyIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

export function SmileIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  )
}

export function UsersIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function UserIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function ClipboardIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

export function BrainIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1 1.08-4.73A3 3 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0-1.08-4.73A3 3 0 0 0 14.5 2Z" />
    </svg>
  )
}

export function ChatIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function SearchIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function PinIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function HeartIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}


export function SilentIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
      <path d="M8 12h8" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CelebrationIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M5.8 11.3 2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7" />
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z" />
    </svg>
  )
}

export function SendIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export function PhoneIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

export function ThinkIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="10" x2="15.01" y2="10" />
      <path d="M17 7.5c0-1-1-2-2-1.5" />
    </svg>
  )
}

/** WhatsApp logo — filled speech-bubble style matching the brand icon. */
export function LogoutIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function GoogleIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export function ChevronDownIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function WhatsAppIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.406A9.954 9.954 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm5.2 14.2c-.22.617-1.283 1.18-1.76 1.22-.476.04-.49.357-3.086-.746-2.595-1.103-4.16-3.796-4.285-3.972-.126-.176-1.02-1.393-.98-2.627.04-1.233.677-1.823.916-2.07.24-.247.52-.31.694-.315l.5-.01c.16-.004.375-.06.586.46l.84 2.157c.07.18.117.39.007.617l-.353.54-.34.476c-.12.155-.246.32-.106.625.14.305.624 1.07 1.34 1.733.922.844 1.7 1.105 1.938 1.228.238.124.378.104.518-.063l.71-.844c.19-.236.38-.157.634-.057l1.984.96c.233.11.387.166.443.26.057.096.057.556-.163 1.172Z" />
    </svg>
  )
}
