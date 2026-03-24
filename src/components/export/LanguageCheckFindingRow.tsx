/**
 * Single language check finding row.
 *
 * Severity icons per D-07/D-08:
 * - 'blocker' (title mismatch): XCircle, red, NOT dismissable
 * - 'flagged' (anglicism/format): AlertTriangle, yellow, dismissable
 * - 'noted' (accepted term): Info, gray/muted, no dismiss
 */
import { XCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'
import type { LanguageCheckFinding } from '@/lib/export/languageCheck'

interface LanguageCheckFindingRowProps {
  finding: LanguageCheckFinding
  onDismiss?: () => void
}

export function LanguageCheckFindingRow({
  finding,
  onDismiss,
}: LanguageCheckFindingRowProps) {
  const isBlocker = finding.severity === 'blocker'
  const isFlagged = finding.severity === 'flagged'
  const isNoted = finding.severity === 'noted'

  // Build display text based on finding type
  let displayText = ''
  if (finding.type === 'anglicism' && isFlagged && finding.replacement) {
    displayText = es.export.langCheckAnglicismFlagged(
      finding.word,
      finding.docName,
      finding.replacement,
    )
  } else if (finding.type === 'anglicism' && isNoted) {
    displayText = es.export.langCheckAnglicismNoted(finding.word)
  } else if (finding.type === 'currency') {
    displayText = es.export.langCheckFormatCurrency(finding.docName, finding.word)
  } else if (finding.type === 'date') {
    displayText = es.export.langCheckFormatDate(finding.docName, finding.word)
  } else if (finding.type === 'title') {
    displayText = finding.context
  } else {
    displayText = `${finding.word} en ${finding.docName}`
  }

  // Severity badge label
  const badgeLabel =
    finding.type === 'anglicism' && isFlagged
      ? 'Anglicismo'
      : finding.type === 'anglicism' && isNoted
        ? 'Termino aceptado'
        : finding.type === 'currency' || finding.type === 'date'
          ? 'Formato'
          : 'Titulo'

  return (
    <div className="flex items-start gap-3 py-2">
      {/* Severity icon */}
      <div className="mt-0.5 shrink-0">
        {isBlocker && <XCircle className="size-4 text-[hsl(0_84%_60%)]" />}
        {isFlagged && <AlertTriangle className="size-4 text-[hsl(38_92%_50%)]" />}
        {isNoted && <Info className="size-4 text-muted-foreground" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm">{displayText}</p>
          <Badge
            variant={isBlocker ? 'destructive' : isFlagged ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {badgeLabel}
          </Badge>
        </div>
      </div>

      {/* Dismiss button (flagged only) */}
      {isFlagged && onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs h-7"
          onClick={onDismiss}
        >
          {es.export.langCheckDismiss}
        </Button>
      )}
    </div>
  )
}
