/**
 * Modal listing every blocker validation that prevents export per D-14.
 *
 * Each blocker shows rule name, failure message, and "Ir al campo" navigation link
 * using the same pattern from Phase 4's IrAlCampoLink component.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'
import type { ValidationResult } from '@/validation/types'
import { IrAlCampoLink } from '@/components/validation/IrAlCampoLink'

interface ExportBlockedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blockers: ValidationResult[]
}

export function ExportBlockedDialog({
  open,
  onOpenChange,
  blockers,
}: ExportBlockedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{es.export.blockedModalTitle}</DialogTitle>
          <DialogDescription>{es.export.blockedModalBody}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-0">
            {blockers.map((blocker, idx) => (
              <div key={blocker.ruleId}>
                {idx > 0 && <Separator />}
                <div className="py-3 space-y-1">
                  <p className="text-sm font-semibold">{blocker.ruleName}</p>
                  <p className="text-sm text-muted-foreground">{blocker.message}</p>
                  {blocker.details && blocker.details.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-muted-foreground">
                      {blocker.details.map((detail, dIdx) => (
                        <li key={dIdx}>{detail}</li>
                      ))}
                    </ul>
                  )}
                  {blocker.navigateTo && (
                    <IrAlCampoLink
                      navigateTo={blocker.navigateTo}
                      label={es.export.blockedModalFixLink}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {es.export.blockedModalClose}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
