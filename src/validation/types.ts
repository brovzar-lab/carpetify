/**
 * Shared types for the validation engine.
 * Pure TypeScript -- no React, no Firestore, no side effects.
 */

import type { TeamMember } from '@/schemas/team'
import type { UploadedDocument } from '@/schemas/documents'
import type { ERPISettings } from '@/schemas/erpi'
import type { GeneratedDocClient } from '@/hooks/useGeneratedDocs'

export type Severity = 'blocker' | 'warning'
export type ValidationStatus = 'pass' | 'fail' | 'skip'
export type WizardScreenTarget =
  | 'datos'
  | 'guion'
  | 'equipo'
  | 'financiera'
  | 'documentos'
  | 'generacion'
  | 'validacion'
  | 'erpi'

export interface NavigateTo {
  screen: WizardScreenTarget
  fieldId?: string
  memberIndex?: number
}

export interface ValidationResult {
  ruleId: string
  ruleName: string
  severity: Severity
  status: ValidationStatus
  message: string
  details?: string[]
  metadata?: Record<string, unknown>
  navigateTo?: NavigateTo
}

export interface ValidationReport {
  results: ValidationResult[]
  blockers: ValidationResult[]
  warnings: ValidationResult[]
  passed: ValidationResult[]
  skipped: ValidationResult[]
  canExport: boolean
  timestamp: Date
}

/**
 * Aggregate snapshot of all project data needed by validation rules.
 * Pure data -- no Firestore references, no observables.
 */
export interface ProjectDataSnapshot {
  metadata: {
    titulo_proyecto: string
    categoria_cinematografica: string
    periodo_registro: string
    es_coproduccion_internacional?: boolean
    costo_total_proyecto_centavos: number
    monto_solicitado_eficine_centavos: number
  }
  team: TeamMember[]
  financials: {
    erpiCashCentavos: number
    erpiInkindCentavos: number
    thirdPartyCentavos: number
    otherFederalCentavos: number
    screenwriterFeeCentavos: number
    totalInkindHonorariosCentavos: number
    gestorFeeCentavos: number
  }
  erpiSettings: ERPISettings | null
  submissionsThisPeriod: number
  projectAttempts: number
  uploadedDocs: UploadedDocument[]
  generatedDocs: GeneratedDocClient[]
  budgetTotalCentavos?: number
  cashFlowTotalCentavos?: number
  esquemaTotalCentavos?: number
  feesFromContracts?: {
    producerFeeCentavos?: number
    directorFeeCentavos?: number
    screenwriterFeeCentavos?: number
  }
  feesFromBudget?: {
    producerFeeCentavos?: number
    directorFeeCentavos?: number
    screenwriterFeeCentavos?: number
  }
  feesFromCashFlow?: {
    producerFeeCentavos?: number
    directorFeeCentavos?: number
    screenwriterFeeCentavos?: number
  }
  cashFlowLineItems?: Array<{
    category: string
    source: string
    amount: number
  }>
  outputFiles?: Array<{ name: string; format: string; sizeMB: number }>
}
