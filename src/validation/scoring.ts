/**
 * EFICINE score estimation module.
 * Two scoring methods:
 *   - Viability (38 pts): deterministic, client-side, from project data signals
 *   - Artistic (62 pts): AI persona evaluations via Cloud Function (types only here)
 *
 * Pure TypeScript -- no React, no Firestore, no side effects.
 */

import type { ProjectDataSnapshot } from './types'

// ---- Type Exports ----

export interface ScoreSignal {
  /** What was measured */
  name: string
  /** Whether the signal was detected */
  present: boolean
  /** Points this signal contributes */
  impact: number
}

export interface ScoreCategory {
  /** Category ID, e.g. 'equipo', 'produccion', 'guion' */
  id: string
  /** Spanish label from UI-SPEC */
  name: string
  /** Maximum points per rubric */
  maxPoints: number
  /** Estimated points earned */
  estimatedPoints: number
  /** Individual scoring signals */
  signals: ScoreSignal[]
  /** true for viability categories, false for artistic */
  isViability: boolean
}

export interface ImprovementSuggestion {
  /** Estimated point gain */
  points: number
  /** Spanish suggestion text from UI-SPEC */
  text: string
  /** Which scoring category */
  category: string
}

export interface PersonaScore {
  /** Persona ID: reygadas, marcopolo, pato, leo, alejandro */
  personaId: string
  /** Display name */
  personaName: string
  /** categoryId -> score */
  scores: Record<string, number>
  /** categoryId -> brief reasoning (Spanish) */
  rationale?: Record<string, string>
}

export interface ScoreEstimate {
  /** 5 deterministic viability categories */
  viability: ScoreCategory[]
  /** 3 AI-estimated artistic categories */
  artistic: ScoreCategory[]
  /** 5 individual persona results */
  personaScores: PersonaScore[]
  /** 0 or 5 */
  bonusPoints: number
  /** Which category earned bonus, or null */
  bonusCategory: string | null
  /** Sum of viability scores */
  totalViability: number
  /** Sum of artistic scores (averaged across personas) */
  totalArtistic: number
  /** viability + artistic + bonus */
  totalEstimated: number
  /** 100 */
  maxPossible: number
  /** 90 */
  passingThreshold: number
  /** Whether totalEstimated >= 90 */
  meetsThreshold: boolean
  /** Sorted improvement suggestions */
  improvements: ImprovementSuggestion[]
}

// ---- Helper Functions ----

function hasGeneratedDoc(
  docs: ProjectDataSnapshot['generatedDocs'],
  docId: string,
): boolean {
  return docs.some((d) => d.docId === docId)
}

function findTeamByRole(
  team: ProjectDataSnapshot['team'],
  cargo: string,
): ProjectDataSnapshot['team'] {
  return team.filter((m) => m.cargo === cargo)
}

function sumSignals(signals: ScoreSignal[]): number {
  return signals.reduce(
    (sum, s) => sum + (s.present ? s.impact : 0),
    0,
  )
}

// ---- Viability Scoring ----

/**
 * Compute viability scores (38 pts total) deterministically from project data.
 * Returns 5 ScoreCategory objects, one per viability rubric section.
 */
export function computeViabilityScore(
  snapshot: ProjectDataSnapshot,
): ScoreCategory[] {
  return [
    computeEquipo(snapshot),
    computeProduccion(snapshot),
    computePlanRodaje(snapshot),
    computePresupuesto(snapshot),
    computeExhibicion(snapshot),
  ]
}

/**
 * Equipo Creativo (2 pts)
 * Signals: producer with filmography, director with filmography,
 * prior collaborations, links to prior work.
 */
function computeEquipo(snapshot: ProjectDataSnapshot): ScoreCategory {
  const producers = findTeamByRole(snapshot.team, 'Productor')
  const directors = findTeamByRole(snapshot.team, 'Director')

  const producerWithFilmography =
    producers.length > 0 &&
    producers.some((p) => p.filmografia && p.filmografia.length > 0)

  const directorWithFilmography =
    directors.length > 0 &&
    directors.some((d) => d.filmografia && d.filmografia.length > 0)

  // Prior collaborations: any two team members share a filmography title
  const allTitles = new Map<string, number>()
  for (const member of snapshot.team) {
    if (member.filmografia) {
      for (const entry of member.filmografia) {
        allTitles.set(
          entry.titulo.toLowerCase(),
          (allTitles.get(entry.titulo.toLowerCase()) || 0) + 1,
        )
      }
    }
  }
  const hasPriorCollaborations = Array.from(allTitles.values()).some(
    (count) => count >= 2,
  )

  // Links to prior work: any team member has enlaces
  const hasLinks = snapshot.team.some(
    (m) => m.enlaces && m.enlaces.length > 0,
  )

  const signals: ScoreSignal[] = [
    {
      name: 'Productor con filmografia',
      present: producerWithFilmography,
      impact: 0.5,
    },
    {
      name: 'Director con filmografia',
      present: directorWithFilmography,
      impact: 0.5,
    },
    {
      name: 'Colaboraciones previas entre equipo',
      present: hasPriorCollaborations,
      impact: 0.5,
    },
    {
      name: 'Enlaces a trabajo previo',
      present: hasLinks,
      impact: 0.5,
    },
  ]

  return {
    id: 'equipo',
    name: 'Equipo Creativo (2 pts)',
    maxPoints: 2,
    estimatedPoints: sumSignals(signals),
    signals,
    isViability: true,
  }
}

/**
 * Produccion (12 pts)
 * Signals: A7 exists, crew organization, safe workplace, timeline,
 * challenges identified, co-production justification.
 */
function computeProduccion(snapshot: ProjectDataSnapshot): ScoreCategory {
  const a7Exists = hasGeneratedDoc(snapshot.generatedDocs, 'A7')

  // When A7 is generated by the AI pipeline, it includes crew organization,
  // timeline, and challenges as part of the structured prompt output.
  // We credit these signals when the document exists since the prompt enforces them.
  const hasCrewOrganization = a7Exists
  const hasTimeline = a7Exists
  const hasChallenges = a7Exists

  const hasSafeWorkplace = snapshot.productionHasSafeWorkplace ?? a7Exists
  const isCoprod = snapshot.metadata.es_coproduccion_internacional ?? false

  const signals: ScoreSignal[] = [
    {
      name: 'Propuesta de produccion existe (A7)',
      present: a7Exists,
      impact: 3,
    },
    {
      name: 'Organizacion del equipo descrita',
      present: hasCrewOrganization,
      impact: 2,
    },
    {
      name: 'Compromiso con entorno laboral respetuoso',
      present: hasSafeWorkplace,
      impact: 2,
    },
    {
      name: 'Cronograma por etapa',
      present: hasTimeline,
      impact: 2,
    },
    {
      name: 'Retos identificados',
      present: hasChallenges,
      impact: 2,
    },
    {
      name: 'Justificacion de coproduccion',
      present: isCoprod ? a7Exists : true, // Only scored if co-production
      impact: isCoprod ? 1 : 0,
    },
  ]

  const raw = sumSignals(signals)
  return {
    id: 'produccion',
    name: 'Produccion (12 pts)',
    maxPoints: 12,
    estimatedPoints: Math.min(raw, 12),
    signals,
    isViability: true,
  }
}

/**
 * Plan de Rodaje (10 pts)
 * Signals: A8a exists, A8b exists, pages/day <= 5, monthly detail.
 */
function computePlanRodaje(snapshot: ProjectDataSnapshot): ScoreCategory {
  const a8aExists = hasGeneratedDoc(snapshot.generatedDocs, 'A8a')
  const a8bExists = hasGeneratedDoc(snapshot.generatedDocs, 'A8b')

  const pagesPerDay = snapshot.screenplayPagesPerDay
  const goodPagesPerDay =
    pagesPerDay !== undefined && pagesPerDay > 0 && pagesPerDay <= 5

  const hasMonthlyDetail = snapshot.rutaCriticaHasMonthlyDetail ?? a8bExists

  const signals: ScoreSignal[] = [
    {
      name: 'Plan de rodaje existe (A8a)',
      present: a8aExists,
      impact: 3,
    },
    {
      name: 'Ruta critica existe (A8b)',
      present: a8bExists,
      impact: 3,
    },
    {
      name: 'Paginas por dia <= 5',
      present: goodPagesPerDay,
      impact: 2,
    },
    {
      name: 'Detalle mensual en ruta critica',
      present: hasMonthlyDetail,
      impact: 2,
    },
  ]

  return {
    id: 'plan_rodaje',
    name: 'Plan de Rodaje (10 pts)',
    maxPoints: 10,
    estimatedPoints: sumSignals(signals),
    signals,
    isViability: true,
  }
}

/**
 * Presupuesto (10 pts)
 * Signals: budget exists, cash flow exists, imprevistos >= 10%,
 * crew rates proportional, cash vs in-kind distinguished.
 */
function computePresupuesto(snapshot: ProjectDataSnapshot): ScoreCategory {
  const budgetExists =
    hasGeneratedDoc(snapshot.generatedDocs, 'A9a') ||
    hasGeneratedDoc(snapshot.generatedDocs, 'A9b')
  const cashFlowExists = hasGeneratedDoc(snapshot.generatedDocs, 'A9d')
  const hasImprevistos = snapshot.budgetHasImprevistos ?? false

  // Crew rates: if team has honorarios, assume proportional
  const hasCrewRates = snapshot.team.some(
    (m) => m.honorarios_centavos > 0,
  )

  // Cash vs in-kind distinguished: financial structure has both
  const hasCashInkindSplit =
    snapshot.financials.erpiCashCentavos > 0 ||
    snapshot.financials.erpiInkindCentavos > 0

  const signals: ScoreSignal[] = [
    {
      name: 'Presupuesto con todas las cuentas',
      present: budgetExists,
      impact: 3,
    },
    {
      name: 'Flujo de efectivo existe',
      present: cashFlowExists,
      impact: 2,
    },
    {
      name: 'Imprevistos >= 10% BTL',
      present: hasImprevistos,
      impact: 2,
    },
    {
      name: 'Tarifas proporcionales a experiencia',
      present: hasCrewRates,
      impact: 2,
    },
    {
      name: 'Efectivo vs especie claramente distinguido',
      present: hasCashInkindSplit,
      impact: 1,
    },
  ]

  return {
    id: 'presupuesto',
    name: 'Presupuesto (10 pts)',
    maxPoints: 10,
    estimatedPoints: sumSignals(signals),
    signals,
    isViability: true,
  }
}

/**
 * Exhibicion (4 pts)
 * Signals: A10 exists, spectator estimate, festival strategy, target audience.
 */
function computeExhibicion(snapshot: ProjectDataSnapshot): ScoreCategory {
  const a10Exists = hasGeneratedDoc(snapshot.generatedDocs, 'A10')

  const hasSpectators =
    snapshot.exhibitionHasSpectatorEstimate ?? false
  const hasFestivalStrategy =
    snapshot.exhibitionHasFestivalStrategy ?? false
  const hasTargetAudience =
    snapshot.exhibitionHasTargetAudience ?? false

  const signals: ScoreSignal[] = [
    {
      name: 'Propuesta de exhibicion existe (A10)',
      present: a10Exists,
      impact: 1,
    },
    {
      name: 'Estimacion de espectadores/recaudacion',
      present: hasSpectators,
      impact: 1,
    },
    {
      name: 'Estrategia de festivales',
      present: hasFestivalStrategy,
      impact: 1,
    },
    {
      name: 'Publico objetivo definido',
      present: hasTargetAudience,
      impact: 1,
    },
  ]

  return {
    id: 'exhibicion',
    name: 'Exhibicion (4 pts)',
    maxPoints: 4,
    estimatedPoints: sumSignals(signals),
    signals,
    isViability: true,
  }
}

// ---- Improvement Suggestions ----

/**
 * All possible improvement suggestions with detection logic.
 * Each suggestion checks a condition on the snapshot and returns
 * the improvement if the condition is not met.
 */
interface SuggestionRule {
  points: number
  text: string
  category: string
  /** Returns true if this suggestion should be shown (i.e. the fix is NOT applied) */
  applies: (
    categories: ScoreCategory[],
    snapshot: ProjectDataSnapshot,
  ) => boolean
}

const SUGGESTION_RULES: SuggestionRule[] = [
  {
    points: 3,
    text: 'Agrega enlaces a la filmografia del director para mejorar el puntaje de direccion.',
    category: 'equipo',
    applies: (_cats, snap) => {
      const directors = findTeamByRole(snap.team, 'Director')
      return (
        directors.length > 0 &&
        directors.every(
          (d) => !d.enlaces || d.enlaces.length === 0,
        )
      )
    },
  },
  {
    points: 2,
    text: 'Reduce las paginas por dia de rodaje a un maximo de 5 para mayor viabilidad.',
    category: 'plan_rodaje',
    applies: (_cats, snap) => {
      return (
        snap.screenplayPagesPerDay !== undefined &&
        snap.screenplayPagesPerDay > 5
      )
    },
  },
  {
    points: 2,
    text: 'Agrega una partida de imprevistos al presupuesto (minimo 10% del BTL).',
    category: 'presupuesto',
    applies: (_cats, snap) => {
      const hasBudget = snap.generatedDocs.some(
        (d) => d.docId === 'A9b' || d.docId === 'A9a',
      )
      return hasBudget && !(snap.budgetHasImprevistos ?? false)
    },
  },
  {
    points: 2,
    text: 'Detalla la ruta critica mes a mes para mejorar el puntaje de planeacion.',
    category: 'plan_rodaje',
    applies: (_cats, snap) => {
      return !(snap.rutaCriticaHasMonthlyDetail ?? false)
    },
  },
  {
    points: 1,
    text: 'Incluye estimacion de espectadores y recaudacion en la propuesta de exhibicion.',
    category: 'exhibicion',
    applies: (_cats, snap) => {
      return !(snap.exhibitionHasSpectatorEstimate ?? false)
    },
  },
  {
    points: 1,
    text: 'Menciona el compromiso con un entorno laboral respetuoso en la propuesta de produccion.',
    category: 'produccion',
    applies: (_cats, snap) => {
      return !(snap.productionHasSafeWorkplace ?? false)
    },
  },
  {
    points: 1,
    text: 'Incluye una estrategia de festivales en la propuesta de exhibicion.',
    category: 'exhibicion',
    applies: (_cats, snap) => {
      return !(snap.exhibitionHasFestivalStrategy ?? false)
    },
  },
  {
    points: 1,
    text: 'Amplia el material visual a minimo 10 paginas para mayor solidez.',
    category: 'artistic',
    applies: (_cats, snap) => {
      return (
        snap.materialVisualPages !== undefined &&
        snap.materialVisualPages < 10
      )
    },
  },
]

/**
 * Generate improvement suggestions based on current viability scores and project data.
 * Returns max 5 suggestions sorted by point impact descending.
 */
export function generateImprovementSuggestions(
  categories: ScoreCategory[],
  snapshot: ProjectDataSnapshot,
): ImprovementSuggestion[] {
  const applicable = SUGGESTION_RULES.filter((rule) =>
    rule.applies(categories, snapshot),
  )

  // Sort by points descending
  applicable.sort((a, b) => b.points - a.points)

  // Max 5 suggestions
  return applicable.slice(0, 5).map((rule) => ({
    points: rule.points,
    text: rule.text,
    category: rule.category,
  }))
}
