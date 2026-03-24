/**
 * Export readiness summary card with three visual states per D-13.
 *
 * - Blockers: red left border, X icon, disabled CTA
 * - Warnings: yellow left border, warning icon, enabled yellow CTA
 * - Clean: green left border, checkmark, enabled green CTA
 */
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'
import type { ValidationReport } from '@/validation/types'
import { ExportCTAButton } from './ExportCTAButton'

interface ExportReadinessCardProps {
  report: ValidationReport | null
  generatedDocsExist: boolean
  isExporting: boolean
  onExport: () => void
  onShowBlockers: () => void
  onRetry: () => void
  hasError: boolean
  exportComplete: boolean
}

export function ExportReadinessCard({
  report,
  generatedDocsExist: _generatedDocsExist,
  isExporting,
  onExport,
  onShowBlockers,
  onRetry,
  hasError,
  exportComplete,
}: ExportReadinessCardProps) {
  const blockerCount = report?.blockers.length ?? 0
  const warningCount = report?.warnings.length ?? 0
  const hasBlockers = blockerCount > 0
  const hasWarnings = warningCount > 0

  // Determine visual state
  const borderColor = hasBlockers
    ? 'border-l-[hsl(0_84%_60%)]'
    : hasWarnings
      ? 'border-l-[hsl(38_92%_50%)]'
      : 'border-l-[hsl(142_76%_36%)]'

  const Icon = hasBlockers ? XCircle : hasWarnings ? AlertTriangle : CheckCircle2
  const iconColor = hasBlockers
    ? 'text-[hsl(0_84%_60%)]'
    : hasWarnings
      ? 'text-[hsl(38_92%_50%)]'
      : 'text-[hsl(142_76%_36%)]'

  const message = hasBlockers
    ? es.export.readinessBlockers(blockerCount)
    : hasWarnings
      ? es.export.readinessWarnings(warningCount)
      : es.export.readinessClean

  // CTA button state
  const ctaState = isExporting
    ? 'exporting' as const
    : hasError
      ? 'error' as const
      : exportComplete
        ? 'complete' as const
        : hasBlockers
          ? 'blockers' as const
          : hasWarnings
            ? 'warnings' as const
            : 'clean' as const

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-5 space-y-4">
        {/* Status message */}
        <div className="flex items-start gap-3">
          <Icon className={`size-5 mt-0.5 shrink-0 ${iconColor}`} />
          <div className="flex-1">
            <p className="text-sm">{message}</p>
            <div className="flex gap-2 mt-2">
              {blockerCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {blockerCount} bloqueador(es)
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {warningCount} advertencia(s)
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <ExportCTAButton
          state={ctaState}
          warningCount={warningCount}
          blockerCount={blockerCount}
          onExport={onExport}
          onShowBlockers={onShowBlockers}
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  )
}
