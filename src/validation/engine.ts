/**
 * Validation engine orchestrator.
 * Pure functions -- no React, no Firestore, no hooks, no side effects.
 *
 * Runs all 14 validation rules with tiered timing per D-11:
 * - Instant (12 rules): fire on every data change (300ms debounce by caller)
 * - Medium (2 rules): fire when document generation/edit timestamps change
 *
 * The engine maps ProjectDataSnapshot fields to each rule's specific params.
 */
import type {
  ProjectDataSnapshot,
  ValidationReport,
  ValidationResult,
} from './types'

// Blocker rules (Plan 01)
import { validateFinancialReconciliation } from './rules/financialReconciliation'
import { validateTitleConsistency } from './rules/titleConsistency'
import { validateFeeCrossMatch } from './rules/feeCrossMatch'
import { validateDateCompliance } from './rules/dateCompliance'
import { validateEficineCompliance } from './rules/eficineCompliance'
import { validateDocumentCompleteness } from './rules/documentCompleteness'
import { validateExperienceThresholds } from './rules/experienceThresholds'
import { validateErpiEligibility } from './rules/erpiEligibility'
import { validateFileFormatCompliance } from './rules/fileFormatCompliance'
import { validateProhibitedExpenditure } from './rules/prohibitedExpenditure'

// Warning rules (Plan 02)
import { validateRutaCriticaSync } from './rules/rutaCriticaSync'
import { validateHyperlinkAccessibility } from './rules/hyperlinkAccessibility'
import { validateBonusEligibility } from './rules/bonusEligibility'
import { validateDocumentExpiration } from './rules/documentExpiration'

import type { BonusCheckInput } from './rules/bonusEligibility'
import type { LinkCheckInput } from './rules/hyperlinkAccessibility'
// StageMonths used in extractRutaCriticaStages/extractCashFlowPeriods return types
import type { StageMonths } from './rules/rutaCriticaSync'

/** Rule IDs that fire on every data change (instant tier per D-11) */
export const INSTANT_RULE_IDS = [
  'VALD-01',
  'VALD-02',
  'VALD-03',
  'VALD-04',
  'VALD-05',
  'VALD-06',
  'VALD-07',
  'VALD-08',
  'VALD-09',
  'VALD-12',
  'VALD-13',
  'VALD-17',
] as const

/** Rule IDs that fire only on document generation/edit (medium tier per D-11) */
export const MEDIUM_RULE_IDS = ['VALD-10', 'VALD-11'] as const

/**
 * Build a ValidationReport from an array of rule results.
 * Categorizes results into blockers, warnings, passed, and skipped.
 * canExport is true when zero blockers have status=fail.
 */
function buildReport(results: ValidationResult[]): ValidationReport {
  return {
    results,
    blockers: results.filter(
      (r) => r.severity === 'blocker' && r.status === 'fail',
    ),
    warnings: results.filter(
      (r) => r.severity === 'warning' && r.status === 'fail',
    ),
    passed: results.filter((r) => r.status === 'pass'),
    skipped: results.filter((r) => r.status === 'skip'),
    canExport:
      results.filter((r) => r.severity === 'blocker' && r.status === 'fail')
        .length === 0,
    timestamp: new Date(),
  }
}

/**
 * Extract ERPI prior projects from erpiSettings for VALD-08.
 * Falls back to empty array if no settings.
 */
function extractPriorProjects(
  data: ProjectDataSnapshot,
): Array<{
  titulo: string
  anio: number
  exhibido: boolean
  estatus: 'exhibido' | 'en_produccion' | 'no_exhibido'
  monto_recibido_centavos?: number
}> {
  if (!data.erpiSettings) return []
  const proyectos = (data.erpiSettings as Record<string, unknown>)
    .proyectos_previos as
    | Array<{
        titulo: string
        anio: number
        exhibido: boolean
        estatus: 'exhibido' | 'en_produccion' | 'no_exhibido'
        monto_recibido_centavos?: number
      }>
    | undefined
  return proyectos ?? []
}

/**
 * Build conditions map for document completeness (VALD-06).
 * Maps conditional document flags from project data.
 */
function buildDocConditions(data: ProjectDataSnapshot): Record<string, boolean> {
  return {
    hasExclusiveContribution: false, // TODO: wire from financial data when available
    hasThirdPartyContribution: (data.financials.thirdPartyCentavos ?? 0) > 0,
    hasInternationalCoproduction:
      data.metadata.es_coproduccion_internacional ?? false,
  }
}

/**
 * Build BonusCheckInput from project data for VALD-13.
 * Maps team and metadata fields to the flat boolean/number interface.
 */
function buildBonusInput(data: ProjectDataSnapshot): BonusCheckInput {
  // Bonus fields will be wired from extended team/project data
  // when the bonus eligibility UI captures these signals.
  return {
    directorEsMujer: false, // Not available in current snapshot
    directorEsIndigenaAfromexicano: false,
    directorEsCodireccionConHombre: false,
    directorEsCodireccionConNoMiembro: false,
    cartaAutoadscripcionUploaded: data.uploadedDocs.some(
      (d) => d.tipo === 'carta_autoadscripcion',
    ),
    directorOrigenFueraZMCM: false,
    productorOrigenFueraZMCM: false,
    porcentajeRodajeFueraZMCM: 0,
    porcentajePersonalCreativoLocal: 0,
    porcentajePersonalTecnicoLocal: 0,
    erpiDomicilioFueraZMCM: false,
    allCreativeTeamQualify: false,
    noCodireccionConNoQualifying: true,
  }
}

/**
 * Extract link check inputs from project data for VALD-12.
 * In the current data model, links come from team filmography URLs.
 * Returns empty array if no links are present.
 */
function extractLinks(_data: ProjectDataSnapshot): LinkCheckInput[] {
  // Links will be wired from team member URLs and document URLs
  // when the hyperlink verification UI is implemented.
  return []
}

/**
 * Extract ruta critica stages and cash flow periods for VALD-11.
 * Data comes from generated documents (ruta critica and cash flow).
 */
function extractRutaCriticaStages(
  _data: ProjectDataSnapshot,
): StageMonths[] {
  // Will be wired from generated ruta critica document content
  return []
}

function extractCashFlowPeriods(
  _data: ProjectDataSnapshot,
): StageMonths[] {
  // Will be wired from generated cash flow document content
  return []
}

/**
 * Run only the 12 instant-tier rules.
 * Called by useValidation on every data change (300ms debounce).
 */
export function runInstantRules(
  data: ProjectDataSnapshot,
): ValidationReport {
  const results: ValidationResult[] = [
    // VALD-01: Financial reconciliation
    validateFinancialReconciliation(
      data.budgetTotalCentavos,
      data.cashFlowTotalCentavos,
      data.esquemaTotalCentavos,
    ),

    // VALD-02: Title consistency
    validateTitleConsistency(
      data.metadata.titulo_proyecto,
      data.generatedDocs,
      data.uploadedDocs,
    ),

    // VALD-03: Fee cross-match
    validateFeeCrossMatch(
      data.feesFromContracts,
      data.feesFromBudget,
      data.feesFromCashFlow,
    ),

    // VALD-04: Date compliance
    validateDateCompliance(
      data.uploadedDocs as Array<{ tipo: string; fecha_emision?: Date }>,
      data.metadata.periodo_registro
        ? new Date(data.metadata.periodo_registro)
        : new Date(),
    ),

    // VALD-05: EFICINE compliance
    validateEficineCompliance(
      data.metadata.costo_total_proyecto_centavos,
      data.financials.erpiCashCentavos,
      data.financials.erpiInkindCentavos,
      data.financials.thirdPartyCentavos,
      data.metadata.monto_solicitado_eficine_centavos,
      data.financials.otherFederalCentavos,
      data.financials.screenwriterFeeCentavos,
      data.financials.totalInkindHonorariosCentavos,
      data.financials.gestorFeeCentavos,
    ),

    // VALD-06: Document completeness
    validateDocumentCompleteness(
      data.generatedDocs.map((d) => d.docId),
      data.uploadedDocs.map((d) => d.tipo),
      buildDocConditions(data),
    ),

    // VALD-07: Experience thresholds
    validateExperienceThresholds(
      data.team,
      data.metadata.categoria_cinematografica,
    ),

    // VALD-08: ERPI eligibility
    validateErpiEligibility(
      extractPriorProjects(data),
      data.submissionsThisPeriod,
      data.projectAttempts,
    ),

    // VALD-09: File format compliance
    validateFileFormatCompliance(data.outputFiles ?? []),

    // VALD-12: Hyperlink accessibility
    validateHyperlinkAccessibility(extractLinks(data)),

    // VALD-13: Bonus eligibility
    validateBonusEligibility(buildBonusInput(data)),

    // VALD-17: Document expiration
    validateDocumentExpiration(
      data.uploadedDocs as Array<{ tipo: string; fecha_emision?: Date }>,
      data.metadata.periodo_registro,
    ),
  ]

  return buildReport(results)
}

/**
 * Run only the 2 medium-tier rules (VALD-10, VALD-11).
 * Called by useValidation only when generatedDocs timestamps change.
 */
export function runMediumRules(
  data: ProjectDataSnapshot,
): ValidationReport {
  const results: ValidationResult[] = [
    // VALD-10: Prohibited expenditure
    validateProhibitedExpenditure(data.cashFlowLineItems),

    // VALD-11: Ruta critica sync
    validateRutaCriticaSync(
      extractRutaCriticaStages(data),
      extractCashFlowPeriods(data),
    ),
  ]

  return buildReport(results)
}

/**
 * Run all 14 rules. Convenience for initial load and export gating.
 */
export function runAllRules(
  data: ProjectDataSnapshot,
): ValidationReport {
  const instant = runInstantRules(data)
  const medium = runMediumRules(data)
  return buildReport([...instant.results, ...medium.results])
}
