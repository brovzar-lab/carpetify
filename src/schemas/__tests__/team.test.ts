import { describe, it, expect } from 'vitest'
import { teamMemberSchema } from '../team'

const validMember = {
  nombre_completo: 'Ana Lopez Garcia',
  cargo: 'Director' as const,
  nacionalidad: 'Mexicana',
  filmografia: [
    {
      titulo: 'Amanecer en el Valle',
      anio: 2023,
      cargo_en_obra: 'Director',
    },
  ],
  honorarios_centavos: 50000000,
  aportacion_especie_centavos: 10000000,
}

describe('teamMemberSchema', () => {
  it('accepts valid team member', () => {
    const result = teamMemberSchema.safeParse(validMember)
    expect(result.success).toBe(true)
  })

  it('rejects missing nombre_completo', () => {
    const { nombre_completo, ...noName } = validMember
    const result = teamMemberSchema.safeParse(noName)
    expect(result.success).toBe(false)
  })

  it('rejects negative honorarios_centavos', () => {
    const result = teamMemberSchema.safeParse({
      ...validMember,
      honorarios_centavos: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects aportacion_especie_centavos exceeding honorarios_centavos', () => {
    const result = teamMemberSchema.safeParse({
      ...validMember,
      honorarios_centavos: 50000000,
      aportacion_especie_centavos: 60000000,
    })
    expect(result.success).toBe(false)
  })

  it('validates filmografia nested objects', () => {
    const result = teamMemberSchema.safeParse({
      ...validMember,
      filmografia: [
        {
          titulo: 'Test Film',
          anio: 2023,
          cargo_en_obra: 'Director',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects filmografia entry with invalid anio', () => {
    const result = teamMemberSchema.safeParse({
      ...validMember,
      filmografia: [
        {
          titulo: 'Test Film',
          anio: 1800,
          cargo_en_obra: 'Director',
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
