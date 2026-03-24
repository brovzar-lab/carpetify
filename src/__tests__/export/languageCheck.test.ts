import { describe, it, expect } from 'vitest'
import { runLanguageCheck } from '@/lib/export/languageCheck'
import type { LanguageCheckResult } from '@/lib/export/languageCheck'

// Helper to make doc input
function makeDoc(docId: string, content: string, docName?: string) {
  return { docId, docName: docName ?? docId, content }
}

// ---------- Anglicism detection ----------

describe('anglicism detection', () => {
  it('detects flagged anglicisms with replacement', () => {
    const result = runLanguageCheck(
      [makeDoc('A1', 'El shooting del proyecto inicia en agosto.')],
      'Mi Pelicula',
    )
    const flagged = result.anglicisms.filter((f) => f.severity === 'flagged')
    expect(flagged.length).toBeGreaterThan(0)
    expect(flagged[0].word.toLowerCase()).toBe('shooting')
    expect(flagged[0].replacement).toBe('rodaje')
  })

  it('detects accepted anglicisms as noted', () => {
    const result = runLanguageCheck(
      [makeDoc('A7', 'El servicio de catering estara disponible durante el rodaje.')],
      'Mi Pelicula',
    )
    const noted = result.anglicisms.filter((f) => f.severity === 'noted')
    expect(noted.length).toBeGreaterThan(0)
    expect(noted[0].word.toLowerCase()).toBe('catering')
  })

  it('is case-insensitive for anglicism matching', () => {
    const result = runLanguageCheck(
      [makeDoc('A2', 'El CAST del proyecto es excepcional.')],
      'Mi Pelicula',
    )
    const flagged = result.anglicisms.filter((f) => f.severity === 'flagged')
    expect(flagged.some((f) => f.word.toLowerCase() === 'cast')).toBe(true)
  })

  it('uses word boundary matching (no partial matches)', () => {
    const result = runLanguageCheck(
      [makeDoc('A1', 'El casting de actores fue exitoso.')],
      'Mi Pelicula',
    )
    // "casting" should NOT match "cast" as a word boundary match
    const castFindings = result.anglicisms.filter(
      (f) => f.word.toLowerCase() === 'cast',
    )
    expect(castFindings).toHaveLength(0)
  })
})

// ---------- Currency format check ----------

describe('currency format check', () => {
  it('detects "$10,000 pesos" as invalid format', () => {
    const result = runLanguageCheck(
      [makeDoc('A9a', 'El monto total es de $10,000 pesos.')],
      'Mi Pelicula',
    )
    const currencyIssues = result.formatIssues.filter((f) => f.type === 'currency')
    expect(currencyIssues.length).toBeGreaterThan(0)
  })

  it('detects amounts with decimal points', () => {
    const result = runLanguageCheck(
      [makeDoc('A9b', 'El costo es $10,000.00 por servicio.')],
      'Mi Pelicula',
    )
    const currencyIssues = result.formatIssues.filter((f) => f.type === 'currency')
    expect(currencyIssues.length).toBeGreaterThan(0)
  })

  it('does not flag properly formatted MXN amounts', () => {
    const result = runLanguageCheck(
      [makeDoc('E1', 'El presupuesto total es de $10,000,000 MXN.')],
      'Mi Pelicula',
    )
    const currencyIssues = result.formatIssues.filter((f) => f.type === 'currency')
    expect(currencyIssues).toHaveLength(0)
  })
})

// ---------- Date format check ----------

describe('date format check', () => {
  it('detects English month names', () => {
    const result = runLanguageCheck(
      [makeDoc('A1', 'The deadline is January 15, 2026.')],
      'Mi Pelicula',
    )
    const dateIssues = result.formatIssues.filter((f) => f.type === 'date')
    expect(dateIssues.length).toBeGreaterThan(0)
  })

  it('detects other English months', () => {
    const result = runLanguageCheck(
      [makeDoc('A7', 'Filming begins March 2026.')],
      'Mi Pelicula',
    )
    const dateIssues = result.formatIssues.filter((f) => f.type === 'date')
    expect(dateIssues.length).toBeGreaterThan(0)
  })

  it('does not flag Spanish month names', () => {
    const result = runLanguageCheck(
      [makeDoc('A8a', 'El rodaje comienza en marzo de 2026.')],
      'Mi Pelicula',
    )
    const dateIssues = result.formatIssues.filter((f) => f.type === 'date')
    expect(dateIssues).toHaveLength(0)
  })
})

// ---------- Title consistency check ----------

describe('title consistency check', () => {
  it('returns no title mismatch when title is present in content', () => {
    const result = runLanguageCheck(
      [
        makeDoc(
          'A1',
          'El proyecto "Mi Pelicula" es un largometraje de ficcion que explora temas profundos de la condicion humana en el contexto mexicano contemporaneo.',
          'Resumen Ejecutivo',
        ),
      ],
      'Mi Pelicula',
    )
    expect(result.titleMismatches).toHaveLength(0)
  })

  it('returns title mismatch when title is missing from long content', () => {
    const longContent =
      'Este es un documento extenso sobre un proyecto cinematografico. '.repeat(5)
    const result = runLanguageCheck(
      [makeDoc('A2', longContent, 'Sinopsis')],
      'Mi Pelicula',
    )
    expect(result.titleMismatches.length).toBeGreaterThan(0)
    expect(result.titleMismatches[0].severity).toBe('blocker')
  })

  it('skips title check for short content (< 100 chars)', () => {
    const result = runLanguageCheck(
      [makeDoc('PITCH', 'Breve descripcion.')],
      'Mi Pelicula',
    )
    expect(result.titleMismatches).toHaveLength(0)
  })

  it('is case-sensitive for title matching', () => {
    const longContent =
      'El proyecto mi pelicula trata sobre un tema importante para la sociedad contemporanea en Mexico y tiene un enfoque unico.'
    const result = runLanguageCheck(
      [makeDoc('A1', longContent, 'Resumen')],
      'Mi Pelicula',
    )
    // "mi pelicula" !== "Mi Pelicula" -- should flag mismatch
    expect(result.titleMismatches.length).toBeGreaterThan(0)
  })
})

// ---------- Result aggregation ----------

describe('result aggregation', () => {
  it('returns passed:true for empty content', () => {
    const result = runLanguageCheck([], 'Mi Pelicula')
    expect(result.passed).toBe(true)
    expect(result.hasBlockers).toBe(false)
    expect(result.findings).toHaveLength(0)
  })

  it('returns passed:true for clean content (no anglicisms, proper formats, title present)', () => {
    const content =
      'El proyecto "Mi Pelicula" tiene un presupuesto total de $5,000,000 MXN. El rodaje inicia en agosto de 2026.'
    const result = runLanguageCheck(
      [makeDoc('A1', content, 'Resumen')],
      'Mi Pelicula',
    )
    expect(result.passed).toBe(true)
    expect(result.hasBlockers).toBe(false)
  })

  it('sets hasBlockers:true when title mismatches exist', () => {
    const longContent =
      'Un proyecto sobre temas contemporaneos en el cine mexicano de ficcion. '.repeat(3)
    const result = runLanguageCheck(
      [makeDoc('A1', longContent, 'Resumen')],
      'Mi Pelicula',
    )
    expect(result.hasBlockers).toBe(true)
  })

  it('passed is true even with flagged anglicisms (they are dismissable per D-07)', () => {
    const content =
      'El shooting del proyecto "Mi Pelicula" comienza pronto. El presupuesto es $1,000,000 MXN.'
    const result = runLanguageCheck(
      [makeDoc('A1', content, 'Resumen')],
      'Mi Pelicula',
    )
    // Flagged anglicisms are warnings, not blockers
    expect(result.anglicisms.filter((a) => a.severity === 'flagged').length).toBeGreaterThan(0)
    expect(result.passed).toBe(true)
  })

  it('aggregates findings from multiple documents', () => {
    const result = runLanguageCheck(
      [
        makeDoc('A1', 'El shooting del proyecto "Mi Pelicula" en el set. El monto es $5,000,000 MXN.'),
        makeDoc('A2', 'El cast para "Mi Pelicula" esta confirmado. El costo total es $3,000,000 MXN.'),
      ],
      'Mi Pelicula',
    )
    // Should have findings from both documents
    expect(result.anglicisms.length).toBeGreaterThanOrEqual(2)
    expect(result.findings.length).toBeGreaterThanOrEqual(2)
  })
})
