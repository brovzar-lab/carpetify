/**
 * Main review container managing all 6 interaction states.
 * Per UI-SPEC Layout Contract and Interaction States.
 *
 * States:
 *   1. No Review Yet (empty + CTA)
 *   2. Running (progress + skeletons)
 *   3. Results (badge + checklist + coherence + drill-down)
 *   4. Stale (results + warning)
 *   5. Error (alert + retry)
 *   6. Re-evaluation Confirmation (dialog)
 */
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { es } from '@/locales/es'
import { usePreSubmissionReview } from '@/hooks/usePreSubmissionReview'
import { ReviewReadinessBadge } from './ReviewReadinessBadge'
import { ReviewProgressDisplay } from './ReviewProgressDisplay'
import { ReviewChecklistSummary } from './ReviewChecklistSummary'
import { ReviewCoherencePanel } from './ReviewCoherencePanel'
import { ReviewDocumentSection } from './ReviewDocumentSection'
import type { ReviewFinding } from '@/services/review'

interface PreSubmissionReviewPanelProps {
  projectId: string
  generationComplete: boolean
}

export function PreSubmissionReviewPanel({
  projectId,
  generationComplete,
}: PreSubmissionReviewPanelProps) {
  const {
    review,
    checklist,
    running,
    progress,
    error,
    isStale,
    loading,
    triggerReview,
    toggleFinding,
  } = usePreSubmissionReview(projectId)

  const [showConfirm, setShowConfirm] = useState(false)

  // Group findings by documentId for drill-down
  const findingsByDocument = useMemo(() => {
    const groups: Record<string, { documentName: string; findings: ReviewFinding[]; indices: number[] }> = {}
    checklist.forEach((finding, index) => {
      if (!groups[finding.documentId]) {
        groups[finding.documentId] = {
          documentName: finding.documentName,
          findings: [],
          indices: [],
        }
      }
      groups[finding.documentId].findings.push(finding)
      groups[finding.documentId].indices.push(index)
    })
    return groups
  }, [checklist])

  const hasResults = review !== null && !running

  // Handle CTA click
  const handleCTAClick = () => {
    if (hasResults) {
      // State 6: show re-evaluation confirmation
      setShowConfirm(true)
    } else {
      triggerReview()
    }
  }

  // Confirm re-evaluation
  const handleConfirmReevaluate = () => {
    setShowConfirm(false)
    triggerReview()
  }

  if (loading) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* ---- State 5: Error ---- */}
      {error && !running && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{es.review.errorState}</AlertTitle>
          <AlertDescription>
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto text-destructive"
              onClick={() => triggerReview()}
            >
              {es.review.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ---- State 4: Stale warning ---- */}
      {hasResults && isStale && (
        <Badge className="bg-[hsl(38_92%_50%)]/10 text-[hsl(38_92%_50%)] border-transparent">
          {es.review.staleWarning}
        </Badge>
      )}

      {/* ---- CTA Button ---- */}
      {!running && (
        <Button
          onClick={handleCTAClick}
          disabled={!generationComplete}
          variant={hasResults && !isStale ? 'outline' : 'default'}
          className="w-full"
        >
          {hasResults ? es.review.ctaButtonReevaluate : es.review.ctaButton}
        </Button>
      )}

      {/* Generation gate message */}
      {!generationComplete && !running && !hasResults && (
        <p className="text-xs text-muted-foreground">
          {es.review.generationGate}
        </p>
      )}

      {/* ---- State 2: Running ---- */}
      {running && (
        <>
          <Button disabled className="w-full">
            <RefreshCw className="size-4 animate-spin mr-2" />
            {es.review.evaluatingState}
          </Button>
          <ReviewProgressDisplay progress={progress} />
        </>
      )}

      {/* ---- State 3: Results ---- */}
      {hasResults && review && (
        <>
          {/* Readiness badge */}
          <ReviewReadinessBadge
            readiness={review.readiness}
            estimatedScore={review.estimatedScore}
          />

          <Separator />

          {/* Checklist summary */}
          <ReviewChecklistSummary
            checklist={checklist}
            onToggle={toggleFinding}
          />

          <Separator />

          {/* Coherence panel */}
          <ReviewCoherencePanel
            contradictions={review.coherenceContradictions}
          />

          <Separator />

          {/* Document drill-down */}
          <div className="space-y-2">
            <span className="text-sm font-semibold">
              {es.review.drilldownHeading}
            </span>

            {Object.entries(findingsByDocument).map(([docId, group]) => (
              <ReviewDocumentSection
                key={docId}
                documentId={docId}
                documentName={group.documentName}
                findings={group.findings}
                onToggle={(localIndex) => {
                  const globalIndex = group.indices[localIndex]
                  toggleFinding(globalIndex)
                }}
              />
            ))}
          </div>

          <Separator />

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground">
            {es.review.disclaimer}
          </p>
        </>
      )}

      {/* ---- State 1: No review, empty state ---- */}
      {!hasResults && !running && !error && (
        <>
          <p className="text-xs text-muted-foreground">
            {es.review.disclaimer}
          </p>
        </>
      )}

      {/* ---- State 6: Re-evaluation Confirmation Dialog ---- */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{es.review.reevaluateConfirmTitle}</DialogTitle>
            <DialogDescription>
              {es.review.reevaluateConfirmBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {es.review.cancel}
            </Button>
            <Button onClick={handleConfirmReevaluate}>
              {es.review.reevaluateConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
