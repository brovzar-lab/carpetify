import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { parseScreenplayStructure } from '@functions/screenplay/parseStructure.js'

const fixturePath = path.resolve(__dirname, '../fixtures/sample-screenplay.txt')
const fixtureText = readFileSync(fixturePath, 'utf-8')

describe('parseScreenplayStructure', () => {
  it('Test 1: parses INT scene header with DIA', () => {
    const text = 'INT. COCINA - DIA\n\nMARIA\nHola.\n'
    const result = parseScreenplayStructure(text, 1)
    expect(result.escenas).toHaveLength(1)
    expect(result.escenas[0].int_ext).toBe('INT')
    expect(result.escenas[0].locacion).toBe('COCINA')
    expect(result.escenas[0].dia_noche).toBe('DIA')
  })

  it('Test 2: parses EXT scene header with NOCHE', () => {
    const text = 'EXT. CALLE PRINCIPAL - NOCHE\n\nCARLOS\nVamos.\n'
    const result = parseScreenplayStructure(text, 1)
    expect(result.escenas).toHaveLength(1)
    expect(result.escenas[0].int_ext).toBe('EXT')
    expect(result.escenas[0].dia_noche).toBe('NOCHE')
  })

  it('Test 3: parses INT./EXT. scene header with ATARDECER', () => {
    const text = 'INT./EXT. CARRO - ATARDECER\n\nCARLOS\nVamos.\n'
    const result = parseScreenplayStructure(text, 1)
    expect(result.escenas).toHaveLength(1)
    expect(result.escenas[0].int_ext).toBe('INT-EXT')
    expect(result.escenas[0].dia_noche).toBe('ATARDECER')
  })

  it('Test 4: identifies character cue MARIA followed by dialogue', () => {
    const text = 'INT. COCINA - DIA\n\nMARIA\nHola mundo.\n'
    const result = parseScreenplayStructure(text, 1)
    expect(result.escenas[0].personajes).toContain('MARIA')
  })

  it('Test 5: does NOT treat FADE IN or CORTE A as character names', () => {
    const result = parseScreenplayStructure(fixtureText, 3)
    const allCharNames = result.personajes.map((p) => p.nombre)
    expect(allCharNames).not.toContain('FADE IN')
    expect(allCharNames).not.toContain('CORTE A NEGRO')
    expect(allCharNames).not.toContain('FIN')
  })

  it('Test 6: strips parenthetical (V.O.) from character name', () => {
    const result = parseScreenplayStructure(fixtureText, 3)
    const allCharNames = result.personajes.map((p) => p.nombre)
    expect(allCharNames).toContain('CARLOS')
    // Should not have "CARLOS (V.O.)" as a separate character
    expect(allCharNames).not.toContain('CARLOS (V.O.)')
  })

  it('Test 7: location with 3 scenes shows frecuencia=3', () => {
    const text = [
      'INT. COCINA - DIA',
      '',
      'MARIA',
      'Hola.',
      '',
      'EXT. CALLE - NOCHE',
      '',
      'CARLOS',
      'Adios.',
      '',
      'INT. COCINA - NOCHE',
      '',
      'MARIA',
      'Otra vez.',
      '',
      'INT. COCINA - DIA',
      '',
      'PEDRO',
      'Buenos dias.',
    ].join('\n')
    const result = parseScreenplayStructure(text, 1)
    const cocina = result.locaciones.find(
      (l) => l.nombre.toUpperCase() === 'COCINA',
    )
    expect(cocina).toBeDefined()
    expect(cocina!.frecuencia).toBe(3)
  })

  it('Test 8: character appearing in 5 of 10 scenes has num_escenas=5', () => {
    const scenes: string[] = []
    for (let i = 0; i < 10; i++) {
      scenes.push(`INT. LUGAR${i} - DIA`)
      scenes.push('')
      if (i < 5) {
        scenes.push('MARIA')
        scenes.push('Dialogo.')
      } else {
        scenes.push('CARLOS')
        scenes.push('Otro dialogo.')
      }
      scenes.push('')
    }
    const result = parseScreenplayStructure(scenes.join('\n'), 1)
    const maria = result.personajes.find((p) => p.nombre === 'MARIA')
    expect(maria).toBeDefined()
    expect(maria!.num_escenas).toBe(5)
  })

  it('Test 9: character in >20% of scenes gets es_protagonista=true', () => {
    const scenes: string[] = []
    for (let i = 0; i < 10; i++) {
      scenes.push(`INT. LUGAR${i} - DIA`)
      scenes.push('')
      if (i < 5) {
        scenes.push('MARIA')
        scenes.push('Dialogo.')
      } else {
        scenes.push('CARLOS')
        scenes.push('Otro dialogo.')
      }
      scenes.push('')
    }
    const result = parseScreenplayStructure(scenes.join('\n'), 1)
    const maria = result.personajes.find((p) => p.nombre === 'MARIA')
    expect(maria!.es_protagonista).toBe(true)
  })

  it('Test 10: desglose_int_ext correctly counts INT, EXT, INT-EXT', () => {
    const result = parseScreenplayStructure(fixtureText, 3)
    expect(result.desglose_int_ext.int).toBe(1)
    expect(result.desglose_int_ext.ext).toBe(1)
    expect(result.desglose_int_ext.int_ext).toBe(1)
  })

  it('Test 11: desglose_dia_noche correctly counts dia, noche, otro', () => {
    const result = parseScreenplayStructure(fixtureText, 3)
    expect(result.desglose_dia_noche.dia).toBe(1)
    expect(result.desglose_dia_noche.noche).toBe(1)
    expect(result.desglose_dia_noche.otro).toBe(1) // ATARDECER = otro
  })

  it('Test 12: empty text returns 0 scenes and empty arrays', () => {
    const result = parseScreenplayStructure('', 0)
    expect(result.num_escenas).toBe(0)
    expect(result.escenas).toHaveLength(0)
    expect(result.locaciones).toHaveLength(0)
    expect(result.personajes).toHaveLength(0)
  })
})
