/**
 * Cross-document contradictions list.
 * Per UI-SPEC Coherence Panel Visual Spec.
 */
import { Separator } from '@/components/ui/separator'
import { es } from '@/locales/es'
import type { CoherenceContradiction } from '@/services/review'

interface ReviewCoherencePanelProps {
  contradictions: CoherenceContradiction[]
}

export function ReviewCoherencePanel({
  contradictions,
}: ReviewCoherencePanelProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold">
        {es.review.coherenceHeading}
      </span>

      <Separator />

      {contradictions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {es.review.coherenceEmpty}
        </p>
      ) : (
        <div className="space-y-2">
          {contradictions.map((contradiction, index) => (
            <div key={index} className="space-y-0.5">
              <span className="text-xs font-semibold">
                {contradiction.personaName}
              </span>
              <p className="text-xs text-muted-foreground italic">
                {contradiction.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
