/**
 * Score card for a single artistic rubric category.
 * Shows category name, averaged score across personas, and per-persona breakdown.
 * Includes manual override capability via inline number input.
 */
import { useState } from 'react'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { PersonaScoreRow } from './PersonaScoreRow'
import type { ScoreCategory, PersonaScore } from '@/validation/scoring'

interface ArtisticScoreCardProps {
  category: ScoreCategory
  personaScores: PersonaScore[]
  /** Called when user manually overrides a score */
  onOverride?: (categoryId: string, overrideValue: number) => void
  /** Current manual override value, if any */
  overrideValue?: number
}

export function ArtisticScoreCard({
  category,
  personaScores,
  onOverride,
  overrideValue,
}: ArtisticScoreCardProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // Use override value if provided, otherwise use category estimated points
  const displayScore =
    overrideValue !== undefined ? overrideValue : category.estimatedPoints

  const percentage =
    category.maxPoints > 0
      ? (displayScore / category.maxPoints) * 100
      : 0

  const handleAjustar = () => {
    setInputValue(String(displayScore))
    setEditing(true)
  }

  const handleConfirm = () => {
    const parsed = parseFloat(inputValue)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= category.maxPoints) {
      onOverride?.(category.id, parsed)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1">
          <ProgressLabel className="text-sm font-semibold">
            {category.name}
          </ProgressLabel>
          <ProgressValue className="font-mono text-sm font-semibold">
            {editing ? (
              <input
                type="number"
                min={0}
                max={category.maxPoints}
                step={0.5}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleConfirm}
                onKeyDown={handleKeyDown}
                className="w-12 border rounded px-1 text-right font-mono text-sm bg-background"
                autoFocus
              />
            ) : (
              <span>
                {displayScore}/{category.maxPoints}
              </span>
            )}
          </ProgressValue>
        </Progress>

        {!editing && onOverride && (
          <button
            onClick={handleAjustar}
            className="text-xs text-primary hover:underline underline-offset-2 shrink-0"
          >
            Ajustar
          </button>
        )}
      </div>

      {/* Per-persona breakdown */}
      {personaScores.length > 0 && (
        <div className="pl-2 border-l-2 border-muted space-y-0.5">
          {personaScores.map((persona) => (
            <PersonaScoreRow
              key={persona.personaId}
              persona={persona}
              categoryId={category.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
