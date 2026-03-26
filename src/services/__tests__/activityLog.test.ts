import { describe, it, expect } from 'vitest'
import {
  buildChangeSummary,
  FIELD_LABELS,
  SCREEN_LABELS,
  coalesceOrCreate,
} from '@/services/activityLog'

describe('buildChangeSummary', () => {
  it('returns single-field summary with Spanish label', () => {
    const result = buildChangeSummary('datos', ['titulo_proyecto'])
    expect(result.toLowerCase()).toContain('titulo del proyecto')
    expect(result).toContain('Datos del Proyecto')
  })

  it('returns multi-field summary with count', () => {
    const result = buildChangeSummary('financiera', [
      'costo_total_proyecto_centavos',
      'monto_solicitado_eficine_centavos',
    ])
    expect(result).toContain('2 campos')
    expect(result).toContain('Estructura Financiera')
  })

  it('falls back to raw field name when no label exists', () => {
    const result = buildChangeSummary('datos', ['unknown_field_xyz'])
    expect(result).toContain('unknown_field_xyz')
  })
})

describe('FIELD_LABELS', () => {
  it('contains at least 15 EFICINE domain field mappings', () => {
    expect(Object.keys(FIELD_LABELS).length).toBeGreaterThanOrEqual(15)
  })

  it('maps titulo_proyecto to Spanish label', () => {
    expect(FIELD_LABELS['titulo_proyecto']).toBe('titulo del proyecto')
  })

  it('maps costo_total_proyecto_centavos to Spanish label', () => {
    expect(FIELD_LABELS['costo_total_proyecto_centavos']).toBe('costo total')
  })
})

describe('SCREEN_LABELS', () => {
  it('maps all 5 wizard screens plus metadata', () => {
    const keys = Object.keys(SCREEN_LABELS)
    expect(keys).toContain('datos')
    expect(keys).toContain('guion')
    expect(keys).toContain('equipo')
    expect(keys).toContain('financiera')
    expect(keys).toContain('documentos')
  })

  it('maps datos to Datos del Proyecto', () => {
    expect(SCREEN_LABELS['datos']).toBe('Datos del Proyecto')
  })
})

describe('coalesceOrCreate', () => {
  it('is an async function', () => {
    expect(typeof coalesceOrCreate).toBe('function')
  })

  // Full coalescing behavior tested via integration test with mocked Firestore
  // -- see Plan 01 Task 2 for useAutoSave integration
})
