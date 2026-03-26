import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getProjectTeamMembers,
  getProjectInvitations,
  revokeAccess,
} from '@/services/invitations'
import { canManageTeam, type ProjectRole } from '@/lib/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { es } from '@/locales/es'
import { InviteModal } from './InviteModal'

interface TeamMembersProps {
  projectId: string
  collaborators: Record<string, string>
  ownerId: string
}

export function TeamMembers({ projectId, collaborators, ownerId }: TeamMembersProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<{
    uid: string
    name: string
  } | null>(null)
  const [revoking, setRevoking] = useState(false)

  // Current user's role in this project
  const currentUserRole = user
    ? (collaborators[user.uid] as ProjectRole | undefined) ??
      (user.uid === ownerId ? 'productor' : undefined)
    : undefined
  const isManager = currentUserRole ? canManageTeam(currentUserRole) : false

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['project-team', projectId],
    queryFn: () => getProjectTeamMembers(collaborators, ownerId),
    enabled: Object.keys(collaborators).length > 0,
  })

  const { data: pendingInvitations } = useQuery({
    queryKey: ['project-invitations', projectId],
    queryFn: () => getProjectInvitations(projectId),
    enabled: isManager,
  })

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await revokeAccess(projectId, revokeTarget.uid)
      toast.success(es.rbac.team.removedToast)
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setRevokeTarget(null)
    } catch {
      toast.error(es.errors.generic)
    } finally {
      setRevoking(false)
    }
  }

  const getRoleLabel = (role: string): string => {
    return es.rbac.roles[role as keyof typeof es.rbac.roles] || role
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{es.rbac.team.title}</h3>
        {isManager && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            {es.rbac.invite.sendButton}
          </Button>
        )}
      </div>

      {/* Team members list */}
      {membersLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {members?.map((member) => (
            <div
              key={member.uid}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {member.displayName}
                    </span>
                    {member.uid === ownerId && (
                      <Badge variant="secondary">{es.rbac.team.owner}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{getRoleLabel(member.role)}</Badge>
                {/* D-05: hidden, not disabled -- only show revoke for non-owners */}
                {isManager && member.uid !== ownerId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive"
                    onClick={() =>
                      setRevokeTarget({
                        uid: member.uid,
                        name: member.displayName,
                      })
                    }
                  >
                    <X className="mr-1 h-3 w-3" />
                    {es.rbac.team.removeButton}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending invitations section */}
      {isManager && pendingInvitations && pendingInvitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {es.rbac.pending.title}
          </h4>
          {pendingInvitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-dashed p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {inv.inviteeEmail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm">{inv.inviteeEmail}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getRoleLabel(inv.role)}</Badge>
                    <Badge variant="secondary">{es.rbac.team.pendingStatus}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite modal */}
      <InviteModal
        projectId={projectId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />

      {/* Revoke confirmation dialog */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{es.rbac.team.removeButton}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {revokeTarget ? es.rbac.team.removeConfirm(revokeTarget.name) : ''}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              disabled={revoking}
            >
              {es.rbac.team.removeCancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? es.rbac.team.removing : es.rbac.team.removeButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
