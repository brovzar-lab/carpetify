/**
 * Streaming progress indicator during review execution.
 * Per UI-SPEC State 2: progress text below the disabled button.
 */
import { Skeleton } from '@/components/ui/skeleton'
import { es } from '@/locales/es'
import type { ReviewProgressChunk } from '@/services/review'

interface ReviewProgressDisplayProps {
  progress: ReviewProgressChunk | null
}

function getProgressText(progress: ReviewProgressChunk | null): string {
  if (!progress) return ''

  switch (progress.step) {
    case 'loading_data':
      return es.review.progressLoading
    case 'evaluating':
    case 'persona_complete':
      if (progress.personaName && progress.completedCount != null && progress.totalCount != null) {
        return es.review.progressPersonaComplete(
          progress.personaName,
          progress.completedCount,
          progress.totalCount,
        )
      }
      return progress.message
    case 'coherence':
      return es.review.progressCoherence
    case 'saving':
      return es.review.progressSaving
    default:
      return progress.message
  }
}

export function ReviewProgressDisplay({ progress }: ReviewProgressDisplayProps) {
  const text = getProgressText(progress)

  return (
    <div className="space-y-3" aria-live="polite">
      {text && (
        <p className="text-xs text-muted-foreground">{text}</p>
      )}

      {/* Skeleton placeholders for results area */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
