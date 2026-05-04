/**
 * "Question X of Y" label and animated progress bar for the setup phase.
 * The bar width is driven by --progress CSS variable so the transition rule stays in index.css.
 *
 * Note: inline style is used ONLY to pass the CSS custom property value — not for visual styling.
 * This is intentional; Tailwind cannot set arbitrary CSS variables at runtime.
 */
export default function ProgressHeader({
  current, total, progress,
}: {
  current: number
  total: number
  progress: number   // 0–100 percentage
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm font-bold text-on-surface-variant">
        <span>שאלה {current} מתוך {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
        {/* --progress is consumed by the .progress-bar rule in index.css */}
        <div
          className="progress-bar"
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
