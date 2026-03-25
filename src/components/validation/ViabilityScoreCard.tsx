/**
 * Score card for a single viability rubric category.
 * Shows category name, progress bar, and numeric score in font-mono.
 * Deterministic -- always reflects current project data.
 */
import type { ScoreCategory } from '@/validation/scoring'

interface ViabilityScoreCardProps {
  category: ScoreCategory
}

export function ViabilityScoreCard({ category }: ViabilityScoreCardProps) {
  const percentage =
    category.maxPoints > 0
      ? (category.estimatedPoints / category.maxPoints) * 100
      : 0

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-3">
        <span className="text-sm font-semibold">{category.name}</span>
        <span className="ml-auto font-mono text-sm font-semibold tabular-nums">
          {category.estimatedPoints}/{category.maxPoints}
        </span>
        <div className="relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
