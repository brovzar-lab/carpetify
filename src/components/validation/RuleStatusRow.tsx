/**
 * Expandable rule status row for the validation dashboard.
 * Shows status dot, rule name, severity badge, and status badge.
 * Expanded state shows RuleDetailPanel.
 */
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { RuleDetailPanel } from './RuleDetailPanel'
import { es } from '@/locales/es'
import type { ValidationResult } from '@/validation/types'

interface RuleStatusRowProps {
  result: ValidationResult
}

/** Status dot color based on rule status and severity. */
function getStatusDotClasses(result: ValidationResult): string {
  if (result.status === 'pass') return 'bg-[hsl(142_76%_36%)]'
  if (result.status === 'fail' && result.severity === 'blocker')
    return 'bg-[hsl(0_84%_60%)]'
  if (result.status === 'fail' && result.severity === 'warning')
    return 'bg-[hsl(38_92%_50%)]'
  // skip state
  return 'bg-muted-foreground/40'
}

/** Severity badge variant and label. */
function getSeverityBadge(result: ValidationResult): {
  label: string
  className: string
} | null {
  if (result.status === 'skip') return null
  if (result.severity === 'blocker') {
    return {
      label: 'BLOQUEADOR',
      className:
        'bg-[hsl(0_84%_60%)]/10 text-[hsl(0_84%_60%)] border-transparent',
    }
  }
  return {
    label: 'ADVERTENCIA',
    className:
      'bg-[hsl(38_92%_50%)]/10 text-[hsl(38_92%_50%)] border-transparent',
  }
}

/** Status badge text and color. */
function getStatusBadge(result: ValidationResult): {
  label: string
  className: string
} {
  if (result.status === 'pass') {
    return {
      label: es.validation.statusPass,
      className:
        'bg-[hsl(142_76%_36%)]/10 text-[hsl(142_76%_36%)] border-transparent',
    }
  }
  if (result.status === 'fail') {
    return {
      label: es.validation.statusFail,
      className:
        result.severity === 'blocker'
          ? 'bg-[hsl(0_84%_60%)]/10 text-[hsl(0_84%_60%)] border-transparent'
          : 'bg-[hsl(38_92%_50%)]/10 text-[hsl(38_92%_50%)] border-transparent',
    }
  }
  // skip
  return {
    label: es.validation.statusSkip,
    className: 'bg-muted text-muted-foreground border-transparent',
  }
}

export function RuleStatusRow({ result }: RuleStatusRowProps) {
  const dotClasses = getStatusDotClasses(result)
  const severityBadge = getSeverityBadge(result)
  const statusBadge = getStatusBadge(result)
  const isSkip = result.status === 'skip'

  return (
    <AccordionItem value={result.ruleId}>
      <AccordionTrigger className="h-12 px-4 py-0 items-center hover:no-underline">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status dot -- 10px */}
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses}`}
          />

          {/* Rule name */}
          <span
            className={`text-sm font-semibold truncate ${isSkip ? 'text-muted-foreground' : ''}`}
          >
            {result.ruleName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Severity badge */}
          {severityBadge && (
            <Badge variant="outline" className={severityBadge.className}>
              {severityBadge.label}
            </Badge>
          )}

          {/* Status badge */}
          <Badge variant="outline" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="px-4 pb-2">
          <RuleDetailPanel result={result} />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
