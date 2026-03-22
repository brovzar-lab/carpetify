import { describe, it, expect } from 'vitest'
import { formatMXN, parseMXNInput, formatDateES, formatMonthYearES } from '../format'

describe('formatMXN', () => {
  it('formats centavos to MXN currency string', () => {
    expect(formatMXN(2500000000)).toBe('$25,000,000 MXN')
  })

  it('formats zero centavos', () => {
    expect(formatMXN(0)).toBe('$0 MXN')
  })

  it('formats small amounts (100 centavos = $1)', () => {
    expect(formatMXN(100)).toBe('$1 MXN')
  })

  it('formats mid-range amounts', () => {
    expect(formatMXN(1850000000)).toBe('$18,500,000 MXN')
  })
})

describe('parseMXNInput', () => {
  it('parses formatted MXN string to centavos', () => {
    expect(parseMXNInput('$25,000,000 MXN')).toBe(2500000000)
  })

  it('parses raw digits to centavos', () => {
    expect(parseMXNInput('25000000')).toBe(2500000000)
  })

  it('parses empty string to 0', () => {
    expect(parseMXNInput('')).toBe(0)
  })

  it('parses string with only non-numeric chars to 0', () => {
    expect(parseMXNInput('$MXN')).toBe(0)
  })
})

describe('formatDateES', () => {
  it('formats date in Spanish: "15 de julio de 2026"', () => {
    const date = new Date(2026, 6, 15) // July 15, 2026
    expect(formatDateES(date)).toBe('15 de julio de 2026')
  })

  it('formats January date correctly', () => {
    const date = new Date(2026, 0, 30) // January 30, 2026
    expect(formatDateES(date)).toBe('30 de enero de 2026')
  })
})

describe('formatMonthYearES', () => {
  it('formats month and year in lowercase Spanish', () => {
    const date = new Date(2026, 7, 1) // August 1, 2026
    expect(formatMonthYearES(date)).toBe('agosto 2026')
  })

  it('formats February correctly', () => {
    const date = new Date(2026, 1, 13) // February 13, 2026
    expect(formatMonthYearES(date)).toBe('febrero 2026')
  })
})
