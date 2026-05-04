import { Progress } from '@/components/ui/progress'

/**
 * "Question X of Y" label and animated progress bar for the setup phase.
 * Uses shadcn Progress component; value is 0–100.
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
      <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
        <span>שאלה {current} מתוך {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      {/* ProgressTrack inside is h-1 by default; override via [&_[data-slot=progress-track]] */}
      <Progress value={progress} className="[&_[data-slot=progress-track]]:h-2" />
    </div>
  )
}
