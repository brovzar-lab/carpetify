/**
 * At-a-glance compliance status card for the validation dashboard.
 * Shows blocker/warning/pass status with colored status dots and badges.
 */
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'
import type { ValidationReport } from '@/validation/types'

interface ValidationSummaryProps {
  report: ValidationReport
}

export function ValidationSummary({ report }: ValidationSummaryProps) {
  const blockerCount = report.blockers.length
  const warningCount = report.warnings.length

  // Green: no blockers, no warnings
  // Yellow: no blockers, but warnings
  // Red: blockers present
  const isGreen = blockerCount === 0 && warningCount === 0
  const isRed = blockerCount > 0

  return (
    <Card>
      <CardContent className="space-y-2">
        {/* Primary status line */}
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
              isRed
                ? 'bg-[hsl(0_84%_60%)]'
                : isGreen
                  ? 'bg-[hsl(142_76%_36%)]'
                  : 'bg-[hsl(38_92%_50%)]'
            }`}
          />

          <p
            className={`text-sm font-medium ${
              isRed
                ? 'text-[hsl(0_84%_60%)]'
                : isGreen
                  ? 'text-[hsl(142_76%_36%)]'
                  : 'text-foreground'
            }`}
          >
            {isRed
              ? es.validation.summaryCannotExport(blockerCount)
              : es.validation.summaryCanExport}
          </p>

          {isRed && (
            <Badge
              variant="outline"
              className="bg-[hsl(0_84%_60%)]/10 text-[hsl(0_84%_60%)] border-transparent"
            >
              {blockerCount}
            </Badge>
          )}
        </div>

        {/* Warning line (shown if warnings exist) */}
        {warningCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[hsl(38_92%_50%)]" />
            <p className="text-sm text-[hsl(38_92%_50%)]">
              {es.validation.summaryWarnings(warningCount)}
            </p>
            <Badge
              variant="outline"
              className="bg-[hsl(38_92%_50%)]/10 text-[hsl(38_92%_50%)] border-transparent"
            >
              {warningCount}
            </Badge>
          </div>
        )}

        {/* All pass message */}
        {isGreen && (
          <p className="text-sm text-[hsl(142_76%_36%)]">
            {es.validation.summaryAllPass}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
