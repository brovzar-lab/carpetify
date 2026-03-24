/**
 * Row showing a single AI persona's score for a specific artistic category.
 * Displays persona name, numeric score, and brief rationale.
 */
import { es } from '@/locales/es'
import type { PersonaScore } from '@/validation/scoring'

interface PersonaScoreRowProps {
  persona: PersonaScore
  categoryId: string
}

/** Get persona display info from locales. */
function getPersonaInfo(personaId: string): { name: string; description: string } {
  const personas = es.scoring.personas as Record<
    string,
    { name: string; label: string; description: string }
  >
  const info = personas[personaId]
  if (info) return { name: info.name, description: info.description }
  return { name: personaId, description: '' }
}

export function PersonaScoreRow({ persona, categoryId }: PersonaScoreRowProps) {
  const info = getPersonaInfo(persona.personaId)
  const score = persona.scores[categoryId]
  const rationale = persona.rationale?.[categoryId]

  return (
    <div className="flex items-start gap-2 py-1">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold">{info.name}</span>
        <span className="text-xs text-muted-foreground ml-1.5">
          {info.description}
        </span>
      </div>
      <span className="font-mono text-sm font-semibold shrink-0 tabular-nums">
        {score !== undefined ? score : '--'}
      </span>
      {rationale && (
        <p className="text-xs text-muted-foreground w-full mt-0.5">
          {rationale}
        </p>
      )}
    </div>
  )
}
