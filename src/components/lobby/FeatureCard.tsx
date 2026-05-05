import type { ReactNode } from 'react'

type FeatureColor = 'primary' | 'secondary' | 'tertiary'

const colorMap: Record<FeatureColor, { icon: string; bg: string }> = {
  primary:   { icon: 'text-primary',           bg: 'bg-primary/10' },
  secondary: { icon: 'text-secondary-foreground', bg: 'bg-secondary/40' },
  tertiary:  { icon: 'text-tertiary-container', bg: 'bg-tertiary-container/20' },
}

/**
 * Small marketing card shown below the join/create forms on wider screens.
 * Each card has a distinct accent color (primary/secondary/tertiary) for its icon pill.
 */
export default function FeatureCard({ icon, title, desc, color = 'primary' }: {
  icon: ReactNode
  title: string
  desc: string
  color?: FeatureColor
}) {
  const { icon: iconColor, bg } = colorMap[color]
  return (
    <div className="bg-white/80 rounded-2xl p-4 flex flex-col items-center gap-2 text-center border border-outline-variant/30">
      <div className={`${iconColor} ${bg} rounded-full p-2`}>{icon}</div>
      <p className="text-sm font-bold text-on-surface">{title}</p>
      <p className="text-xs text-on-surface-variant">{desc}</p>
    </div>
  )
}
