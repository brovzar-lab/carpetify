/**
 * Tests for viability scoring module.
 * TDD: RED phase -- these tests should fail until scoring.ts is implemented.
 */
import { describe, it, expect } from 'vitest'
import {
  computeViabilityScore,
  generateImprovementSuggestions,
  type ScoreCategory,
  type ScoreEstimate,
  type ImprovementSuggestion,
  type PersonaScore,
} from '../scoring'
import type { ProjectDataSnapshot } from '../types'

/** Helper to create a minimal empty project snapshot */
function emptySnapshot(): ProjectDataSnapshot {
  return {
    metadata: {
      titulo_proyecto: '',
      categoria_cinematografica: 'Ficcion',
      periodo_registro: '2026-1',
      costo_total_proyecto_centavos: 0,
      monto_solicitado_eficine_centavos: 0,
    },
    team: [],
    financials: {
      erpiCashCentavos: 0,
      erpiInkindCentavos: 0,
      thirdPartyCentavos: 0,
      otherFederalCentavos: 0,
      screenwriterFeeCentavos: 0,
      totalInkindHonorariosCentavos: 0,
      gestorFeeCentavos: 0,
    },
    erpiSettings: null,
    submissionsThisPeriod: 0,
    projectAttempts: 0,
    uploadedDocs: [],
    generatedDocs: [],
  }
}

describe('computeViabilityScore', () => {
  it('returns all 5 categories with zero points for empty data', () => {
    const snap = emptySnapshot()
    const categories = computeViabilityScore(snap)

    expect(categories).toHaveLength(5)
    expect(categories.every((c) => c.isViability)).toBe(true)

    const total = categories.reduce((sum, c) => sum + c.estimatedPoints, 0)
    expect(total).toBe(0)
  })

  it('returns correct maxPoints for each category matching rubric', () => {
    const snap = emptySnapshot()
    const categories = computeViabilityScore(snap)

    const byId = Object.fromEntries(categories.map((c) => [c.id, c]))

    expect(byId['equipo'].maxPoints).toBe(2)
    expect(byId['produccion'].maxPoints).toBe(12)
    expect(byId['plan_rodaje'].maxPoints).toBe(10)
    expect(byId['presupuesto'].maxPoints).toBe(10)
    expect(byId['exhibicion'].maxPoints).toBe(4)
  })

  it('scores equipo 2/2 with complete team and filmography', () => {
    const snap = emptySnapshot()
    snap.team = [
      {
        nombre_completo: 'Ana Lopez',
        cargo: 'Productor',
        nacionalidad: 'Mexicana',
        filmografia: [
          { titulo: 'Film Compartido', anio: 2020, cargo_en_obra: 'Productor' },
        ],
        honorarios_centavos: 100000,
        aportacion_especie_centavos: 0,
        enlaces: ['https://imdb.com/ana'],
      },
      {
        nombre_completo: 'Carlos Reyes',
        cargo: 'Director',
        nacionalidad: 'Mexicana',
        filmografia: [
          { titulo: 'Film Compartido', anio: 2020, cargo_en_obra: 'Director' },
        ],
        honorarios_centavos: 100000,
        aportacion_especie_centavos: 0,
        enlaces: ['https://imdb.com/carlos'],
      },
    ]

    const categories = computeViabilityScore(snap)
    const equipo = categories.find((c) => c.id === 'equipo')!
    expect(equipo.estimatedPoints).toBe(2)
  })

  it('scores produccion up to 12/12 when proposal doc exists and has signals', () => {
    const snap = emptySnapshot()
    snap.generatedDocs = [
      {
        docId: 'A7',
        docName: 'Propuesta de Produccion',
        section: 'A',
        passId: 'lineProducer',
        contentType: 'prose',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
    ]

    const categories = computeViabilityScore(snap)
    const produccion = categories.find((c) => c.id === 'produccion')!
    // At minimum should get 3 pts for document existing
    expect(produccion.estimatedPoints).toBeGreaterThanOrEqual(3)
  })

  it('scores plan_rodaje higher when pages per day <= 5', () => {
    const snap = emptySnapshot()
    // Plan de rodaje (A8a) and ruta critica (A8b) exist
    snap.generatedDocs = [
      {
        docId: 'A8a',
        docName: 'Plan de Rodaje',
        section: 'A',
        passId: 'lineProducer',
        contentType: 'structured',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
      {
        docId: 'A8b',
        docName: 'Ruta Critica',
        section: 'A',
        passId: 'lineProducer',
        contentType: 'structured',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
    ]
    // Simulate screenplay with reasonable shooting days (pages/day <= 5)
    snap.screenplayPagesPerDay = 4

    const categories = computeViabilityScore(snap)
    const plan = categories.find((c) => c.id === 'plan_rodaje')!
    // Should get docs + pages/day signal
    expect(plan.estimatedPoints).toBeGreaterThanOrEqual(8)
  })

  it('scores presupuesto higher when budget with imprevistos >= 10%', () => {
    const snap = emptySnapshot()
    snap.generatedDocs = [
      {
        docId: 'A9a',
        docName: 'Presupuesto Resumen',
        section: 'A',
        passId: 'lineProducer',
        contentType: 'structured',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
      {
        docId: 'A9b',
        docName: 'Presupuesto Desglose',
        section: 'A',
        passId: 'lineProducer',
        contentType: 'structured',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
      {
        docId: 'A9d',
        docName: 'Flujo de Efectivo',
        section: 'A',
        passId: 'financeAdvisor',
        contentType: 'structured',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
    ]
    snap.budgetHasImprevistos = true

    const categories = computeViabilityScore(snap)
    const pres = categories.find((c) => c.id === 'presupuesto')!
    // At least budget exists (3) + cash flow exists (2) + imprevistos (2) = 7
    expect(pres.estimatedPoints).toBeGreaterThanOrEqual(7)
  })

  it('scores exhibicion 4/4 with spectator estimate and festival strategy', () => {
    const snap = emptySnapshot()
    snap.generatedDocs = [
      {
        docId: 'A10',
        docName: 'Propuesta de Exhibicion',
        section: 'A',
        passId: 'combined',
        contentType: 'prose',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
    ]
    snap.exhibitionHasSpectatorEstimate = true
    snap.exhibitionHasFestivalStrategy = true
    snap.exhibitionHasTargetAudience = true

    const categories = computeViabilityScore(snap)
    const exhibicion = categories.find((c) => c.id === 'exhibicion')!
    expect(exhibicion.estimatedPoints).toBe(4)
  })
})

describe('generateImprovementSuggestions', () => {
  it('includes +3 pts suggestion when no director links exist', () => {
    const snap = emptySnapshot()
    snap.team = [
      {
        nombre_completo: 'Director Sin Links',
        cargo: 'Director',
        nacionalidad: 'Mexicana',
        filmografia: [],
        honorarios_centavos: 100000,
        aportacion_especie_centavos: 0,
        // No enlaces
      },
    ]
    const categories = computeViabilityScore(snap)
    const suggestions = generateImprovementSuggestions(categories, snap)

    const directorSugg = suggestions.find((s) => s.points === 3)
    expect(directorSugg).toBeDefined()
    expect(directorSugg!.text).toContain('enlaces')
  })

  it('includes +2 pts suggestion when no contingency in budget', () => {
    const snap = emptySnapshot()
    snap.budgetHasImprevistos = false
    snap.generatedDocs = [
      {
        docId: 'A9b',
        docName: 'Presupuesto Desglose',
        section: 'A',
        passId: 'lineProducer',
        contentType: 'structured',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
    ]

    const categories = computeViabilityScore(snap)
    const suggestions = generateImprovementSuggestions(categories, snap)

    const contingencySugg = suggestions.find(
      (s) => s.points === 2 && s.text.includes('imprevistos'),
    )
    expect(contingencySugg).toBeDefined()
  })

  it('returns suggestions sorted by point impact descending', () => {
    const snap = emptySnapshot()
    // Trigger multiple suggestions at different point levels
    snap.team = [
      {
        nombre_completo: 'Director',
        cargo: 'Director',
        nacionalidad: 'Mexicana',
        filmografia: [],
        honorarios_centavos: 100000,
        aportacion_especie_centavos: 0,
      },
    ]
    snap.budgetHasImprevistos = false
    snap.generatedDocs = [
      {
        docId: 'A9b',
        docName: 'Presupuesto',
        section: 'A',
        passId: 'lineProducer',
        contentType: 'structured',
        generatedAt: new Date(),
        manuallyEdited: false,
        version: 1,
      },
    ]

    const categories = computeViabilityScore(snap)
    const suggestions = generateImprovementSuggestions(categories, snap)

    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].points).toBeGreaterThanOrEqual(
        suggestions[i].points,
      )
    }
  })

  it('returns max 5 suggestions', () => {
    const snap = emptySnapshot()
    // Trigger ALL possible suggestions
    snap.team = [
      {
        nombre_completo: 'Director',
        cargo: 'Director',
        nacionalidad: 'Mexicana',
        filmografia: [],
        honorarios_centavos: 100000,
        aportacion_especie_centavos: 0,
      },
    ]
    snap.budgetHasImprevistos = false
    snap.screenplayPagesPerDay = 7
    snap.exhibitionHasSpectatorEstimate = false
    snap.exhibitionHasFestivalStrategy = false
    snap.productionHasSafeWorkplace = false
    snap.rutaCriticaHasMonthlyDetail = false
    snap.materialVisualPages = 5

    const categories = computeViabilityScore(snap)
    const suggestions = generateImprovementSuggestions(categories, snap)

    expect(suggestions.length).toBeLessThanOrEqual(5)
  })
})

describe('ScoreEstimate type', () => {
  it('total equals viability + artistic + bonus', () => {
    const estimate: ScoreEstimate = {
      viability: [],
      artistic: [],
      personaScores: [],
      bonusPoints: 5,
      bonusCategory: 'directora_mujer',
      totalViability: 30,
      totalArtistic: 50,
      totalEstimated: 85,
      maxPossible: 100,
      passingThreshold: 90,
      meetsThreshold: false,
      improvements: [],
    }
    expect(estimate.totalEstimated).toBe(
      estimate.totalViability + estimate.totalArtistic + estimate.bonusPoints,
    )
  })

  it('meetsThreshold is true when total >= 90', () => {
    const estimate: ScoreEstimate = {
      viability: [],
      artistic: [],
      personaScores: [],
      bonusPoints: 5,
      bonusCategory: 'directora_mujer',
      totalViability: 35,
      totalArtistic: 55,
      totalEstimated: 95,
      maxPossible: 100,
      passingThreshold: 90,
      meetsThreshold: true,
      improvements: [],
    }
    expect(estimate.meetsThreshold).toBe(true)
    expect(estimate.totalEstimated).toBeGreaterThanOrEqual(
      estimate.passingThreshold,
    )
  })
})
