/**
 * Integration tests for the validation engine orchestrator.
 * Tests runInstantRules, runMediumRules, runAllRules, and exported constants.
 */
import { describe, it, expect } from 'vitest'
import {
  runInstantRules,
  runMediumRules,
  runAllRules,
  INSTANT_RULE_IDS,
  MEDIUM_RULE_IDS,
} from '../engine'
import type { ProjectDataSnapshot } from '../types'

/** Minimal empty snapshot where all rules should skip. */
function emptySnapshot(): ProjectDataSnapshot {
  return {
    metadata: {
      titulo_proyecto: '',
      categoria_cinematografica: '',
      periodo_registro: '',
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

/** Snapshot with valid data that should pass most rules. */
function validSnapshot(): ProjectDataSnapshot {
  return {
    metadata: {
      titulo_proyecto: 'Mi Pelicula',
      categoria_cinematografica: 'Ficcion',
      periodo_registro: 'periodo_1_2026',
      costo_total_proyecto_centavos: 1000000000, // $10M MXN
      monto_solicitado_eficine_centavos: 500000000,
    },
    team: [
      {
        id: 'p1',
        nombre_completo: 'Ana Lopez',
        cargo: 'Productor',
        filmografia: [
          { titulo: 'Film 1', anio: 2020, formato: 'Largometraje', exhibicion: 'exhibido', rol: 'Productor' },
        ],
        es_socio_erpi: true,
        nacionalidad: 'Mexicana',
        email: 'ana@test.com',
        telefono: '5551234567',
      },
      {
        id: 'd1',
        nombre_completo: 'Carlos Garcia',
        cargo: 'Director',
        filmografia: [
          { titulo: 'Film 2', anio: 2019, formato: 'Largometraje', exhibicion: 'exhibido', rol: 'Director' },
        ],
        nacionalidad: 'Mexicana',
        email: 'carlos@test.com',
        telefono: '5559876543',
      },
    ] as ProjectDataSnapshot['team'],
    financials: {
      erpiCashCentavos: 300000000,
      erpiInkindCentavos: 0,
      thirdPartyCentavos: 0,
      otherFederalCentavos: 0,
      screenwriterFeeCentavos: 50000000,
      totalInkindHonorariosCentavos: 0,
      gestorFeeCentavos: 20000000,
    },
    erpiSettings: null,
    submissionsThisPeriod: 1,
    projectAttempts: 1,
    uploadedDocs: [],
    generatedDocs: [],
    budgetTotalCentavos: 1000000000,
    cashFlowTotalCentavos: 1000000000,
    esquemaTotalCentavos: 1000000000,
    feesFromContracts: {
      producerFeeCentavos: 100000000,
      directorFeeCentavos: 80000000,
      screenwriterFeeCentavos: 50000000,
    },
    feesFromBudget: {
      producerFeeCentavos: 100000000,
      directorFeeCentavos: 80000000,
      screenwriterFeeCentavos: 50000000,
    },
    feesFromCashFlow: {
      producerFeeCentavos: 100000000,
      directorFeeCentavos: 80000000,
      screenwriterFeeCentavos: 50000000,
    },
    outputFiles: [
      { name: 'A1_RESUMEN_MP.pdf', format: 'pdf', sizeMB: 1 },
    ],
  }
}

// ───────────────────────────────────────────
// INSTANT_RULE_IDS / MEDIUM_RULE_IDS
// ───────────────────────────────────────────
describe('Rule tier constants', () => {
  it('INSTANT_RULE_IDS has 12 entries', () => {
    expect(INSTANT_RULE_IDS).toHaveLength(12)
  })

  it('MEDIUM_RULE_IDS equals [VALD-10, VALD-11]', () => {
    expect([...MEDIUM_RULE_IDS]).toEqual(['VALD-10', 'VALD-11'])
  })

  it('no overlap between instant and medium sets', () => {
    const instantSet = new Set(INSTANT_RULE_IDS)
    for (const id of MEDIUM_RULE_IDS) {
      expect(instantSet.has(id)).toBe(false)
    }
  })
})

// ───────────────────────────────────────────
// runInstantRules
// ───────────────────────────────────────────
describe('runInstantRules', () => {
  it('returns exactly 12 results', () => {
    const report = runInstantRules(emptySnapshot())
    expect(report.results).toHaveLength(12)
  })

  it('empty snapshot -> most instant rules return skip or fail, no crash', () => {
    const report = runInstantRules(emptySnapshot())
    // Each result must have a valid status
    for (const result of report.results) {
      expect(['skip', 'pass', 'fail']).toContain(result.status)
    }
    // Rules that lack data should skip (financial, title, fees, date, experience, ERPI)
    const skippedIds = report.skipped.map((r) => r.ruleId)
    expect(skippedIds).toContain('VALD-01') // no budget/cashflow/esquema
    expect(skippedIds).toContain('VALD-02') // no title
    expect(skippedIds).toContain('VALD-03') // no fees
    expect(skippedIds).toContain('VALD-07') // no team
    expect(skippedIds).toContain('VALD-12') // no links
    expect(skippedIds).toContain('VALD-17') // no expirable docs
  })

  it('valid project with matching financials -> financial rules pass', () => {
    const report = runInstantRules(validSnapshot())
    // Financial rules (VALD-01, VALD-03, VALD-05) should pass with matched data
    const vald01 = report.results.find((r) => r.ruleId === 'VALD-01')
    const vald03 = report.results.find((r) => r.ruleId === 'VALD-03')
    expect(vald01?.status).toBe('pass')
    expect(vald03?.status).toBe('pass')
  })

  it('project with 1 blocker violation -> canExport false', () => {
    const snap = validSnapshot()
    // Make financial totals mismatch (VALD-01 fail)
    snap.budgetTotalCentavos = 1000000000
    snap.cashFlowTotalCentavos = 999999999
    const report = runInstantRules(snap)
    expect(report.canExport).toBe(false)
    expect(report.blockers.length).toBeGreaterThanOrEqual(1)
  })

  it('canExport is true when all blocker rules pass or skip (warnings ignored)', () => {
    const report = runInstantRules(emptySnapshot())
    // With empty data, some blocker rules skip and some fail (e.g. VALD-06 completeness)
    // canExport = false if any blocker fails
    // This verifies the canExport gating logic
    const blockerFails = report.results.filter(
      (r) => r.severity === 'blocker' && r.status === 'fail',
    )
    if (blockerFails.length > 0) {
      expect(report.canExport).toBe(false)
    } else {
      expect(report.canExport).toBe(true)
    }
  })

  it('does NOT include VALD-10 or VALD-11 results', () => {
    const report = runInstantRules(emptySnapshot())
    const ruleIds = report.results.map((r) => r.ruleId)
    expect(ruleIds).not.toContain('VALD-10')
    expect(ruleIds).not.toContain('VALD-11')
  })

  it('all 12 instant rule IDs are present in results', () => {
    const report = runInstantRules(emptySnapshot())
    const ruleIds = report.results.map((r) => r.ruleId)
    for (const id of INSTANT_RULE_IDS) {
      expect(ruleIds).toContain(id)
    }
  })
})

// ───────────────────────────────────────────
// runMediumRules
// ───────────────────────────────────────────
describe('runMediumRules', () => {
  it('returns exactly 2 results', () => {
    const report = runMediumRules(emptySnapshot())
    expect(report.results).toHaveLength(2)
  })

  it('empty data -> VALD-10 and VALD-11 both skip', () => {
    const report = runMediumRules(emptySnapshot())
    const vald10 = report.results.find((r) => r.ruleId === 'VALD-10')
    const vald11 = report.results.find((r) => r.ruleId === 'VALD-11')
    expect(vald10?.status).toBe('skip')
    expect(vald11?.status).toBe('skip')
  })

  it('prohibited expenditure detected -> returns 1 blocker result', () => {
    const snap = emptySnapshot()
    snap.cashFlowLineItems = [
      { category: 'gastos_previos_al_estimulo', source: 'EFICINE', amount: 50000 },
    ]
    const report = runMediumRules(snap)
    const vald10 = report.results.find((r) => r.ruleId === 'VALD-10')
    expect(vald10?.status).toBe('fail')
    expect(vald10?.severity).toBe('blocker')
  })
})

// ───────────────────────────────────────────
// runAllRules
// ───────────────────────────────────────────
describe('runAllRules', () => {
  it('returns exactly 14 results', () => {
    const report = runAllRules(emptySnapshot())
    expect(report.results).toHaveLength(14)
  })

  it('report.blockers only contains severity=blocker && status=fail', () => {
    const report = runAllRules(validSnapshot())
    for (const result of report.blockers) {
      expect(result.severity).toBe('blocker')
      expect(result.status).toBe('fail')
    }
  })

  it('report.warnings only contains severity=warning && status=fail', () => {
    const report = runAllRules(validSnapshot())
    for (const result of report.warnings) {
      expect(result.severity).toBe('warning')
      expect(result.status).toBe('fail')
    }
  })

  it('report.passed only contains status=pass', () => {
    const report = runAllRules(validSnapshot())
    for (const result of report.passed) {
      expect(result.status).toBe('pass')
    }
  })

  it('report.skipped only contains status=skip', () => {
    const report = runAllRules(emptySnapshot())
    for (const result of report.skipped) {
      expect(result.status).toBe('skip')
    }
  })

  it('report.timestamp is a Date', () => {
    const report = runAllRules(emptySnapshot())
    expect(report.timestamp).toBeInstanceOf(Date)
  })

  it('canExport reflects whether any blocker rule failed', () => {
    const report = runAllRules(emptySnapshot())
    const blockerFails = report.results.filter(
      (r) => r.severity === 'blocker' && r.status === 'fail',
    )
    // canExport should be true IFF no blocker failed
    expect(report.canExport).toBe(blockerFails.length === 0)
  })

  it('warning-only failures do not block export', () => {
    // Build a snapshot where all blocker rules skip/pass but warnings fail
    const snap = emptySnapshot()
    // VALD-13 (warning) will fail with empty BonusCheckInput (no bonus eligible)
    // All blocker rules should skip due to empty data
    const report = runAllRules(snap)
    const warningFails = report.results.filter(
      (r) => r.severity === 'warning' && r.status === 'fail',
    )
    const blockerFails = report.results.filter(
      (r) => r.severity === 'blocker' && r.status === 'fail',
    )
    // Even if we have warning failures, canExport depends only on blockers
    if (blockerFails.length === 0 && warningFails.length > 0) {
      expect(report.canExport).toBe(true)
    }
  })

  it('canExport is false when any blocker fails', () => {
    const snap = validSnapshot()
    // Force a financial mismatch (VALD-01 blocker)
    snap.budgetTotalCentavos = 1000000000
    snap.cashFlowTotalCentavos = 1
    const report = runAllRules(snap)
    expect(report.canExport).toBe(false)
  })
})
