/**
 * Unit tests for all 10 blocker validation rules.
 * Pure functions: data in, ValidationResult out.
 */
import { describe, it, expect } from 'vitest'
import { validateFinancialReconciliation } from '../rules/financialReconciliation'
import { validateTitleConsistency } from '../rules/titleConsistency'
import { validateFeeCrossMatch } from '../rules/feeCrossMatch'
import { validateDateCompliance } from '../rules/dateCompliance'
import { validateEficineCompliance } from '../rules/eficineCompliance'
import { validateDocumentCompleteness } from '../rules/documentCompleteness'
import { validateExperienceThresholds } from '../rules/experienceThresholds'
import { validateErpiEligibility } from '../rules/erpiEligibility'
import { validateFileFormatCompliance } from '../rules/fileFormatCompliance'
import { validateProhibitedExpenditure } from '../rules/prohibitedExpenditure'

// ---- VALD-01: Financial Reconciliation ----

describe('VALD-01: Financial Reconciliation', () => {
  it('should skip when all three totals are undefined', () => {
    const result = validateFinancialReconciliation(undefined, undefined, undefined)
    expect(result.ruleId).toBe('VALD-01')
    expect(result.status).toBe('skip')
    expect(result.message).toContain('Genera el presupuesto')
  })

  it('should pass when all three totals are equal', () => {
    const result = validateFinancialReconciliation(1000000, 1000000, 1000000)
    expect(result.status).toBe('pass')
    expect(result.message).toContain('Presupuesto = Flujo de efectivo = Esquema financiero')
  })

  it('should fail when budget != cashflow', () => {
    const result = validateFinancialReconciliation(1000000, 999999, 1000000)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
    expect(result.details).toBeDefined()
    expect(result.details!.length).toBeGreaterThan(0)
  })

  it('should fail when budget != esquema', () => {
    const result = validateFinancialReconciliation(1000000, 1000000, 999999)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
  })

  it('should fail when all three differ', () => {
    const result = validateFinancialReconciliation(1000000, 999999, 999998)
    expect(result.status).toBe('fail')
    expect(result.details!.length).toBe(2)
  })

  it('should use strict integer equality (no tolerance)', () => {
    // Differ by 1 centavo
    const result = validateFinancialReconciliation(100000001, 100000000, 100000001)
    expect(result.status).toBe('fail')
  })
})

// ---- VALD-02: Title Consistency ----

describe('VALD-02: Title Consistency', () => {
  it('should skip when no project title', () => {
    const result = validateTitleConsistency('', [], [])
    expect(result.status).toBe('skip')
    expect(result.message).toContain('No se ha definido el titulo del proyecto')
  })

  it('should pass when all titles match', () => {
    const result = validateTitleConsistency(
      'Mi Pelicula',
      [{ docId: 'A1', title: 'Mi Pelicula' }],
      [{ tipo: 'C2a', title: 'Mi Pelicula' }],
    )
    expect(result.status).toBe('pass')
    expect(result.message).toContain('identico')
  })

  it('should fail when a doc title is different', () => {
    const result = validateTitleConsistency(
      'Mi Pelicula',
      [
        { docId: 'A1', title: 'Mi Pelicula' },
        { docId: 'A3', title: 'Mi Pelicula Diferente' },
      ],
      [],
    )
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
    expect(result.details).toBeDefined()
    expect(result.details!.some((d) => d.includes('A3'))).toBe(true)
  })

  it('should normalize whitespace and unicode NFC before comparison', () => {
    // Extra spaces should be normalized
    const result = validateTitleConsistency(
      'Mi  Pelicula',
      [{ docId: 'A1', title: 'Mi Pelicula' }],
      [],
    )
    expect(result.status).toBe('pass')
  })

  it('should have navigateTo pointing to datos screen', () => {
    const result = validateTitleConsistency('Test', [], [])
    expect(result.navigateTo?.screen).toBe('datos')
  })
})

// ---- VALD-03: Fee Cross-Match ----

describe('VALD-03: Fee Cross-Match', () => {
  it('should skip when no contracts or budget data', () => {
    const result = validateFeeCrossMatch(undefined, undefined, undefined)
    expect(result.status).toBe('skip')
    expect(result.message).toContain('Genera los contratos')
  })

  it('should pass when producer fee matches across contract, budget, cashflow', () => {
    const result = validateFeeCrossMatch(
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200000 },
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200000 },
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200000 },
    )
    expect(result.status).toBe('pass')
  })

  it('should fail when director fee mismatches', () => {
    const result = validateFeeCrossMatch(
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200000 },
      { producerFeeCentavos: 500000, directorFeeCentavos: 310000, screenwriterFeeCentavos: 200000 },
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200000 },
    )
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
    expect(result.details!.some((d) => d.toLowerCase().includes('director'))).toBe(true)
  })

  it('should fail when screenwriter fee mismatches across four sources', () => {
    const result = validateFeeCrossMatch(
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200000 },
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200001 },
      { producerFeeCentavos: 500000, directorFeeCentavos: 300000, screenwriterFeeCentavos: 200000 },
    )
    expect(result.status).toBe('fail')
  })

  it('should have navigateTo pointing to equipo screen', () => {
    const result = validateFeeCrossMatch(
      { producerFeeCentavos: 500000 },
      { producerFeeCentavos: 500001 },
      { producerFeeCentavos: 500000 },
    )
    expect(result.navigateTo?.screen).toBe('equipo')
  })
})

// ---- VALD-04: Date Compliance ----

describe('VALD-04: Date Compliance', () => {
  it('should skip when no docs with dates', () => {
    const result = validateDateCompliance([], new Date('2026-02-13'))
    expect(result.status).toBe('skip')
    expect(result.message).toContain('No hay documentos cargados')
  })

  it('should pass when all within 90 days', () => {
    const closeDate = new Date('2026-02-13')
    const result = validateDateCompliance(
      [{ tipo: 'seguro', fecha_emision: new Date('2025-12-01') }],
      closeDate,
    )
    expect(result.status).toBe('pass')
  })

  it('should fail when a doc is 91 days old', () => {
    const closeDate = new Date('2026-02-13')
    // 91 days before Feb 13 is Nov 14
    const result = validateDateCompliance(
      [{ tipo: 'seguro', fecha_emision: new Date('2025-11-14') }],
      closeDate,
    )
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
  })

  it('should pass at boundary: exactly 90 days', () => {
    const closeDate = new Date('2026-02-13')
    // 90 days before Feb 13 is Nov 15
    const result = validateDateCompliance(
      [{ tipo: 'seguro', fecha_emision: new Date('2025-11-15') }],
      closeDate,
    )
    expect(result.status).toBe('pass')
  })

  it('should have navigateTo pointing to documentos screen', () => {
    const result = validateDateCompliance([], new Date('2026-02-13'))
    expect(result.navigateTo?.screen).toBe('documentos')
  })
})

// ---- VALD-05: EFICINE Compliance ----

describe('VALD-05: EFICINE Compliance', () => {
  it('should skip when budget is zero', () => {
    const result = validateEficineCompliance(0, 0, 0, 0, 0, 0, 0, 0, 0)
    expect(result.status).toBe('skip')
    expect(result.message).toContain('Completa la estructura financiera')
  })

  it('should pass when all rules pass', () => {
    // Total: 10M, ERPI: 3M (30%), EFICINE: 5M (50%), federal: 5M, screenwriter: 400k (4%), inkind: 500k (5%)
    const result = validateEficineCompliance(
      1000000000, // total 10M
      200000000,  // erpiCash 2M
      50000000,   // erpiInkind 500k
      50000000,   // thirdParty 500k
      500000000,  // eficine 5M
      0,          // otherFederal
      40000000,   // screenwriter 400k (4%)
      50000000,   // inkind 500k (5%)
      20000000,   // gestor 200k (4% of 5M)
    )
    expect(result.status).toBe('pass')
  })

  it('should fail when ERPI below 20%', () => {
    // Total: 10M, ERPI: 1M (10%), which is below 20%
    const result = validateEficineCompliance(
      1000000000, // total 10M
      50000000,   // erpiCash 500k
      25000000,   // erpiInkind 250k
      25000000,   // thirdParty 250k
      500000000,  // eficine 5M
      0,
      40000000,   // screenwriter 400k
      50000000,   // inkind 500k
      20000000,   // gestor 200k
    )
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
  })

  it('should have navigateTo pointing to financiera screen', () => {
    const result = validateEficineCompliance(0, 0, 0, 0, 0, 0, 0, 0, 0)
    expect(result.navigateTo?.screen).toBe('financiera')
  })
})

// ---- VALD-06: Document Completeness ----

describe('VALD-06: Document Completeness', () => {
  // Generated docs (from FRONTEND_DOC_REGISTRY docIds)
  const generatedDocIds = [
    'A1', 'A2', 'A4', 'A6', 'A7', 'A8a', 'A8b',
    'A9a', 'A9b', 'A9d', 'A10',
    'B3-prod', 'B3-dir',
    'C2b', 'C3a', 'C3b', 'C4',
    'E1',
  ]

  // Uploaded docs (from DocumentChecklist REQUIRED_UPLOADS tipo values)
  const uploadedDocTypes = [
    'acta_constitutiva', 'poder_notarial', 'cv_productor',
    'identificacion_rep_legal', 'constancia_fiscal',
    'indautor_guion', 'estado_cuenta',
    'cotizacion_seguro', 'cotizacion_contador',
    'contrato_productor', 'contrato_director', 'contrato_guionista',
  ]

  it('should fail when no docs at all', () => {
    const result = validateDocumentCompleteness([], [], {})
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
    expect(result.details!.length).toBeGreaterThan(0)
  })

  it('should pass when all required documents are present', () => {
    const result = validateDocumentCompleteness(
      generatedDocIds,
      uploadedDocTypes,
      {},
    )
    expect(result.status).toBe('pass')
  })

  it('should fail when specific docs are missing', () => {
    // Remove B3-prod and B3-dir from generated
    const withoutContracts = generatedDocIds.filter(
      (id) => id !== 'B3-prod' && id !== 'B3-dir',
    )
    const result = validateDocumentCompleteness(withoutContracts, uploadedDocTypes, {})
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.includes('B3-prod'))).toBe(true)
    expect(result.details!.some((d) => d.includes('B3-dir'))).toBe(true)
  })

  it('should require conditional E docs when conditions are met', () => {
    const result = validateDocumentCompleteness(generatedDocIds, uploadedDocTypes, {
      hasThirdPartyContribution: true,
    })
    // E3 is missing from both arrays, so expect fail
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.includes('E3'))).toBe(true)
  })

  it('should fail when uploaded doc tipo is missing', () => {
    // Remove cv_productor from uploaded tipos
    const withoutCV = uploadedDocTypes.filter((t) => t !== 'cv_productor')
    const result = validateDocumentCompleteness(generatedDocIds, withoutCV, {})
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.includes('cv_productor'))).toBe(true)
  })

  it('should require E2 when hasExclusiveContribution is true', () => {
    // E2 is not in generatedDocIds or uploadedDocTypes
    const result = validateDocumentCompleteness(generatedDocIds, uploadedDocTypes, {
      hasExclusiveContribution: true,
    })
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.includes('E2'))).toBe(true)
  })

  it('should skip E2 when hasExclusiveContribution is false', () => {
    const result = validateDocumentCompleteness(generatedDocIds, uploadedDocTypes, {
      hasExclusiveContribution: false,
    })
    expect(result.status).toBe('pass')
  })

  it('should have navigateTo pointing to documentos screen', () => {
    const result = validateDocumentCompleteness([], [], {})
    expect(result.navigateTo?.screen).toBe('documentos')
  })
})

// ---- VALD-07: Experience Thresholds ----

describe('VALD-07: Experience Thresholds', () => {
  const makeProducer = (
    filmografia: Array<{ formato?: string; exhibicion?: string }>,
    esSocio = true,
  ) => ({
    nombre_completo: 'Juan',
    cargo: 'Productor' as const,
    nacionalidad: 'Mexicana',
    filmografia: filmografia.map((f, i) => ({
      titulo: `Film ${i}`,
      anio: 2020 + i,
      cargo_en_obra: 'Productor',
      formato: f.formato,
      exhibicion: f.exhibicion,
    })),
    honorarios_centavos: 100000,
    aportacion_especie_centavos: 0,
    es_socio_erpi: esSocio,
  })

  const makeDirector = (
    filmografia: Array<{ formato?: string; exhibicion?: string }>,
  ) => ({
    nombre_completo: 'Maria',
    cargo: 'Director' as const,
    nacionalidad: 'Mexicana',
    filmografia: filmografia.map((f, i) => ({
      titulo: `Film ${i}`,
      anio: 2020 + i,
      cargo_en_obra: 'Director',
      formato: f.formato,
      exhibicion: f.exhibicion,
    })),
    honorarios_centavos: 100000,
    aportacion_especie_centavos: 0,
  })

  it('should skip when no producer or director', () => {
    const result = validateExperienceThresholds([], 'Ficcion')
    expect(result.status).toBe('skip')
    expect(result.message).toContain('Agrega la filmografia')
  })

  it('should pass when producer has 1 exhibited feature (fiction)', () => {
    const producer = makeProducer([
      { formato: 'Largometraje', exhibicion: 'exhibido' },
    ])
    const director = makeDirector([
      { formato: 'Largometraje', exhibicion: 'exhibido' },
    ])
    const result = validateExperienceThresholds([producer, director], 'Ficcion')
    expect(result.status).toBe('pass')
  })

  it('should fail when producer has 0 exhibited features (fiction)', () => {
    const producer = makeProducer([
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
    ])
    const director = makeDirector([
      { formato: 'Largometraje', exhibicion: 'exhibido' },
    ])
    const result = validateExperienceThresholds([producer, director], 'Ficcion')
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
  })

  it('should pass animation producer with 3 exhibited shorts', () => {
    const producer = makeProducer([
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
    ])
    const director = makeDirector([
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
    ])
    const result = validateExperienceThresholds([producer, director], 'Animacion')
    expect(result.status).toBe('pass')
  })

  it('should fail fiction director with 0 features and 1 short', () => {
    const producer = makeProducer([
      { formato: 'Largometraje', exhibicion: 'exhibido' },
    ])
    const director = makeDirector([
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
    ])
    const result = validateExperienceThresholds([producer, director], 'Ficcion')
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.toLowerCase().includes('director'))).toBe(true)
  })

  it('should pass animation director with 1 short', () => {
    const producer = makeProducer([
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
    ])
    const director = makeDirector([
      { formato: 'Cortometraje', exhibicion: 'exhibido' },
    ])
    const result = validateExperienceThresholds([producer, director], 'Animacion')
    expect(result.status).toBe('pass')
  })

  it('should fail when producer is not ERPI partner', () => {
    const producer = makeProducer(
      [{ formato: 'Largometraje', exhibicion: 'exhibido' }],
      false, // not ERPI partner
    )
    const director = makeDirector([
      { formato: 'Largometraje', exhibicion: 'exhibido' },
    ])
    const result = validateExperienceThresholds([producer, director], 'Ficcion')
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.includes('socio'))).toBe(true)
  })

  it('should have navigateTo pointing to equipo screen', () => {
    const result = validateExperienceThresholds([], 'Ficcion')
    expect(result.navigateTo?.screen).toBe('equipo')
  })
})

// ---- VALD-08: ERPI Eligibility ----

describe('VALD-08: ERPI Eligibility', () => {
  it('should pass when no prior projects', () => {
    const result = validateErpiEligibility([], 1, 1)
    expect(result.status).toBe('pass')
  })

  it('should fail when 2 unexhibited authorized projects', () => {
    const projects = [
      { titulo: 'A', anio: 2024, exhibido: false, estatus: 'no_exhibido' as const, monto_recibido_centavos: 100 },
      { titulo: 'B', anio: 2025, exhibido: false, estatus: 'no_exhibido' as const, monto_recibido_centavos: 200 },
    ]
    const result = validateErpiEligibility(projects, 1, 1)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
  })

  it('should pass when 1 unexhibited', () => {
    const projects = [
      { titulo: 'A', anio: 2024, exhibido: false, estatus: 'no_exhibido' as const, monto_recibido_centavos: 100 },
      { titulo: 'B', anio: 2023, exhibido: true, estatus: 'exhibido' as const, monto_recibido_centavos: 200 },
    ]
    const result = validateErpiEligibility(projects, 1, 1)
    expect(result.status).toBe('pass')
  })

  it('should fail when 4 submissions this period', () => {
    const result = validateErpiEligibility([], 4, 1)
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.includes('3'))).toBe(true)
  })

  it('should fail when 4 attempts for this project', () => {
    const result = validateErpiEligibility([], 1, 4)
    expect(result.status).toBe('fail')
    expect(result.details!.some((d) => d.includes('3'))).toBe(true)
  })

  it('should have navigateTo pointing to erpi screen', () => {
    const result = validateErpiEligibility([], 1, 1)
    expect(result.navigateTo?.screen).toBe('erpi')
  })
})

// ---- VALD-09: File Format Compliance ----

describe('VALD-09: File Format Compliance', () => {
  it('should skip when no files', () => {
    const result = validateFileFormatCompliance([])
    expect(result.status).toBe('skip')
    expect(result.message).toContain('No hay archivos de salida para validar')
  })

  it('should pass when all files are valid', () => {
    const files = [
      { name: 'A1_ResumenEjec.pdf', format: 'PDF', sizeMB: 2 },
      { name: 'B3_ContProd.pdf', format: 'PDF', sizeMB: 5 },
    ]
    const result = validateFileFormatCompliance(files)
    expect(result.status).toBe('pass')
  })

  it('should fail when filename > 15 chars', () => {
    const files = [
      { name: 'A1_ResumenEjecutivoDelProyecto.pdf', format: 'PDF', sizeMB: 2 },
    ]
    const result = validateFileFormatCompliance(files)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
  })

  it('should fail when filename contains accents', () => {
    // "Resena" without accent is fine, so test with n-tilde
    const files = [
      { name: 'A1_Rese\u00f1a.pdf', format: 'PDF', sizeMB: 2 },
    ]
    const result = validateFileFormatCompliance(files)
    expect(result.status).toBe('fail')
  })

  it('should fail when file > 40MB', () => {
    const files = [
      { name: 'A3_Guion.pdf', format: 'PDF', sizeMB: 41 },
    ]
    const result = validateFileFormatCompliance(files)
    expect(result.status).toBe('fail')
  })
})

// ---- VALD-10: Prohibited Expenditure ----

describe('VALD-10: Prohibited Expenditure', () => {
  it('should skip when no cash flow data', () => {
    const result = validateProhibitedExpenditure(undefined)
    expect(result.status).toBe('skip')
    expect(result.message).toContain('Genera el flujo de efectivo')
  })

  it('should pass when no EFICINE funds in prohibited categories', () => {
    const lineItems = [
      { category: 'honorarios_produccion', source: 'EFICINE', amount: 500000 },
      { category: 'gastos_previos_al_estimulo', source: 'ERPI', amount: 100000 },
    ]
    const result = validateProhibitedExpenditure(lineItems)
    expect(result.status).toBe('pass')
  })

  it('should fail when EFICINE funds in prohibited category', () => {
    const lineItems = [
      { category: 'gastos_previos_al_estimulo', source: 'EFICINE', amount: 100000 },
    ]
    const result = validateProhibitedExpenditure(lineItems)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
  })

  it('should pass when non-EFICINE funds in prohibited category', () => {
    const lineItems = [
      { category: 'gastos_previos_al_estimulo', source: 'ERPI', amount: 100000 },
      { category: 'distribucion_difusion_comercializacion', source: 'Terceros', amount: 50000 },
    ]
    const result = validateProhibitedExpenditure(lineItems)
    expect(result.status).toBe('pass')
  })

  it('should have navigateTo pointing to generacion screen', () => {
    const result = validateProhibitedExpenditure(undefined)
    expect(result.navigateTo?.screen).toBe('generacion')
  })
})
