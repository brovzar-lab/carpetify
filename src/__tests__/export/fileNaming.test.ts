import { describe, it, expect } from 'vitest'
import {
  EXPORT_FILE_MAP,
  sanitizeProjectAbbrev,
  generateFilename,
  validateAllFilenames,
} from '@/lib/export/fileNaming'

// ---------- sanitizeProjectAbbrev ----------

describe('sanitizeProjectAbbrev', () => {
  it('returns max 4 chars uppercase from first initials', () => {
    expect(sanitizeProjectAbbrev('Un Amor Inolvidable')).toBe('UNAM')
  })

  it('strips accents from Spanish characters', () => {
    expect(sanitizeProjectAbbrev('La nina de fuego')).toBe('LANI')
  })

  it('strips accented n-tilde', () => {
    expect(sanitizeProjectAbbrev('La ni\u00f1a del fuego')).toBe('LANI')
  })

  it('handles short titles', () => {
    expect(sanitizeProjectAbbrev('X')).toBe('X')
  })

  it('handles single word title', () => {
    expect(sanitizeProjectAbbrev('Amanecer')).toBe('AMAN')
  })

  it('removes special characters', () => {
    expect(sanitizeProjectAbbrev('El caf\u00e9 & la vida!')).toBe('ELCA')
  })

  it('handles all-accent title', () => {
    expect(sanitizeProjectAbbrev('\u00e1\u00e9\u00ed\u00f3\u00fa')).toBe('AEIO')
  })

  it('handles empty string', () => {
    expect(sanitizeProjectAbbrev('')).toBe('')
  })

  it('handles long multi-word title truncated to 4', () => {
    expect(sanitizeProjectAbbrev('The Very Long Title Of A Film')).toBe('THEV')
  })
})

// ---------- generateFilename ----------

describe('generateFilename', () => {
  it('replaces {PROJ} with sanitized abbreviation', () => {
    expect(generateFilename('A1_RE_{PROJ}', 'Un Amor Inolvidable')).toBe('A1_RE_UNAM')
  })

  it('produces filenames within 15 char limit', () => {
    expect(generateFilename('A9_PRES_{PROJ}', 'Test')).toBe('A9_PRES_TEST')
    expect(generateFilename('A9_PRES_{PROJ}', 'Test').length).toBeLessThanOrEqual(15)
  })

  it('strips non-ASCII non-underscore characters from result', () => {
    expect(generateFilename('A1_RE_{PROJ}', 'El caf\u00e9')).toBe('A1_RE_ELCA')
  })

  it('all EXPORT_FILE_MAP entries produce valid filenames for a normal title', () => {
    const title = 'Un Amor Inolvidable'
    const entries = Object.entries(EXPORT_FILE_MAP)
    expect(entries.length).toBe(21) // Must cover all 21 doc IDs

    for (const [docId, entry] of entries) {
      const filename = generateFilename(entry.filenameTemplate, title)
      expect(filename.length).toBeLessThanOrEqual(15)
      expect(filename).toMatch(/^[A-Za-z0-9_]{1,15}$/)
    }
  })

  it('truncates to 15 chars if template + abbrev exceeds limit', () => {
    const filename = generateFilename('LONGPREFIX_{PROJ}', 'Testing')
    expect(filename.length).toBeLessThanOrEqual(15)
  })
})

// ---------- validateAllFilenames ----------

describe('validateAllFilenames', () => {
  it('passes for a normal project title', () => {
    const result = validateAllFilenames('Un Amor Inolvidable')
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('passes for a short project title', () => {
    const result = validateAllFilenames('X')
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('passes for an accented project title', () => {
    const result = validateAllFilenames('La ni\u00f1a de fuego')
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('all filenames match IMCINE ASCII pattern', () => {
    const result = validateAllFilenames('Test Film')
    expect(result.valid).toBe(true)
    for (const entry of Object.values(EXPORT_FILE_MAP)) {
      const filename = generateFilename(entry.filenameTemplate, 'Test Film')
      expect(filename).toMatch(/^[A-Za-z0-9_]{1,15}$/)
    }
  })
})

// ---------- EXPORT_FILE_MAP coverage ----------

describe('EXPORT_FILE_MAP', () => {
  const EXPECTED_DOC_IDS = [
    'A1', 'A2', 'A4', 'A6', 'A7', 'A8a', 'A8b',
    'A9a', 'A9b', 'A9d', 'A10', 'A11',
    'B3-prod', 'B3-dir',
    'C2b', 'C3a', 'C3b', 'C4',
    'E1', 'E2',
    'PITCH',
  ]

  it('contains entries for all 21 document IDs from FRONTEND_DOC_REGISTRY', () => {
    for (const docId of EXPECTED_DOC_IDS) {
      expect(EXPORT_FILE_MAP).toHaveProperty(docId)
    }
  })

  it('has exactly 21 entries', () => {
    expect(Object.keys(EXPORT_FILE_MAP)).toHaveLength(21)
  })

  it('each entry has required fields', () => {
    for (const [docId, entry] of Object.entries(EXPORT_FILE_MAP)) {
      expect(entry.section).toBeDefined()
      expect(entry.filenameTemplate).toBeDefined()
      expect(entry.templateType).toBeDefined()
      expect(entry.filenameTemplate).toContain('{PROJ}')
    }
  })

  it('A-section docs map to A_PROPUESTA folder', () => {
    const aDocs = ['A1', 'A2', 'A4', 'A6', 'A7', 'A8a', 'A8b', 'A9a', 'A9b', 'A9d', 'A10', 'A11']
    for (const docId of aDocs) {
      expect(EXPORT_FILE_MAP[docId].section).toBe('A_PROPUESTA')
    }
  })

  it('B-section docs map to B_PERSONAL folder', () => {
    expect(EXPORT_FILE_MAP['B3-prod'].section).toBe('B_PERSONAL')
    expect(EXPORT_FILE_MAP['B3-dir'].section).toBe('B_PERSONAL')
  })

  it('C-section docs map to C_ERPI folder', () => {
    const cDocs = ['C2b', 'C3a', 'C3b', 'C4']
    for (const docId of cDocs) {
      expect(EXPORT_FILE_MAP[docId].section).toBe('C_ERPI')
    }
  })

  it('E-section docs map to E_FINANZAS folder', () => {
    expect(EXPORT_FILE_MAP['E1'].section).toBe('E_FINANZAS')
    expect(EXPORT_FILE_MAP['E2'].section).toBe('E_FINANZAS')
  })

  it('PITCH maps to _INTERNO folder', () => {
    expect(EXPORT_FILE_MAP['PITCH'].section).toBe('_INTERNO')
  })
})
