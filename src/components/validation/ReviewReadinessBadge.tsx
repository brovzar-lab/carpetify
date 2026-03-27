/**
 * Readiness level badge with color mapping and progress bar.
 * Per UI-SPEC Readiness Badge Visual Spec.
 */
import { es } from '@/locales/es'

interface ReviewReadinessBadgeProps {
  readiness: 'lista' | 'casi_lista' | 'necesita_trabajo' | 'no_lista'
  estimatedScore: number
}

const READINESS_CONFIG: Record<
  ReviewReadinessBadgeProps['readiness'],
  { label: string; textColor: string; bgColor: string; dotColor: string }
> = {
  lista: {
    label: es.review.readinessLista,
    textColor: 'text-[hsl(142_76%_36%)]',
    bgColor: 'bg-[hsl(142_76%_36%)]/10',
    dotColor: 'bg-[hsl(142_76%_36%)]',
  },
  casi_lista: {
    label: es.review.readinessCasiLista,
    textColor: 'text-[hsl(38_92%_50%)]',
    bgColor: 'bg-[hsl(38_92%_50%)]/10',
    dotColor: 'bg-[hsl(38_92%_50%)]',
  },
  necesita_trabajo: {
    label: es.review.readinessNecesitaTrabajo,
    textColor: 'text-[hsl(38_92%_50%)]',
    bgColor: 'bg-[hsl(38_92%_50%)]/10',
    dotColor: 'bg-[hsl(38_92%_50%)]',
  },
  no_lista: {
    label: es.review.readinessNoLista,
    textColor: 'text-[hsl(0_84%_60%)]',
    bgColor: 'bg-[hsl(0_84%_60%)]/10',
    dotColor: 'bg-[hsl(0_84%_60%)]',
  },
}

export function ReviewReadinessBadge({
  readiness,
  estimatedScore,
}: ReviewReadinessBadgeProps) {
  const config = READINESS_CONFIG[readiness]

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${config.bgColor}`}>
        {/* Status dot */}
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${config.dotColor}`} />

        {/* Readiness label */}
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>

        {/* Estimated score */}
        <span className={`ml-auto font-mono text-sm font-semibold tabular-nums ${config.textColor}`}>
          {es.review.estimatedScore(estimatedScore)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(estimatedScore, 100)}%` }}
        />
      </div>
    </div>
  )
}
