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
 *
 * Categories (a), (b), and (d) are wired from team data.
 * Category (c) regional fields remain at defaults -- the current data model
 * does not capture origin location or shooting location percentages.
 * Regional fields will be wired when location data is captured in a future phase.
 */
function buildBonusInput(data: ProjectDataSnapshot): BonusCheckInput {
  // Find director(s) in team array
  const directors = data.team.filter((m) => m.cargo === 'Director')
  const director = directors[0] // Primary director

  // (a) Female director detection
  const directorEsMujer = director?.es_mujer === true

  // Check if co-direction with a man (disqualifies bonus a)
  const directorEsCodireccionConHombre =
    directors.length > 1 && directors.some((d) => d.es_mujer === false)

  // (b) Indigenous/Afro-Mexican director detection
  const directorEsIndigenaAfromexicano =
    director?.es_indigena_afromexicano === true

  // Check if co-direction with non-member (disqualifies bonus b)
  const directorEsCodireccionConNoMiembro =
    directors.length > 1 &&
    directors.some((d) => d.es_indigena_afromexicano !== true)

  // (d) All creative team qualify (all are women or indigenous/afromexicano)
  const creativeRoles = ['Director', 'Guionista', 'Productor']
  const creativeTeam = data.team.filter((m) =>
    creativeRoles.includes(m.cargo),
  )
  const allCreativeTeamQualify =
    creativeTeam.length > 0 &&
    creativeTeam.every(
      (m) => m.es_mujer === true || m.es_indigena_afromexicano === true,
    )

  // Co-direction with non-qualifying person disqualifies bonus d
  const noCodireccionConNoQualifying =
    directors.length <= 1 ||
    directors.every(
      (d) => d.es_mujer === true || d.es_indigena_afromexicano === true,
    )

  return {
    directorEsMujer,
    directorEsIndigenaAfromexicano,
    directorEsCodireccionConHombre,
    directorEsCodireccionConNoMiembro,
    cartaAutoadscripcionUploaded: data.uploadedDocs.some(
      (d) => d.tipo === 'carta_autoadscripcion',
    ),
    // Regional fields remain false/0 -- no location data in current schema
    directorOrigenFueraZMCM: false,
    productorOrigenFueraZMCM: false,
    porcentajeRodajeFueraZMCM: 0,
    porcentajePersonalCreativoLocal: 0,
    porcentajePersonalTecnicoLocal: 0,
    erpiDomicilioFueraZMCM: false,
    allCreativeTeamQualify,
    noCodireccionConNoQualifying,
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

/** Map of Spanish month names to 1-based month numbers */
const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

/**
 * Extract production stage/month data from A8b ruta critica prose text.
 * Best-effort regex parsing -- returns empty array on unparseable content.
 */
function extractStagesFromProse(text: string): StageMonths[] {
  const stageNames = ['Preproduccion', 'Rodaje', 'Postproduccion']
  const stages: StageMonths[] = []

  for (const stageName of stageNames) {
    // Find stage mention in prose (case-insensitive, with optional accent)
    const stageRegex = new RegExp(stageName.replace('o', '[oó]'), 'i')
    const match = stageRegex.exec(text)
    if (!match) continue

    // Look for month names within 200 characters after the stage mention
    const startIdx = match.index
    const endIdx = Math.min(text.length, startIdx + 200)
    const nearby = text.slice(startIdx, endIdx).toLowerCase()

    const months: number[] = []
    for (const [name, num] of Object.entries(MONTH_NAME_TO_NUMBER)) {
      if (nearby.includes(name)) {
        months.push(num)
      }
    }

    if (months.length > 0) {
      months.sort((a, b) => a - b)
      stages.push({ etapa: stageName, months })
    }
  }

  return stages
}

/**
 * Extract ruta critica stages from A8b generated document content for VALD-11.
 * A8b content is prose text (string) or { prose: string }.
 */
function extractRutaCriticaStages(
  data: ProjectDataSnapshot,
): StageMonths[] {
  if (!data.rutaCriticaDocContent) return []

  // A8b content is prose text. Extract string from various possible shapes.
  const content =
    typeof data.rutaCriticaDocContent === 'string'
      ? data.rutaCriticaDocContent
      : typeof (data.rutaCriticaDocContent as Record<string, unknown>)
            ?.prose === 'string'
        ? ((data.rutaCriticaDocContent as Record<string, unknown>).prose as string)
        : ''

  if (!content) return []

  return extractStagesFromProse(content)
}

/**
 * Extract cash flow period/month data from A9d generated document content for VALD-11.
 * A9d content has structured data with months array and column totals.
 */
function extractCashFlowPeriods(
  data: ProjectDataSnapshot,
): StageMonths[] {
  if (!data.cashFlowDocContent) return []

  const structured = (
    data.cashFlowDocContent as Record<string, unknown>
  )?.structured as Record<string, unknown> | undefined

  if (!structured) return []

  const months = structured.months as string[] | undefined
  const columnTotals = structured.columnTotals as number[] | undefined
  const rows = structured.rows as
    | Array<{ cuenta: string; amounts: number[] }>
    | undefined

  if (!months || !columnTotals || !rows || months.length === 0) return []

  // Derive phases from cash flow column distribution.
  // Phase boundaries follow the cash flow builder's distribution:
  // - Preproduccion: first 25% of months
  // - Rodaje (produccion): 25%-60% of months
  // - Postproduccion: remaining months
  const totalMonths = months.length
  const preproEnd = Math.max(1, Math.floor(totalMonths * 0.25))
  const prodEnd = Math.max(preproEnd + 1, Math.floor(totalMonths * 0.6))

  function monthLabelToNumber(label: string): number {
    const lower = label.toLowerCase()
    for (const [name, num] of Object.entries(MONTH_NAME_TO_NUMBER)) {
      if (lower.startsWith(name)) return num
    }
    return 0
  }

  const stages: StageMonths[] = []

  // Preproduccion: months 0..preproEnd-1
  const preproMonths = months
    .slice(0, preproEnd)
    .map(monthLabelToNumber)
    .filter((n) => n > 0)
  if (preproMonths.length > 0) {
    stages.push({ etapa: 'Preproduccion', months: preproMonths })
  }

  // Rodaje: months preproEnd..prodEnd-1
  const prodMonths = months
    .slice(preproEnd, prodEnd)
    .map(monthLabelToNumber)
    .filter((n) => n > 0)
  if (prodMonths.length > 0) {
    stages.push({ etapa: 'Rodaje', months: prodMonths })
  }

  // Postproduccion: months prodEnd..end
  const postMonths = months
    .slice(prodEnd)
    .map(monthLabelToNumber)
    .filter((n) => n > 0)
  if (postMonths.length > 0) {
    stages.push({ etapa: 'Postproduccion', months: postMonths })
  }

  return stages
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
