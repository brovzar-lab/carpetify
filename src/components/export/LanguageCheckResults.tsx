/**
 * Language check findings panel per D-05/D-07/D-08.
 *
 * Three sections:
 * 1. Anglicismos -- flagged (yellow) and noted (gray) terms
 * 2. Formatos de montos y fechas -- currency and date format issues
 * 3. Consistencia del titulo -- title mismatches (blockers)
 *
 * Max-width 640px centered per UI-SPEC spacing exception.
 */
import { es } from '@/locales/es'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import type { LanguageCheckResult } from '@/lib/export/languageCheck'
import { LanguageCheckFindingRow } from './LanguageCheckFindingRow'

interface LanguageCheckResultsProps {
  result: LanguageCheckResult
  dismissedFindings: Set<number>
  onDismiss: (index: number) => void
  onDismissAll: () => void
}

export function LanguageCheckResults({
  result,
  dismissedFindings,
  onDismiss,
  onDismissAll,
}: LanguageCheckResultsProps) {
  // Filter visible anglicisms (not dismissed)
  const visibleAnglicisms = result.anglicisms.filter((_, idx) => {
    const findingIdx = result.findings.indexOf(result.anglicisms[idx])
    return !dismissedFindings.has(findingIdx)
  })

  // Filter visible format issues (not dismissed)
  const visibleFormats = result.formatIssues.filter((_, idx) => {
    const findingIdx = result.findings.indexOf(result.formatIssues[idx])
    return !dismissedFindings.has(findingIdx)
  })

  // Title mismatches are never dismissable
  const titleMismatches = result.titleMismatches

  // Check if there are any dismissable findings visible
  const hasDismissable =
    visibleAnglicisms.some((f) => f.severity === 'flagged') ||
    visibleFormats.some((f) => f.severity === 'flagged')

  return (
    <div className="mx-auto max-w-[640px] rounded-lg bg-muted/50 p-5 space-y-4">
      <h3 className="text-lg font-semibold">{es.export.langCheckHeading}</h3>

      {/* Section 1: Anglicisms */}
      <div>
        <h4 className="text-sm font-medium mb-2">{es.export.langCheckAnglicisms}</h4>
        {visibleAnglicisms.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-[hsl(142_76%_36%)]" />
            {es.export.langCheckNoAnglicisms}
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleAnglicisms.map((finding, idx) => {
              const globalIdx = result.findings.indexOf(finding)
              return (
                <LanguageCheckFindingRow
                  key={`anglicism-${idx}`}
                  finding={finding}
                  onDismiss={
                    finding.severity === 'flagged'
                      ? () => onDismiss(globalIdx)
                      : undefined
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Section 2: Format issues */}
      <div>
        <h4 className="text-sm font-medium mb-2">{es.export.langCheckFormats}</h4>
        {visibleFormats.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-[hsl(142_76%_36%)]" />
            {es.export.langCheckNoFormatIssues}
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleFormats.map((finding, idx) => {
              const globalIdx = result.findings.indexOf(finding)
              return (
                <LanguageCheckFindingRow
                  key={`format-${idx}`}
                  finding={finding}
                  onDismiss={
                    finding.severity === 'flagged'
                      ? () => onDismiss(globalIdx)
                      : undefined
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Section 3: Title consistency */}
      <div>
        <h4 className="text-sm font-medium mb-2">{es.export.langCheckTitles}</h4>
        {titleMismatches.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-[hsl(142_76%_36%)]" />
            {es.export.langCheckTitleConsistent}
          </div>
        ) : (
          <div className="space-y-0.5">
            {titleMismatches.map((finding, idx) => (
              <LanguageCheckFindingRow key={`title-${idx}`} finding={finding} />
            ))}
          </div>
        )}
      </div>

      {/* Dismiss all button */}
      {hasDismissable && (
        <>
          <Separator />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onDismissAll}>
              {es.export.langCheckDismissAll}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
