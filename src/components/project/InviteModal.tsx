import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inviteToProject } from '@/services/invitations'
import { es } from '@/locales/es'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['line_producer', 'abogado', 'director']),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteModal({ projectId, open, onOpenChange }: InviteModalProps) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      role: 'line_producer',
    },
  })

  const roleValue = watch('role')

  const onSubmit = async (data: InviteFormData) => {
    setSubmitting(true)
    try {
      await inviteToProject(projectId, data.email, data.role)
      toast.success(es.rbac.invite.successToast)
      queryClient.invalidateQueries({ queryKey: ['project-invitations', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] })
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'message' in err
          ? err.message
          : es.rbac.invite.errorToast
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{es.rbac.invite.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{es.rbac.invite.emailLabel}</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder={es.rbac.invite.emailPlaceholder}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{es.rbac.invite.roleLabel}</Label>
            <Select
              value={roleValue}
              onValueChange={(val) => {
                if (val) setValue('role', val as InviteFormData['role'], { shouldValidate: true })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line_producer">
                  {es.rbac.roles.line_producer}
                </SelectItem>
                <SelectItem value="abogado">{es.rbac.roles.abogado}</SelectItem>
                <SelectItem value="director">{es.rbac.roles.director}</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? es.rbac.invite.sending : es.rbac.invite.sendButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
