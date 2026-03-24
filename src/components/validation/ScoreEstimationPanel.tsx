/**
 * Score estimation right panel for the validation dashboard.
 * Shows viability (deterministic) and artistic (AI) score tabs,
 * bonus points, and improvement suggestions.
 *
 * Stub for Task 1 compilation -- full implementation in Task 2.
 */
import type { ScoreCategory, ImprovementSuggestion } from '@/validation/scoring'
import { es } from '@/locales/es'

interface ScoreEstimationPanelProps {
  projectId: string
  viabilityScore: ScoreCategory[]
  improvements: ImprovementSuggestion[]
}

export function ScoreEstimationPanel({
  viabilityScore,
  improvements,
}: ScoreEstimationPanelProps) {
  const viabilityTotal = viabilityScore.reduce(
    (sum, cat) => sum + cat.estimatedPoints,
    0,
  )

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">
        {es.scoring.panelHeading}
      </h2>
      <p className="text-sm text-muted-foreground">
        {es.scoring.viabilitySection(viabilityTotal)}
      </p>
      {improvements.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {es.scoring.improvementHeading}
          </p>
          {improvements.slice(0, 3).map((imp, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              {es.scoring.improvementFormat(imp.points, imp.text)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
