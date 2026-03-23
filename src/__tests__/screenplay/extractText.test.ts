import { describe, it, expect, vi } from 'vitest'

// Mock pdf-parse before importing the module under test
vi.mock('pdf-parse', () => ({
  default: vi.fn(async () => ({
    text: 'INT. COCINA - DIA\n\nMARIA\nHola mundo.\n\n\n\n\nEXT. CALLE - NOCHE\n\nCARLOS\nAdios.\n',
    numpages: 5,
    info: {
      Title: 'Mi Guion',
      Author: 'Autor Test',
      Creator: 'Final Draft',
    },
  })),
}))

import { extractTextFromPdf } from '@functions/screenplay/extractText.js'

describe('extractTextFromPdf', () => {
  it('Test 1: returns text string and numPages from a Buffer', async () => {
    const buffer = Buffer.from('fake-pdf-content')
    const result = await extractTextFromPdf(buffer)

    expect(result.text).toBeDefined()
    expect(typeof result.text).toBe('string')
    expect(result.numPages).toBe(5)
    expect(result.metadata.title).toBe('Mi Guion')
    expect(result.metadata.author).toBe('Autor Test')
    expect(result.metadata.creator).toBe('Final Draft')
  })

  it('Test 2: extracted text preserves line breaks', async () => {
    const buffer = Buffer.from('fake-pdf-content')
    const result = await extractTextFromPdf(buffer)

    expect(result.text).toContain('\n')
  })

  it('Test 3: text normalization collapses multiple blank lines into single blank line', async () => {
    const buffer = Buffer.from('fake-pdf-content')
    const result = await extractTextFromPdf(buffer)

    // The mock returns text with 4+ consecutive newlines; normalization should collapse to max 2
    expect(result.text).not.toMatch(/\n{3,}/)
  })
})
