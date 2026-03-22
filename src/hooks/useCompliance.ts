import {
  EFICINE_MAX_MXN_CENTAVOS,
  EFICINE_MAX_PCT,
  ERPI_MIN_PCT,
  FEDERAL_MAX_PCT,
  SCREENWRITER_MIN_PCT,
  INKIND_MAX_PCT,
  GESTOR_THRESHOLD_CENTAVOS,
} from '@/lib/constants'

export interface ComplianceViolation {
  rule: string
  message: string
  severity: 'blocker' | 'warning'
}

export interface ComplianceResult {
  erpiPct: number
  eficinePct: number
  federalPct: number
  screenwriterPct: number
  inkindPct: number
  gestorPct: number
  eficineMonto: number
  violations: ComplianceViolation[]
}

function emptyResult(): ComplianceResult {
  return {
    erpiPct: 0,
    eficinePct: 0,
    federalPct: 0,
    screenwriterPct: 0,
    inkindPct: 0,
    gestorPct: 0,
    eficineMonto: 0,
    violations: [],
  }
}

/**
 * Calculates EFICINE compliance percentages and violations.
 * All inputs are in centavos (integer arithmetic).
 *
 * Rules checked:
 * - ERPI must contribute >= 20% of total budget
 * - EFICINE cannot exceed 80% of total budget
 * - EFICINE cannot exceed $25,000,000 MXN
 * - Total federal resources cannot exceed 80%
 * - Screenwriter fee must be >= 3% of total budget
 * - Total in-kind (honorarios) cannot exceed 10%
 * - Gestor fee cannot exceed 5% (<=10M) or 4% (>10M) of EFICINE amount
 */
export function calculateCompliance(
  totalBudgetCentavos: number,
  erpiCashCentavos: number,
  erpiInkindCentavos: number,
  thirdPartyCentavos: number,
  eficineCentavos: number,
  otherFederalCentavos: number,
  screenwriterFeeCentavos: number,
  totalInkindHonorariosCentavos: number,
  gestorFeeCentavos: number,
): ComplianceResult {
  const total = totalBudgetCentavos
  if (total === 0) return emptyResult()

  const erpiTotal = erpiCashCentavos + erpiInkindCentavos + thirdPartyCentavos
  const erpiPct = (erpiTotal / total) * 100
  const eficinePct = (eficineCentavos / total) * 100
  const federalPct = ((eficineCentavos + otherFederalCentavos) / total) * 100
  const screenwriterPct = (screenwriterFeeCentavos / total) * 100
  const inkindPct = (totalInkindHonorariosCentavos / total) * 100

  // Gestor cap: >$10M EFICINE = 4%, <=$10M = 5%
  const gestorCap =
    eficineCentavos > GESTOR_THRESHOLD_CENTAVOS ? 0.04 : 0.05
  const gestorPct =
    eficineCentavos > 0 ? (gestorFeeCentavos / eficineCentavos) * 100 : 0

  const violations: ComplianceViolation[] = []

  if (erpiPct < ERPI_MIN_PCT) {
    violations.push({
      rule: '1.2',
      message: `ERPI debe aportar minimo 20%. Actual: ${erpiPct.toFixed(1)}%`,
      severity: 'blocker',
    })
  }

  if (eficinePct > EFICINE_MAX_PCT) {
    violations.push({
      rule: '1.2',
      message: `EFICINE no puede exceder 80%. Actual: ${eficinePct.toFixed(1)}%`,
      severity: 'blocker',
    })
  }

  if (eficineCentavos > EFICINE_MAX_MXN_CENTAVOS) {
    violations.push({
      rule: '1.2',
      message: 'EFICINE no puede exceder $25,000,000 MXN',
      severity: 'blocker',
    })
  }

  if (federalPct > FEDERAL_MAX_PCT) {
    violations.push({
      rule: '1.2',
      message: `Recursos federales no pueden exceder 80%. Actual: ${federalPct.toFixed(1)}%`,
      severity: 'blocker',
    })
  }

  if (screenwriterPct < SCREENWRITER_MIN_PCT) {
    violations.push({
      rule: '1.3',
      message: `Honorarios de guionista deben ser minimo 3% del costo total (con IVA). Actual: ${screenwriterPct.toFixed(1)}%`,
      severity: 'blocker',
    })
  }

  if (inkindPct > INKIND_MAX_PCT) {
    violations.push({
      rule: '1.4',
      message: `Aportaciones en especie no pueden exceder 10%. Actual: ${inkindPct.toFixed(1)}%`,
      severity: 'blocker',
    })
  }

  if (gestorPct > gestorCap * 100) {
    violations.push({
      rule: '1.5',
      message: `Gestor excede el ${(gestorCap * 100).toFixed(0)}% permitido. Actual: ${gestorPct.toFixed(1)}%`,
      severity: 'blocker',
    })
  }

  return {
    erpiPct,
    eficinePct,
    federalPct,
    screenwriterPct,
    inkindPct,
    gestorPct,
    eficineMonto: eficineCentavos,
    violations,
  }
}
