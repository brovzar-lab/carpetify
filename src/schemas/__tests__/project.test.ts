import { describe, it, expect } from 'vitest'
import { projectMetadataSchema } from '../project'

const validProject = {
  titulo_proyecto: 'El Godin de los Cielos',
  categoria_cinematografica: 'Ficcion' as const,
  categoria_director: 'Opera Prima' as const,
  duracion_estimada_minutos: 90,
  formato_filmacion: 'Digital 4K',
  relacion_aspecto: '2.39:1',
  idiomas: ['Espanol'],
  costo_total_proyecto_centavos: 1850000000,
  monto_solicitado_eficine_centavos: 1200000000,
  periodo_registro: '2026-P1' as const,
  es_coproduccion_internacional: false,
}

describe('projectMetadataSchema', () => {
  it('accepts valid project metadata', () => {
    const result = projectMetadataSchema.safeParse(validProject)
    expect(result.success).toBe(true)
  })

  it('rejects missing titulo_proyecto', () => {
    const { titulo_proyecto, ...noTitle } = validProject
    const result = projectMetadataSchema.safeParse(noTitle)
    expect(result.success).toBe(false)
  })

  it('rejects invalid categoria_cinematografica enum', () => {
    const result = projectMetadataSchema.safeParse({
      ...validProject,
      categoria_cinematografica: 'Horror',
    })
    expect(result.success).toBe(false)
  })

  it('rejects monto_solicitado_eficine_centavos > $25M ($2,500,000,000 centavos)', () => {
    const result = projectMetadataSchema.safeParse({
      ...validProject,
      monto_solicitado_eficine_centavos: 2600000000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects duracion_estimada_minutos < 60', () => {
    const result = projectMetadataSchema.safeParse({
      ...validProject,
      duracion_estimada_minutos: 45,
    })
    expect(result.success).toBe(false)
  })

  it('accepts periodo_registro "2026-P1" and "2026-P2"', () => {
    const p1 = projectMetadataSchema.safeParse({ ...validProject, periodo_registro: '2026-P1' })
    const p2 = projectMetadataSchema.safeParse({ ...validProject, periodo_registro: '2026-P2' })
    expect(p1.success).toBe(true)
    expect(p2.success).toBe(true)
  })

  it('rejects invalid periodo_registro', () => {
    const result = projectMetadataSchema.safeParse({
      ...validProject,
      periodo_registro: '2026-P3',
    })
    expect(result.success).toBe(false)
  })

  it('requires tipo_cambio_fx when es_coproduccion_internacional is true', () => {
    const result = projectMetadataSchema.safeParse({
      ...validProject,
      es_coproduccion_internacional: true,
    })
    expect(result.success).toBe(false)
  })

  it('accepts co-production with tipo_cambio_fx and fecha_tipo_cambio', () => {
    const result = projectMetadataSchema.safeParse({
      ...validProject,
      es_coproduccion_internacional: true,
      tipo_cambio_fx: 17.25,
      fecha_tipo_cambio: '2026-01-30',
    })
    expect(result.success).toBe(true)
  })
})
