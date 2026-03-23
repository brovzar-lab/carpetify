/**
 * Real-time pipeline progress display with pass-by-pass tracking.
 * Shows 4 passes as sequential steps:
 * - Active pass: expanded with Progress bar + per-document status list
 * - Pending passes: collapsed single lines
 * - Completed passes: collapsed with green checkmark
 * Auto-collapses 5 seconds after pipeline completes (per UI-SPEC).
 */
import { useEffect, useState } from 'react'
import { Check, Circle, Loader2 } from 'lucide-react'
import { es } from '@/locales/es'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PIPELINE_ORDER, PASS_NUMBERS, type PassId } from '@/services/generation'
import type { PassProgress, PipelineStatus } from '@/hooks/useGeneration'

interface PipelineProgressProps {
  passProgress: Record<PassId, PassProgress>
  isRunning: boolean
  pipelineStatus: PipelineStatus
}

export function PipelineProgress({
  passProgress,
  isRunning,
  pipelineStatus,
}: PipelineProgressProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Auto-collapse after pipeline completes
  useEffect(() => {
    if (pipelineStatus === 'complete') {
      const timer = setTimeout(() => setCollapsed(true), 5000)
      return () => clearTimeout(timer)
    }
    setCollapsed(false)
  }, [pipelineStatus])

  if (collapsed) return null

  return (
    <Card
      className={cn(
        'mx-6 mt-4 transition-opacity duration-300',
        pipelineStatus === 'complete' && 'opacity-80',
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {isRunning
            ? es.generation.pipelineRunning
            : pipelineStatus === 'partial'
              ? es.generation.pipelineIncomplete
              : pipelineStatus === 'complete'
                ? es.generation.pipelineComplete(21)
                : es.generation.pipelineRunning}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {PIPELINE_ORDER.map((passId) => {
          const pass = passProgress[passId]
          const passLabel =
            es.generation.passLabels[passId]
          const totalDocs = pass.docs.length
          const completedDocs = pass.docs.filter(
            (d) => d.status === 'complete',
          ).length

          return (
            <PassProgressRow
              key={passId}
              passId={passId}
              label={passLabel}
              status={pass.status}
              totalDocs={totalDocs}
              completedDocs={completedDocs}
              docs={pass.docs}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

// ---- Pass row component ----

interface PassProgressRowProps {
  passId: PassId
  label: string
  status: 'pending' | 'running' | 'complete' | 'error'
  totalDocs: number
  completedDocs: number
  docs: Array<{ docId: string; status: 'pending' | 'generating' | 'complete' }>
}

function PassProgressRow({
  passId,
  label,
  status,
  totalDocs,
  completedDocs,
  docs,
}: PassProgressRowProps) {
  const progressPercent =
    totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0
  const isExpanded = status === 'running'
  const passNumber = PASS_NUMBERS[passId]

  return (
    <div className="space-y-2">
      {/* Pass header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <PassStatusIcon status={status} />
          <span
            className={cn(
              'font-medium',
              status === 'running' && 'text-primary',
              status === 'complete' && 'text-muted-foreground',
              status === 'error' && 'text-destructive',
            )}
          >
            {label}
          </span>
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {status === 'complete'
            ? es.generation.passComplete(passNumber, totalDocs)
            : status === 'running'
              ? `${completedDocs}/${totalDocs} documentos`
              : status === 'error'
                ? es.generation.statusError
                : es.generation.statusPending}
        </span>
      </div>

      {/* Progress bar (running pass only) */}
      {isExpanded && (
        <>
          <Progress
            value={progressPercent}
            className="[&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-300 [&_[data-slot=progress-indicator]]:ease-in-out"
          />

          {/* Per-document status list */}
          <div className="space-y-1 pl-6">
            {docs.map((doc) => {
              const docName =
                es.generation.docNames[
                  doc.docId as keyof typeof es.generation.docNames
                ] ?? doc.docId
              return (
                <div
                  key={doc.docId}
                  className="flex items-center gap-2 text-xs"
                >
                  <DocStatusIcon status={doc.status} />
                  <span
                    className={cn(
                      doc.status === 'complete' && 'text-muted-foreground',
                      doc.status === 'generating' && 'text-primary',
                    )}
                  >
                    {doc.status === 'generating'
                      ? es.generation.docGenerating(docName)
                      : docName}
                  </span>
                  {doc.status === 'complete' && (
                    <span className="text-muted-foreground">
                      {es.generation.docComplete}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ---- Status icons ----

function PassStatusIcon({
  status,
}: {
  status: 'pending' | 'running' | 'complete' | 'error'
}) {
  switch (status) {
    case 'complete':
      return (
        <Check className="h-4 w-4 text-[hsl(142_76%_36%)] dark:text-[hsl(142_70%_45%)]" />
      )
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />
    case 'error':
      return <Circle className="h-4 w-4 text-destructive fill-destructive" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />
  }
}

function DocStatusIcon({
  status,
}: {
  status: 'pending' | 'generating' | 'complete'
}) {
  switch (status) {
    case 'complete':
      return (
        <Check className="h-3 w-3 text-[hsl(142_76%_36%)] dark:text-[hsl(142_70%_45%)]" />
      )
    case 'generating':
      return <Loader2 className="h-3 w-3 animate-spin text-primary" />
    default:
      return <Circle className="h-3 w-3 text-muted-foreground" />
  }
}
