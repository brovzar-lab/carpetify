/**
 * Single finding row with checkbox, persona pill, role pill,
 * criterion, weakness, and suggestion.
 * Per UI-SPEC Finding Item Visual Spec.
 */
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'
import type { ReviewFinding } from '@/services/review'

interface ReviewFindingItemProps {
  finding: ReviewFinding
  onToggle: () => void
}

const ROLE_LABELS: Record<string, string> = {
  director: es.review.roleDirector,
  line_producer: es.review.roleLineProducer,
  escritor: es.review.roleEscritor,
  productor: es.review.roleProductor,
  comercial: es.review.roleComercial,
  ejecutivo: es.review.roleEjecutivo,
}

export function ReviewFindingItem({ finding, onToggle }: ReviewFindingItemProps) {
  const resolvedClass = finding.resolved ? 'line-through text-muted-foreground/60' : ''
  const roleLabel = ROLE_LABELS[finding.role] ?? finding.role
  const findingId = `finding-${finding.personaId}-${finding.documentId}-${finding.criterion.slice(0, 20).replace(/\s/g, '-')}`

  return (
    <div className="flex gap-2 border-b border-border pb-2">
      {/* Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          id={findingId}
          checked={finding.resolved}
          onCheckedChange={onToggle}
          className="size-4"
        />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        {/* Row 1: Persona + Role pills */}
        <div className="flex items-center gap-1.5">
          <label htmlFor={findingId} className="sr-only">
            {finding.criterion}
          </label>
          <Badge variant="outline" className="text-xs">
            {finding.personaName}
          </Badge>
          <Badge variant="outline" className="bg-primary/5 text-primary text-xs">
            {roleLabel}
          </Badge>
        </div>

        {/* Row 2: Criterion */}
        <p className={resolvedClass}>
          <span className="text-xs font-semibold">{es.review.criterionLabel}: </span>
          <span className="text-xs text-muted-foreground">{finding.criterion}</span>
        </p>

        {/* Row 3: Weakness */}
        <p className={resolvedClass}>
          <span className="text-xs font-semibold">{es.review.weaknessLabel}: </span>
          <span className="text-xs text-muted-foreground">{finding.weakness}</span>
        </p>

        {/* Row 4: Suggestion */}
        <p className={resolvedClass}>
          <span className="text-xs font-semibold">{es.review.suggestionLabel}: </span>
          <span className="text-xs text-muted-foreground">{finding.suggestion}</span>
        </p>
      </div>
    </div>
  )
}
