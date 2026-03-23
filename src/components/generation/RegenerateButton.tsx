/**
 * Pass-level regeneration trigger with confirmation dialog.
 * Shows confirmation Dialog when the pass contains manually-edited documents (D-11, D-12).
 * If no edited docs, triggers regeneration immediately.
 */
import { useState } from 'react'
import { es } from '@/locales/es'
import { PASS_NUMBERS, type PassId } from '@/services/generation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RefreshCw } from 'lucide-react'

// ---- Types ----

interface RegenerateButtonProps {
  passId: PassId
  /** Display names of manually-edited docs in this pass */
  editedDocNames: string[]
  onRegenerate: () => void
  isRegenerating: boolean
}

// ---- Component ----

export function RegenerateButton({
  passId,
  editedDocNames,
  onRegenerate,
  isRegenerating,
}: RegenerateButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const passNumber = PASS_NUMBERS[passId]

  const handleClick = () => {
    if (editedDocNames.length > 0) {
      // Has edited docs -- show confirmation dialog
      setShowConfirm(true)
    } else {
      // No edited docs -- regenerate immediately
      onRegenerate()
    }
  }

  const handleConfirmRegenerate = () => {
    setShowConfirm(false)
    onRegenerate()
  }

  return (
    <>
      <Button
        size="sm"
        onClick={handleClick}
        disabled={isRegenerating}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {es.generation.regeneratePassCTA(passNumber)}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {es.generation.regenerateConfirmTitle(passNumber)}
            </DialogTitle>
            <DialogDescription>
              {es.generation.regenerateConfirmBody(editedDocNames.join(', '))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              {es.generation.regenerateCancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRegenerate}
            >
              {es.generation.regenerateConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
