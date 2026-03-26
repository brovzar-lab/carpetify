import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { functions } from '@/lib/firebase'
import { es } from '@/locales/es'
import type { ProjectRole } from '@/lib/permissions'

interface ForceBreakDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holderName: string
  holderRole: string
  projectId: string
  screenId: string
  onSuccess: () => void
}

function getRoleName(role: string): string {
  const roleKey = role as ProjectRole
  return es.rbac.roles[roleKey] ?? role
}

/**
 * ForceBreakDialog: Confirmation dialog for force-breaking another user's lock.
 *
 * Per D-04:
 * - Shows holder name and role in Spanish
 * - Calls forceBreakLock Cloud Function on confirm
 * - Toast feedback for success/error
 * - Loading state on confirm button
 */
export function ForceBreakDialog({
  open,
  onOpenChange,
  holderName,
  holderRole,
  projectId,
  screenId,
  onSuccess,
}: ForceBreakDialogProps) {
  const [loading, setLoading] = useState(false)
  const roleName = getRoleName(holderRole)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const forceBreakLock = httpsCallable(functions, 'forceBreakLock')
      await forceBreakLock({ projectId, screenId })
      toast.success(es.collaboration.forceBreakSuccess)
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error(es.collaboration.forceBreakError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{es.collaboration.forceBreakConfirmTitle}</DialogTitle>
          <DialogDescription>
            {es.collaboration.forceBreakConfirmBody(holderName, roleName)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {es.collaboration.forceBreakCancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '...' : es.collaboration.forceBreakConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
