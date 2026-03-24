/**
 * Bonus points card showing 4 bonus categories with met/unmet status.
 * Highlights the recommended strongest category.
 */
import { Badge } from '@/components/ui/badge'
import { es } from '@/locales/es'

interface BonusPointsCardProps {
  bonusPoints: number
  bonusCategory: string | null
  eligibleCategories: string[]
}

/** Static list of all 4 bonus categories with their keys. */
const BONUS_CATEGORIES = [
  { key: 'A', label: es.scoring.bonusCategoryA },
  { key: 'B', label: es.scoring.bonusCategoryB },
  { key: 'C', label: es.scoring.bonusCategoryC },
  { key: 'D', label: es.scoring.bonusCategoryD },
] as const

export function BonusPointsCard({
  bonusPoints,
  bonusCategory,
  eligibleCategories,
}: BonusPointsCardProps) {
  const hasAnyEligible = eligibleCategories.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{es.scoring.bonusHeading}</h3>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {bonusPoints}/5
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {es.scoring.bonusExplanation}
      </p>

      {/* Category list */}
      <div className="space-y-2">
        {BONUS_CATEGORIES.map((cat) => {
          const isMet = eligibleCategories.includes(cat.key)
          const isRecommended = bonusCategory === cat.key

          return (
            <div
              key={cat.key}
              className={`flex items-center justify-between rounded-md px-3 py-2 ${
                isRecommended ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{cat.label}</span>
                {isRecommended && (
                  <Badge
                    variant="outline"
                    className="text-xs text-primary border-primary/30"
                  >
                    {es.scoring.bonusRecommended}
                  </Badge>
                )}
              </div>

              <Badge
                variant="outline"
                className={
                  isMet
                    ? 'bg-[hsl(142_76%_36%)]/10 text-[hsl(142_76%_36%)] border-transparent'
                    : 'bg-muted text-muted-foreground border-transparent'
                }
              >
                {isMet ? es.scoring.bonusMet : es.scoring.bonusNotMet}
              </Badge>
            </div>
          )
        })}
      </div>

      {/* No eligible warning */}
      {!hasAnyEligible && (
        <p className="text-xs text-muted-foreground">
          {es.scoring.bonusNoneEligible}
        </p>
      )}
    </div>
  )
}
