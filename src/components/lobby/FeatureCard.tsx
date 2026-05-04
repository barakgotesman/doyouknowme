import type { ReactNode } from 'react'

/**
 * Small marketing card shown below the join/create forms on wider screens.
 * Hidden on mobile (md:grid in the parent) to keep the lobby uncluttered on small screens.
 */
export default function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white/80 rounded-2xl p-4 flex flex-col items-center gap-2 text-center border border-outline/20">
      <div className="text-primary">{icon}</div>
      <p className="text-sm font-bold text-on-surface">{title}</p>
      <p className="text-xs text-on-surface-variant">{desc}</p>
    </div>
  )
}
