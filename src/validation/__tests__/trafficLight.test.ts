/**
 * Unit tests for deriveScreenStatuses — maps validation results to per-screen
 * traffic light statuses for the wizard sidebar.
 */
import { describe, it, expect } from 'vitest'
import { deriveScreenStatuses } from '@/hooks/useValidation'
import type { ValidationReport, ValidationResult } from '@/validation/types'

// ---- Test helpers ----

function makeResult(
  overrides: Partial<ValidationResult> & Pick<ValidationResult, 'ruleId' | 'severity' | 'status'>,
): ValidationResult {
  return {
    ruleName: overrides.ruleId,
    message: `${overrides.ruleId} message`,
    ...overrides,
  }
}

function makeReport(results: ValidationResult[]): ValidationReport {
  return {
    results,
    blockers: results.filter((r) => r.severity === 'blocker' && r.status === 'fail'),
    warnings: results.filter((r) => r.severity === 'warning' && r.status === 'fail'),
    passed: results.filter((r) => r.status === 'pass'),
    skipped: results.filter((r) => r.status === 'skip'),
    canExport: results.filter((r) => r.severity === 'blocker' && r.status === 'fail').length === 0,
    timestamp: new Date(),
  }
}

// ---- Tests ----

describe('deriveScreenStatuses', () => {
  it('returns empty object for null report', () => {
    const result = deriveScreenStatuses(null)
    expect(result).toEqual({})
  })

  it('returns empty object for report with no results', () => {
    const report = makeReport([])
    const result = deriveScreenStatuses(report)
    expect(result).toEqual({})
  })

  it('returns error for screen with blocker fail (VALD-01 -> financiera)', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-01',
        severity: 'blocker',
        status: 'fail',
        navigateTo: { screen: 'financiera' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.financiera).toBe('error')
  })

  it('returns partial for screen with warning fail (VALD-13 -> equipo)', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-13',
        severity: 'warning',
        status: 'fail',
        navigateTo: { screen: 'equipo' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.equipo).toBe('partial')
  })

  it('returns complete for screen where all rules pass (datos)', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-02',
        severity: 'blocker',
        status: 'pass',
        navigateTo: { screen: 'datos' },
      }),
      makeResult({
        ruleId: 'VALD-04',
        severity: 'blocker',
        status: 'pass',
        navigateTo: { screen: 'datos' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.datos).toBe('complete')
  })

  it('blocker fail overrides pass on same screen (financiera)', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-01',
        severity: 'blocker',
        status: 'fail',
        navigateTo: { screen: 'financiera' },
      }),
      makeResult({
        ruleId: 'VALD-05',
        severity: 'blocker',
        status: 'pass',
        navigateTo: { screen: 'financiera' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.financiera).toBe('error')
  })

  it('blocker fail overrides warning fail on same screen', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-01',
        severity: 'blocker',
        status: 'fail',
        navigateTo: { screen: 'financiera' },
      }),
      makeResult({
        ruleId: 'VALD-03',
        severity: 'warning',
        status: 'fail',
        navigateTo: { screen: 'financiera' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.financiera).toBe('error')
  })

  it('returns complete for all mapped screens when all rules pass', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-02',
        severity: 'blocker',
        status: 'pass',
        navigateTo: { screen: 'datos' },
      }),
      makeResult({
        ruleId: 'VALD-07',
        severity: 'warning',
        status: 'pass',
        navigateTo: { screen: 'equipo' },
      }),
      makeResult({
        ruleId: 'VALD-01',
        severity: 'blocker',
        status: 'pass',
        navigateTo: { screen: 'financiera' },
      }),
      makeResult({
        ruleId: 'VALD-06',
        severity: 'blocker',
        status: 'pass',
        navigateTo: { screen: 'documentos' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.datos).toBe('complete')
    expect(result.equipo).toBe('complete')
    expect(result.financiera).toBe('complete')
    expect(result.documentos).toBe('complete')
  })

  it('screens with no rules mapped are not present in result', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-02',
        severity: 'blocker',
        status: 'pass',
        navigateTo: { screen: 'datos' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.datos).toBe('complete')
    expect(result.guion).toBeUndefined()
    expect(result.equipo).toBeUndefined()
    expect(result.financiera).toBeUndefined()
  })

  it('results without navigateTo default to validacion screen', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-99',
        severity: 'blocker',
        status: 'fail',
        // No navigateTo
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.validacion).toBe('error')
  })

  it('skipped results count as complete (not fail)', () => {
    const report = makeReport([
      makeResult({
        ruleId: 'VALD-10',
        severity: 'blocker',
        status: 'skip',
        navigateTo: { screen: 'generacion' },
      }),
    ])
    const result = deriveScreenStatuses(report)
    expect(result.generacion).toBe('complete')
  })
})
