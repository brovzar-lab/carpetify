import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'
import { formatDateES } from '@/lib/format'
import type { Screenplay } from '@/schemas/screenplay'

interface AnalysisResultsProps {
  complejidad: Screenplay['complejidad']
  diasRodaje?: number
  lastAnalyzed?: unknown
  estimacion?: {
    baja: number
    media: number
    alta: number
  }
}

/**
 * Displays Claude's analysis output: shooting day estimates,
 * complexity flags as badges, night percentage, and last-analyzed timestamp.
 * Per UI-SPEC Analysis Results Detail Layout.
 */
export function AnalysisResults({
  complejidad,
  diasRodaje,
  lastAnalyzed,
  estimacion,
}: AnalysisResultsProps) {
  const t = es.screen2

  // Complexity flags with labels
  const flags = [
    { key: 'stunts', label: 'Stunts', active: complejidad?.stunts },
    { key: 'vfx', label: 'VFX', active: complejidad?.vfx },
    { key: 'agua', label: 'Agua', active: complejidad?.agua },
    { key: 'animales', label: 'Animales', active: complejidad?.animales },
    { key: 'ninos', label: 'Menores', active: complejidad?.ninos },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">{t.analysisResultsHeading}</h3>

      {/* Shooting day estimates */}
      {estimacion && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            {t.shootingDaysLabel}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border bg-muted/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">{t.estimateLow}</p>
              <p className="text-lg font-semibold">{estimacion.baja}</p>
            </div>
            <div className="rounded-md border bg-muted/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">{t.estimateMid}</p>
              <p className="text-lg font-semibold">{estimacion.media}</p>
            </div>
            <div className="rounded-md border bg-muted/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">{t.estimateHigh}</p>
              <p className="text-lg font-semibold">{estimacion.alta}</p>
            </div>
          </div>
        </div>
      )}

      {/* Complexity flags */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          {t.complexityLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {flags.map((flag) => (
            <Badge
              key={flag.key}
              variant={flag.active ? 'default' : 'outline'}
            >
              {flag.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Night percentage */}
      {complejidad?.noche_pct !== undefined && complejidad.noche_pct > 0 && (
        <p className="text-sm">
          {t.nightPercentage}: {complejidad.noche_pct}%
        </p>
      )}

      {/* Shooting days (overall) */}
      {diasRodaje !== undefined && diasRodaje > 0 && !estimacion && (
        <p className="text-sm">
          {t.shootingDaysLabel}: {diasRodaje}
        </p>
      )}

      {/* Last analyzed timestamp */}
      {(() => {
        if (!lastAnalyzed) return null
        const d = lastAnalyzed instanceof Date ? lastAnalyzed
          : lastAnalyzed && typeof lastAnalyzed === 'object' && 'toDate' in lastAnalyzed ? (lastAnalyzed as { toDate: () => Date }).toDate()
          : typeof lastAnalyzed === 'string' ? new Date(lastAnalyzed)
          : null
        if (!d || isNaN(d.getTime())) return null
        return (
          <p className="text-xs text-muted-foreground">
            {t.lastAnalyzedLabel}: {formatDateES(d)},{' '}
            {String(d.getHours()).padStart(2, '0')}:
            {String(d.getMinutes()).padStart(2, '0')}
          </p>
        )
      })()}
    </div>
  )
}
