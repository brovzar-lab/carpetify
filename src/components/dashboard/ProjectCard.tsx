import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Copy, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatMXN } from '@/lib/format'
import { PERIODOS_EFICINE } from '@/lib/constants'
import { es } from '@/locales/es'
import { useValidation } from '@/hooks/useValidation'
import { ValidationProjectCardBadge } from '@/components/validation/ValidationProjectCardBadge'
import type { ProjectMetadata } from '@/schemas/project'
import type { DocExpirationStatus } from '@/validation/rules/documentExpiration'

interface ProjectCardProps {
  id: string
  metadata: ProjectMetadata
  onDelete: (id: string) => void
  onClone: (id: string) => void
}

function getDaysRemaining(periodo: string): number {
  const period = PERIODOS_EFICINE[periodo as keyof typeof PERIODOS_EFICINE]
  if (!period) return 0
  const closeDate = new Date(period.close + 'T23:59:59')
  const now = new Date()
  const diff = closeDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function ProjectCard({ id, metadata, onDelete, onClone }: ProjectCardProps) {
  const navigate = useNavigate()
  const daysLeft = getDaysRemaining(metadata.periodo_registro)
  const periodLabel =
    PERIODOS_EFICINE[metadata.periodo_registro as keyof typeof PERIODOS_EFICINE]?.label ??
    'Sin periodo asignado'

  const { report } = useValidation(id)

  // Count documents that are critico (<=14 days) or vencido for the expiration banner
  const expiringDocs = useMemo(() => {
    if (!report) return 0
    const vald17 = report.results.find((r) => r.ruleId === 'VALD-17')
    if (!vald17?.metadata?.documents) return 0
    const docs = vald17.metadata.documents as DocExpirationStatus[]
    return docs.filter(
      (d) => d.status === 'critico' || d.status === 'vencido',
    ).length
  }, [report])

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => navigate(`/project/${id}/datos`)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Title + badges */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold leading-tight truncate">
            {metadata.titulo_proyecto || 'Sin titulo'}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {metadata.categoria_cinematografica}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {periodLabel}
            </Badge>
          </div>
        </div>

        {/* Completion placeholder */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-0 bg-primary rounded-full" />
          </div>
          <span className="text-xs text-muted-foreground">0%</span>
        </div>

        {/* Budget */}
        <div className="space-y-0.5 text-[14px]">
          <p className="text-muted-foreground">
            {formatMXN(metadata.costo_total_proyecto_centavos)}
          </p>
          <p className="text-muted-foreground text-xs">
            EFICINE: {formatMXN(metadata.monto_solicitado_eficine_centavos)}
          </p>
        </div>

        {/* Validation status + days remaining */}
        <div className="flex items-center justify-between text-xs">
          <ValidationProjectCardBadge
            blockerCount={report?.blockers.length ?? 0}
            warningCount={report?.warnings.length ?? 0}
            projectId={id}
          />
          {daysLeft > 0 && (
            <span className="text-muted-foreground">
              {es.dashboard.daysRemaining(daysLeft)}
            </span>
          )}
        </div>

        {/* Expiration banner */}
        {expiringDocs > 0 && (
          <Alert variant="destructive" className="py-1 px-2">
            <AlertDescription className="text-xs">
              {es.validation.expirationCardBanner(expiringDocs)}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div
          className="flex items-center gap-1 pt-1 border-t"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onClone(id)}
                />
              }
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">{es.dashboard.cloneButton}</span>
            </TooltipTrigger>
            <TooltipContent>{es.dashboard.cloneButton}</TooltipContent>
          </Tooltip>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive"
                />
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">{es.dashboard.deleteConfirmTitle}</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{es.dashboard.deleteConfirmTitle}</DialogTitle>
                <DialogDescription>
                  {es.dashboard.deleteConfirmBody(metadata.titulo_proyecto || 'Sin titulo')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <DialogClose render={<Button variant="outline" />}>
                  {es.dashboard.deleteConfirmCancel}
                </DialogClose>
                <DialogClose
                  render={
                    <Button
                      variant="destructive"
                      onClick={() => onDelete(id)}
                    />
                  }
                >
                  {es.dashboard.deleteConfirmConfirm}
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
