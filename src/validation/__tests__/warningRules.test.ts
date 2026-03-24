/**
 * Unit tests for all 4 warning validation rules.
 * Pure functions: data in, ValidationResult out.
 */
import { describe, it, expect } from 'vitest'
import { validateRutaCriticaSync } from '../rules/rutaCriticaSync'
import { validateHyperlinkAccessibility } from '../rules/hyperlinkAccessibility'
import {
  validateBonusEligibility,
  type BonusCheckInput,
} from '../rules/bonusEligibility'
import { validateDocumentExpiration } from '../rules/documentExpiration'

// ---- VALD-11: Ruta Critica Sync ----

describe('VALD-11: Ruta Critica Sync', () => {
  it('should skip when no ruta critica data', () => {
    const result = validateRutaCriticaSync([], [{ etapa: 'Preproduccion', months: [1, 2] }])
    expect(result.ruleId).toBe('VALD-11')
    expect(result.status).toBe('skip')
    expect(result.severity).toBe('warning')
    expect(result.message).toContain('ruta critica')
  })

  it('should skip when no cash flow data', () => {
    const result = validateRutaCriticaSync([{ etapa: 'Preproduccion', months: [1, 2] }], [])
    expect(result.status).toBe('skip')
  })

  it('should pass when all stages align', () => {
    const ruta = [
      { etapa: 'Preproduccion', months: [1, 2] },
      { etapa: 'Rodaje', months: [3, 4] },
      { etapa: 'Postproduccion', months: [5, 6] },
    ]
    const cashFlow = [
      { etapa: 'Preproduccion', months: [1, 2, 3] },
      { etapa: 'Rodaje', months: [3, 4] },
      { etapa: 'Postproduccion', months: [5, 6, 7] },
    ]
    const result = validateRutaCriticaSync(ruta, cashFlow)
    expect(result.status).toBe('pass')
    expect(result.message).toContain('alineados')
  })

  it('should fail when rodaje in month 3 but no production spending in month 3', () => {
    const ruta = [
      { etapa: 'Preproduccion', months: [1, 2] },
      { etapa: 'Rodaje', months: [3, 4] },
    ]
    const cashFlow = [
      { etapa: 'Preproduccion', months: [1, 2] },
      { etapa: 'Rodaje', months: [5, 6] },
    ]
    const result = validateRutaCriticaSync(ruta, cashFlow)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('warning')
    expect(result.details).toBeDefined()
    expect(result.details!.length).toBe(1)
    expect(result.details![0]).toContain('Rodaje')
  })

  it('should report multiple mismatched stages', () => {
    const ruta = [
      { etapa: 'Preproduccion', months: [1] },
      { etapa: 'Rodaje', months: [3] },
      { etapa: 'Postproduccion', months: [5] },
    ]
    const cashFlow = [
      { etapa: 'Preproduccion', months: [2] },
      { etapa: 'Rodaje', months: [4] },
      { etapa: 'Postproduccion', months: [5] },
    ]
    const result = validateRutaCriticaSync(ruta, cashFlow)
    expect(result.status).toBe('fail')
    expect(result.details!.length).toBe(2)
  })

  it('should navigate to generacion screen', () => {
    const result = validateRutaCriticaSync([], [])
    expect(result.navigateTo).toEqual({ screen: 'generacion' })
  })
})

// ---- VALD-12: Hyperlink Accessibility ----

describe('VALD-12: Hyperlink Accessibility', () => {
  it('should skip when no links provided', () => {
    const result = validateHyperlinkAccessibility([])
    expect(result.ruleId).toBe('VALD-12')
    expect(result.status).toBe('skip')
    expect(result.severity).toBe('warning')
    expect(result.message).toContain('enlaces')
  })

  it('should pass when all links are verified and accessible', () => {
    const links = [
      { url: 'https://vimeo.com/123', label: 'Corto 1', verified: true, accessible: true },
      { url: 'https://youtube.com/456', label: 'Corto 2', verified: true, accessible: true },
    ]
    const result = validateHyperlinkAccessibility(links)
    expect(result.status).toBe('pass')
    expect(result.message).toContain('accesibles')
  })

  it('should fail when some links are not verified', () => {
    const links = [
      { url: 'https://vimeo.com/123', label: 'Corto 1', verified: true, accessible: true },
      { url: 'https://youtube.com/456', label: 'Corto 2', verified: false, accessible: false },
    ]
    const result = validateHyperlinkAccessibility(links)
    expect(result.status).toBe('fail')
    expect(result.details).toBeDefined()
    expect(result.details!.length).toBe(1)
    expect(result.details![0]).toContain('no verificado')
  })

  it('should fail when some links are inaccessible', () => {
    const links = [
      { url: 'https://vimeo.com/123', label: 'Corto 1', verified: true, accessible: false },
      { url: 'https://youtube.com/456', label: 'Corto 2', verified: true, accessible: true },
    ]
    const result = validateHyperlinkAccessibility(links)
    expect(result.status).toBe('fail')
    expect(result.details!.length).toBe(1)
  })

  it('should navigate to equipo screen', () => {
    const result = validateHyperlinkAccessibility([])
    expect(result.navigateTo).toEqual({ screen: 'equipo' })
  })
})

// ---- VALD-13: Bonus Eligibility ----

const baseBonusInput: BonusCheckInput = {
  directorEsMujer: false,
  directorEsIndigenaAfromexicano: false,
  directorEsCodireccionConHombre: false,
  directorEsCodireccionConNoMiembro: false,
  cartaAutoadscripcionUploaded: false,
  directorOrigenFueraZMCM: false,
  productorOrigenFueraZMCM: false,
  porcentajeRodajeFueraZMCM: 0,
  porcentajePersonalCreativoLocal: 0,
  porcentajePersonalTecnicoLocal: 0,
  erpiDomicilioFueraZMCM: false,
  allCreativeTeamQualify: false,
  noCodireccionConNoQualifying: false,
}

describe('VALD-13: Bonus Eligibility', () => {
  it('should fail when no categories are met', () => {
    const result = validateBonusEligibility(baseBonusInput)
    expect(result.ruleId).toBe('VALD-13')
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('warning')
    expect(result.message).toContain('No se detecta')
  })

  it('should pass for (a) female director without co-direction with man', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      directorEsMujer: true,
      directorEsCodireccionConHombre: false,
    })
    expect(result.status).toBe('pass')
    expect(result.message).toContain('(a)')
    expect(result.message).toContain('Directora mujer')
  })

  it('should not qualify (a) if co-direction with man', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      directorEsMujer: true,
      directorEsCodireccionConHombre: true,
    })
    expect(result.status).toBe('fail')
  })

  it('should pass for (b) indigenous director with carta uploaded', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      directorEsIndigenaAfromexicano: true,
      directorEsCodireccionConNoMiembro: false,
      cartaAutoadscripcionUploaded: true,
    })
    expect(result.status).toBe('pass')
    expect(result.message).toContain('(b)')
  })

  it('should not qualify (b) when carta is missing', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      directorEsIndigenaAfromexicano: true,
      directorEsCodireccionConNoMiembro: false,
      cartaAutoadscripcionUploaded: false,
    })
    expect(result.status).toBe('fail')
    expect(result.details).toBeDefined()
    expect(result.details!.some((d) => d.includes('carta'))).toBe(true)
  })

  it('should pass for (c) regional decentralization with >=75% filming outside ZMCM', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      directorOrigenFueraZMCM: true,
      porcentajeRodajeFueraZMCM: 80,
      porcentajePersonalCreativoLocal: 60,
      porcentajePersonalTecnicoLocal: 55,
      erpiDomicilioFueraZMCM: true,
    })
    expect(result.status).toBe('pass')
    expect(result.message).toContain('(c)')
  })

  it('should also qualify (c) when producer is from outside ZMCM', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      productorOrigenFueraZMCM: true,
      porcentajeRodajeFueraZMCM: 75,
      porcentajePersonalCreativoLocal: 50,
      porcentajePersonalTecnicoLocal: 50,
      erpiDomicilioFueraZMCM: true,
    })
    expect(result.status).toBe('pass')
    expect(result.message).toContain('(c)')
  })

  it('should pass for (d) 100% qualifying creative team', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      allCreativeTeamQualify: true,
      noCodireccionConNoQualifying: true,
    })
    expect(result.status).toBe('pass')
    expect(result.message).toContain('(d)')
  })

  it('should recommend first eligible in (a,b,c,d) order when multiple qualify', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      directorEsMujer: true,
      directorEsCodireccionConHombre: false,
      allCreativeTeamQualify: true,
      noCodireccionConNoQualifying: true,
    })
    expect(result.status).toBe('pass')
    // (a) should be recommended since it comes first
    expect(result.message).toContain('(a)')
    // But metadata should list all eligible categories
    expect(result.metadata).toBeDefined()
    expect((result.metadata!.eligibleCategories as string[]).length).toBe(2)
  })

  it('should include metadata with recommended category', () => {
    const result = validateBonusEligibility({
      ...baseBonusInput,
      allCreativeTeamQualify: true,
      noCodireccionConNoQualifying: true,
    })
    expect(result.metadata).toBeDefined()
    expect(result.metadata!.recommended).toBeDefined()
    expect(result.metadata!.eligibleCategories).toBeDefined()
  })

  it('should navigate to equipo screen', () => {
    const result = validateBonusEligibility(baseBonusInput)
    expect(result.navigateTo).toEqual({ screen: 'equipo' })
  })
})

// ---- VALD-17: Document Expiration ----

describe('VALD-17: Document Expiration', () => {
  // Helper to create an uploaded document
  const makeDoc = (tipo: string, fecha_emision: Date) => ({
    tipo,
    filename: `${tipo}.pdf`,
    storagePath: `/uploads/${tipo}.pdf`,
    uploadedAt: new Date(),
    fecha_emision,
    status: 'uploaded' as const,
  })

  // Period 1 closes 2026-02-13
  const periodo = '2026-P1'

  it('should skip when no expirable docs exist', () => {
    const result = validateDocumentExpiration([], periodo)
    expect(result.ruleId).toBe('VALD-17')
    expect(result.status).toBe('skip')
    expect(result.message).toContain('documentos')
  })

  it('should skip when docs have no fecha_emision', () => {
    const docs = [{
      tipo: 'seguro',
      filename: 'seguro.pdf',
      storagePath: '/uploads/seguro.pdf',
      uploadedAt: new Date(),
      status: 'uploaded' as const,
    }]
    const result = validateDocumentExpiration(docs, periodo)
    expect(result.status).toBe('skip')
  })

  it('should pass when all docs are more than 30 days from expiry', () => {
    // Close date 2026-02-13, issue date 2025-12-20 => 55 days => 35 remaining
    const docs = [makeDoc('seguro', new Date('2025-12-20'))]
    const result = validateDocumentExpiration(docs, periodo)
    expect(result.status).toBe('pass')
    expect(result.severity).toBe('warning')
    expect(result.message).toContain('vigentes')
  })

  it('should fail (warning) when doc is 22 days remaining with "Proximo a vencer"', () => {
    // Close date 2026-02-13, issue date 2025-12-07 => 68 days => 22 remaining
    const docs = [makeDoc('seguro', new Date('2025-12-07'))]
    const result = validateDocumentExpiration(docs, periodo)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('warning')
    expect(result.metadata).toBeDefined()
    const meta = result.metadata!.documents as Array<{ tipo: string; daysRemaining: number; status: string }>
    expect(meta[0].status).toBe('proximo')
    expect(meta[0].daysRemaining).toBe(22)
  })

  it('should fail with "Vence pronto" when doc is 10 days remaining', () => {
    // Close date 2026-02-13, issue date 2025-11-25 => 80 days => 10 remaining
    const docs = [makeDoc('seguro', new Date('2025-11-25'))]
    const result = validateDocumentExpiration(docs, periodo)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('warning')
    const meta = result.metadata!.documents as Array<{ tipo: string; daysRemaining: number; status: string }>
    expect(meta[0].status).toBe('critico')
    expect(meta[0].daysRemaining).toBe(10)
  })

  it('should fail as BLOCKER when doc is expired (0 or negative days remaining)', () => {
    // Close date 2026-02-13, issue date 2025-11-01 => 104 days => -14 remaining
    const docs = [makeDoc('seguro', new Date('2025-11-01'))]
    const result = validateDocumentExpiration(docs, periodo)
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocker')
    const meta = result.metadata!.documents as Array<{ tipo: string; daysRemaining: number; status: string }>
    expect(meta[0].status).toBe('vencido')
    expect(meta[0].daysRemaining).toBeLessThan(0)
  })

  it('should recalculate correctly when period changes to P2', () => {
    // P2 closes 2026-07-15, issue date 2026-04-30 => 76 days => 14 remaining
    const docs = [makeDoc('contador', new Date('2026-04-30'))]
    const result = validateDocumentExpiration(docs, '2026-P2')
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('warning')
    const meta = result.metadata!.documents as Array<{ tipo: string; daysRemaining: number; status: string }>
    expect(meta[0].daysRemaining).toBe(14)
    expect(meta[0].status).toBe('critico')
  })

  it('should include daysRemaining per doc in metadata', () => {
    const docs = [
      makeDoc('seguro', new Date('2025-12-20')),
      makeDoc('contador', new Date('2025-12-01')),
    ]
    const result = validateDocumentExpiration(docs, periodo)
    const meta = result.metadata!.documents as Array<{ tipo: string; daysRemaining: number; status: string }>
    expect(meta.length).toBe(2)
    expect(meta[0]).toHaveProperty('daysRemaining')
    expect(meta[0]).toHaveProperty('status')
    expect(meta[1]).toHaveProperty('daysRemaining')
    expect(meta[1]).toHaveProperty('status')
  })

  it('should only check EXPIRABLE_DOC_TYPES', () => {
    // 'guion' is not in EXPIRABLE_DOC_TYPES, so it should be skipped
    const docs = [makeDoc('guion', new Date('2025-01-01'))] // very old
    const result = validateDocumentExpiration(docs, periodo)
    expect(result.status).toBe('skip')
  })

  it('should navigate to documentos screen', () => {
    const result = validateDocumentExpiration([], periodo)
    expect(result.navigateTo).toEqual({ screen: 'documentos' })
  })

  it('should use dynamic severity - blocker only when any expired', () => {
    // One doc approaching, one doc expired
    const docs = [
      makeDoc('seguro', new Date('2025-12-10')),    // ~65 days => 25 remaining (approaching)
      makeDoc('contador', new Date('2025-11-01')),   // ~104 days => -14 remaining (expired)
    ]
    const result = validateDocumentExpiration(docs, periodo)
    expect(result.severity).toBe('blocker') // one expired => blocker
  })
})
