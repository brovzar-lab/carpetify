import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
} from '@/services/invitations'
import { useAuth } from '@/contexts/AuthContext'
import { es } from '@/locales/es'

/**
 * PendingInvitations banner shown on the dashboard when the user has
 * pending invitations. Renders nothing if there are no pending invitations.
 *
 * Uses locale strings from es.rbac.pending and es.rbac.roles.
 */
export function PendingInvitations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { data: invitations } = useQuery({
    queryKey: ['pending-invitations', user?.email],
    queryFn: () => getPendingInvitations(user!.email!),
    enabled: !!user?.email,
  })

  const getRoleLabel = (role: string): string => {
    return es.rbac.roles[role as keyof typeof es.rbac.roles] || role
  }

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId)
    try {
      await acceptInvitation(invitationId)
      toast.success(es.rbac.pending.acceptedToast)
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'message' in err
          ? err.message
          : es.errors.generic
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId)
    try {
      await declineInvitation(invitationId)
      toast.success(es.rbac.pending.declinedToast)
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] })
    } catch {
      toast.error(es.errors.generic)
    } finally {
      setProcessingId(null)
    }
  }

  // Render nothing if no invitations
  if (!invitations || invitations.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">{es.rbac.pending.title}</h3>
      </div>

      <div className="space-y-3">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-lg bg-background p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{inv.projectTitle}</span>
                <Badge variant="outline">{getRoleLabel(inv.role)}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {es.rbac.pending.invitedBy(inv.inviterName || '?')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecline(inv.id)}
                disabled={processingId === inv.id}
              >
                {es.rbac.pending.declineButton}
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(inv.id)}
                disabled={processingId === inv.id}
              >
                {es.rbac.pending.acceptButton}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
