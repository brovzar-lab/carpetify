import { describe, it, expect } from 'vitest'
import { calculateCompliance } from '../useCompliance'

describe('calculateCompliance', () => {
  // Helper: budget = $10M MXN = 1,000,000,000 centavos
  const budget = 1000000000

  it('flags ERPI at 15% (below 20% minimum)', () => {
    const result = calculateCompliance(
      budget,
      150000000, // 15% ERPI cash
      0, 0,
      500000000, // EFICINE
      0,
      50000000, // screenwriter 5%
      0,
      0,
    )
    expect(result.violations.length).toBeGreaterThan(0)
    expect(result.violations.some(v => v.message.includes('20%'))).toBe(true)
  })

  it('flags EFICINE at 85% (above 80% maximum)', () => {
    const result = calculateCompliance(
      budget,
      200000000, // 20% ERPI
      0, 0,
      850000000, // 85% EFICINE
      0,
      50000000,
      0,
      0,
    )
    expect(result.violations.some(v => v.message.includes('80%'))).toBe(true)
  })

  it('flags EFICINE amount exceeding $25M cap', () => {
    const bigBudget = 5000000000 // $50M budget
    const result = calculateCompliance(
      bigBudget,
      1000000000,
      0, 0,
      2600000000, // $26M > $25M cap
      0,
      200000000,
      0,
      0,
    )
    expect(result.violations.some(v => v.message.includes('$25,000,000'))).toBe(true)
  })

  it('flags screenwriter at 2% (below 3% minimum)', () => {
    const result = calculateCompliance(
      budget,
      300000000,
      0, 0,
      500000000,
      0,
      20000000, // 2% screenwriter
      0,
      0,
    )
    expect(result.violations.some(v => v.message.includes('3%'))).toBe(true)
  })

  it('flags in-kind at 12% (above 10% maximum)', () => {
    const result = calculateCompliance(
      budget,
      300000000,
      0, 0,
      500000000,
      0,
      50000000,
      120000000, // 12% in-kind
      0,
    )
    expect(result.violations.some(v => v.message.includes('10%'))).toBe(true)
  })

  it('flags gestor at 6% of EFICINE (fiction, above 5% maximum)', () => {
    // EFICINE <= $10M, so gestor cap is 5%
    const result = calculateCompliance(
      budget,
      300000000,
      0, 0,
      500000000, // $5M EFICINE
      0,
      50000000,
      0,
      30000000, // 6% of EFICINE ($5M * 0.06 = $300K)
    )
    expect(result.violations.some(v => v.message.includes('5%'))).toBe(true)
  })

  it('returns empty violations when all values are compliant', () => {
    const result = calculateCompliance(
      budget,
      250000000, // 25% ERPI
      0, 0,
      500000000, // 50% EFICINE
      0,
      50000000, // 5% screenwriter
      50000000, // 5% in-kind
      10000000, // 2% gestor
    )
    expect(result.violations).toHaveLength(0)
  })

  it('handles zero budget gracefully (no division by zero)', () => {
    const result = calculateCompliance(0, 0, 0, 0, 0, 0, 0, 0, 0)
    expect(result.violations).toHaveLength(0)
    expect(result.erpiPct).toBe(0)
    expect(result.eficinePct).toBe(0)
  })
})
