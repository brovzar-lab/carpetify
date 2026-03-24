/**
 * Collapsible warnings panel for non-blocking validation warnings.
 *
 * Warnings do not prevent export per EXPRT-04.
 * Each warning can be individually dismissed or all dismissed at once.
 */
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { es } from '@/locales/es'
import type { ValidationResult } from '@/validation/types'
import { useState } from 'react'

interface ExportWarningsPanelProps {
  warnings: ValidationResult[]
  dismissedIds: Set<string>
  onDismiss: (ruleId: string) => void
  onDismissAll: () => void
}

export function ExportWarningsPanel({
  warnings,
  dismissedIds,
  onDismiss,
  onDismissAll,
}: ExportWarningsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  // Filter visible warnings (not dismissed)
  const visibleWarnings = warnings.filter((w) => !dismissedIds.has(w.ruleId))

  if (visibleWarnings.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer py-2">
          <AlertTriangle className="size-4 text-[hsl(38_92%_50%)]" />
          <h3 className="text-sm font-semibold">{es.export.warningsPanelHeading}</h3>
          <Badge variant="secondary" className="text-xs">
            {visibleWarnings.length}
          </Badge>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <p className="text-sm text-muted-foreground mb-3">
          {es.export.warningsPanelBody}
        </p>

        <div className="space-y-0">
          {visibleWarnings.map((warning, idx) => (
            <div key={warning.ruleId}>
              {idx > 0 && <Separator />}
              <div className="flex items-start justify-between py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{warning.ruleName}</p>
                  <p className="text-sm text-muted-foreground">{warning.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs h-7 ml-2"
                  onClick={() => onDismiss(warning.ruleId)}
                >
                  {es.export.warningsDismiss}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onDismissAll}>
            {es.export.warningsDismissAll}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
