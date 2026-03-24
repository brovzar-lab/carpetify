/**
 * Validation dashboard screen.
 * Displays the real-time validation report with traffic light per rule,
 * severity-grouped sections, and score estimation panel.
 *
 * Full implementation in Plan 06. This file provides the route target
 * and wires the useValidation hook for data flow.
 */
import { useValidation } from '@/hooks/useValidation'
import { es } from '@/locales/es'

interface ValidationDashboardProps {
  projectId: string
}

export function ValidationDashboard({ projectId }: ValidationDashboardProps) {
  const { report, viabilityScore, improvements, loading } = useValidation(projectId)

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">
          {es.validation.pageTitle}...
        </p>
      </div>
    )
  }

  const blockerCount = report?.blockers.length ?? 0
  const warningCount = report?.warnings.length ?? 0
  const passedCount = report?.passed.length ?? 0
  const skippedCount = report?.skipped.length ?? 0

  const viabilityTotal = viabilityScore.reduce(
    (sum, cat) => sum + cat.estimatedPoints,
    0,
  )

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <h1 className="text-xl font-semibold mb-6">
        {es.validation.pageTitle}
      </h1>

      {/* Summary banner */}
      <div className="rounded-lg border p-4 mb-6">
        {report?.canExport ? (
          <p className="text-sm text-[hsl(142_76%_36%)] font-medium">
            {es.validation.summaryCanExport}
          </p>
        ) : (
          <p className="text-sm text-[hsl(0_84%_60%)] font-medium">
            {es.validation.summaryCannotExport(blockerCount)}
          </p>
        )}
        {warningCount > 0 && (
          <p className="text-sm text-[hsl(38_92%_50%)] mt-1">
            {es.validation.summaryWarnings(warningCount)}
          </p>
        )}
      </div>

      {/* Rule counts summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-semibold text-[hsl(0_84%_60%)]">{blockerCount}</p>
          <p className="text-xs text-muted-foreground">{es.validation.sectionBlockers}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-semibold text-[hsl(38_92%_50%)]">{warningCount}</p>
          <p className="text-xs text-muted-foreground">{es.validation.sectionWarnings}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-semibold text-[hsl(142_76%_36%)]">{passedCount}</p>
          <p className="text-xs text-muted-foreground">{es.validation.sectionPassed}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-semibold text-muted-foreground">{skippedCount}</p>
          <p className="text-xs text-muted-foreground">{es.validation.sectionSkipped}</p>
        </div>
      </div>

      {/* Viability score preview */}
      <div className="rounded-lg border p-4 mb-6 bg-muted/50">
        <p className="text-sm font-semibold mb-2">
          {es.scoring.viabilitySection(viabilityTotal)}
        </p>
        {improvements.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {es.scoring.improvementHeading}
            </p>
            <ul className="space-y-1">
              {improvements.slice(0, 3).map((imp, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {es.scoring.improvementFormat(imp.points, imp.text)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Rule list placeholder -- full implementation in Plan 06 */}
      {report && report.results.length > 0 && (
        <div className="space-y-2">
          {report.results.map((result) => (
            <div
              key={result.ruleId}
              className="flex items-center gap-3 rounded-md border px-4 py-3"
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  result.status === 'pass'
                    ? 'bg-[hsl(142_76%_36%)]'
                    : result.status === 'fail' && result.severity === 'blocker'
                      ? 'bg-[hsl(0_84%_60%)]'
                      : result.status === 'fail' && result.severity === 'warning'
                        ? 'bg-[hsl(38_92%_50%)]'
                        : 'bg-muted-foreground/40'
                }`}
              />
              <span className="text-sm font-medium flex-1">
                {result.ruleName}
              </span>
              <span
                className={`text-xs ${
                  result.status === 'pass'
                    ? 'text-[hsl(142_76%_36%)]'
                    : result.status === 'fail'
                      ? result.severity === 'blocker'
                        ? 'text-[hsl(0_84%_60%)]'
                        : 'text-[hsl(38_92%_50%)]'
                      : 'text-muted-foreground'
                }`}
              >
                {result.status === 'pass'
                  ? es.validation.statusPass
                  : result.status === 'fail'
                    ? result.severity === 'blocker'
                      ? es.validation.statusFail
                      : es.validation.statusWarning
                    : es.validation.statusSkip}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
