/**
 * Score card for a single viability rubric category.
 * Shows category name, progress bar, and numeric score in font-mono.
 * Deterministic -- always reflects current project data.
 */
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
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
      <Progress value={percentage}>
        <ProgressLabel className="text-sm font-semibold">
          {category.name}
        </ProgressLabel>
        <ProgressValue className="font-mono text-sm font-semibold">
          {category.estimatedPoints}/{category.maxPoints}
        </ProgressValue>
      </Progress>
    </div>
  )
}
