/**
 * Compact badge showing document expiration status with color coding.
 * Used inline next to documents in the upload checklist (Screen 5)
 * and in the validation dashboard detail panels.
 */
import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'
import { cn } from '@/lib/utils'

interface ExpirationBadgeProps {
  daysRemaining: number
  status: 'vigente' | 'proximo' | 'critico' | 'vencido'
  className?: string
}

const statusStyles: Record<ExpirationBadgeProps['status'], string> = {
  vigente:
    'bg-[hsl(142_76%_36%)]/10 text-[hsl(142_76%_36%)] border-[hsl(142_76%_36%)]/20',
  proximo:
    'bg-[hsl(38_92%_50%)]/10 text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%)]/20',
  critico:
    'bg-[hsl(0_84%_60%)]/10 text-[hsl(0_84%_60%)] border-[hsl(0_84%_60%)]/20',
  vencido:
    'bg-[hsl(0_84%_60%)] text-white border-[hsl(0_84%_60%)]',
}

function getLabel(status: ExpirationBadgeProps['status'], days: number): string {
  switch (status) {
    case 'vigente':
      return es.validation.expirationValid(days)
    case 'proximo':
      return es.validation.expirationApproaching(days)
    case 'critico':
      return es.validation.expirationCritical(days)
    case 'vencido':
      return es.validation.expirationExpired
  }
}

export function ExpirationBadge({
  daysRemaining,
  status,
  className,
}: ExpirationBadgeProps) {
  return (
    <Badge
      className={cn(
        'h-7 text-xs font-medium',
        statusStyles[status],
        className,
      )}
    >
      {getLabel(status, daysRemaining)}
    </Badge>
  )
}
