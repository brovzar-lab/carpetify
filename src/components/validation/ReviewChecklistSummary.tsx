/**
 * Flat checklist showing all findings with progress counter.
 * Per UI-SPEC D-11 summary checklist.
 */
import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'
import { ReviewFindingItem } from './ReviewFindingItem'
import type { ReviewFinding } from '@/services/review'

interface ReviewChecklistSummaryProps {
  checklist: ReviewFinding[]
  onToggle: (index: number) => void
}

export function ReviewChecklistSummary({
  checklist,
  onToggle,
}: ReviewChecklistSummaryProps) {
  const total = checklist.length
  const resolved = checklist.filter((f) => f.resolved).length
  const pending = total - resolved

  return (
    <div className="space-y-3">
      {/* Header with progress counter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {es.review.checklistHeading}
        </span>
        <Badge variant="outline" className="text-xs">
          {es.review.checklistProgress(total, resolved, pending)}
        </Badge>
      </div>

      {/* Findings list */}
      <div className="space-y-2">
        {checklist.map((finding, index) => (
          <ReviewFindingItem
            key={`${finding.personaId}-${finding.documentId}-${index}`}
            finding={finding}
            onToggle={() => onToggle(index)}
          />
        ))}
      </div>
    </div>
  )
}
