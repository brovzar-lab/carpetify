/**
 * Validation dashboard screen.
 * Two-panel layout: rules list (left, flex-1) + score estimation (right, 360px).
 * Rules grouped by severity with collapsible sections and expandable accordion rows.
 * Reads ?filter= query param for deep-link from project card.
 */
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { useValidation } from '@/hooks/useValidation'
import { es } from '@/locales/es'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion } from '@/components/ui/accordion'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ValidationSummary } from './ValidationSummary'
import { RuleStatusRow } from './RuleStatusRow'
import { ScoreEstimationPanel } from './ScoreEstimationPanel'
import type { ValidationResult } from '@/validation/types'

interface ValidationDashboardProps {
  projectId: string
}

/** Group results by their display category. */
function groupResults(results: ValidationResult[]) {
  const blockers: ValidationResult[] = []
  const warnings: ValidationResult[] = []
  const passed: ValidationResult[] = []
  const skipped: ValidationResult[] = []

  for (const r of results) {
    if (r.status === 'fail' && r.severity === 'blocker') {
      blockers.push(r)
    } else if (r.status === 'fail' && r.severity === 'warning') {
      warnings.push(r)
    } else if (r.status === 'pass') {
      passed.push(r)
    } else {
      skipped.push(r)
    }
  }

  return { blockers, warnings, passed, skipped }
}

export function ValidationDashboard({ projectId }: ValidationDashboardProps) {
  const { report, viabilityScore, improvements, loading } =
    useValidation(projectId)
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter')

  const groups = useMemo(() => {
    if (!report) return null
    return groupResults(report.results)
  }, [report])

  // Determine which sections are expanded by default based on filter
  const defaultOpen = useMemo(() => {
    if (filter === 'blockers') return { blockers: true, warnings: false }
    if (filter === 'warnings') return { blockers: false, warnings: true }
    // Default: both expanded
    return { blockers: true, warnings: true }
  }, [filter])

  // Loading state: 6 skeleton rows
  if (loading) {
    return (
      <div className="flex flex-1 flex-col p-8 gap-2">
        <Skeleton className="h-5 w-40 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
      {/* Left panel: rules list */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Page heading */}
          <h1 className="text-xl font-semibold">
            {es.validation.pageTitle}
          </h1>

          {/* Summary card (spans full width above panels) */}
          {report && <ValidationSummary report={report} />}

          {/* Rules list grouped by severity */}
          {groups && (
            <div className="space-y-6">
              {/* Bloqueadores (red) */}
              {groups.blockers.length > 0 && (
                <SeveritySection
                  title={es.validation.sectionBlockers}
                  count={groups.blockers.length}
                  colorClass="text-[hsl(0_84%_60%)]"
                  dotClass="bg-[hsl(0_84%_60%)]"
                  defaultOpen={defaultOpen.blockers}
                  results={groups.blockers}
                />
              )}

              {/* Advertencias (yellow) */}
              {groups.warnings.length > 0 && (
                <SeveritySection
                  title={es.validation.sectionWarnings}
                  count={groups.warnings.length}
                  colorClass="text-[hsl(38_92%_50%)]"
                  dotClass="bg-[hsl(38_92%_50%)]"
                  defaultOpen={defaultOpen.warnings}
                  results={groups.warnings}
                />
              )}

              {/* Cumplidas (green) -- collapsed by default */}
              {groups.passed.length > 0 && (
                <SeveritySection
                  title={es.validation.sectionPassed}
                  count={groups.passed.length}
                  colorClass="text-[hsl(142_76%_36%)]"
                  dotClass="bg-[hsl(142_76%_36%)]"
                  defaultOpen={false}
                  results={groups.passed}
                />
              )}

              {/* Sin evaluar (gray) -- collapsed by default */}
              {groups.skipped.length > 0 && (
                <SeveritySection
                  title={es.validation.sectionSkipped}
                  count={groups.skipped.length}
                  colorClass="text-muted-foreground"
                  dotClass="bg-muted-foreground/40"
                  defaultOpen={false}
                  results={groups.skipped}
                />
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Right panel: score estimation (360px fixed on desktop, full width on mobile) */}
      <div className="w-full lg:w-[360px] lg:shrink-0 border-t lg:border-t-0 lg:border-l overflow-y-auto">
        <ScoreEstimationPanel
          projectId={projectId}
          viabilityScore={viabilityScore}
          improvements={improvements}
        />
      </div>
    </div>
  )
}

// ---- Severity Section ----

interface SeveritySectionProps {
  title: string
  count: number
  colorClass: string
  dotClass: string
  defaultOpen: boolean
  results: ValidationResult[]
}

function SeveritySection({
  title,
  count,
  colorClass,
  dotClass,
  defaultOpen,
  results,
}: SeveritySectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 group">
        <span
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`}
        />
        <span className={`text-sm font-semibold ${colorClass}`}>{title}</span>
        <Badge variant="outline" className="text-xs border-transparent">
          {count}
        </Badge>
        <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Accordion>
          {results.map((result) => (
            <RuleStatusRow key={result.ruleId} result={result} />
          ))}
        </Accordion>
      </CollapsibleContent>
    </Collapsible>
  )
}
