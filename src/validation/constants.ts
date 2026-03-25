/**
 * Validation engine constants.
 * Required document map, prohibited expenditure categories, expirable doc types.
 */

export interface RequiredDocEntry {
  section: string
  label: string
  conditional?: boolean
  conditionField?: string
}

/**
 * Every required EFICINE document, keyed by either:
 * - docId (for AI-generated documents, matching FRONTEND_DOC_REGISTRY)
 * - tipo (for user-uploaded documents, matching DocumentChecklist REQUIRED_UPLOADS)
 *
 * Conditional docs (E2, E3, E4) are only required when corresponding
 * financial sources exist in the project.
 */
export const REQUIRED_DOCUMENTS: Record<string, RequiredDocEntry> = {
  // Section A - Propuesta Artistica (generated docs, keys = docId)
  A1: { section: 'A', label: 'Resumen Ejecutivo' },
  A2: { section: 'A', label: 'Sinopsis' },
  A4: { section: 'A', label: 'Propuesta de Direccion' },
  A6: { section: 'A', label: 'Formato 2 - Equipo Creativo' },
  A7: { section: 'A', label: 'Propuesta de Produccion' },
  A8a: { section: 'A', label: 'Plan de Rodaje' },
  A8b: { section: 'A', label: 'Ruta Critica' },
  A9a: { section: 'A', label: 'Presupuesto Resumen' },
  A9b: { section: 'A', label: 'Presupuesto Desglosado' },
  A9d: { section: 'A', label: 'Flujo de Efectivo' },
  A10: { section: 'A', label: 'Propuesta de Exhibicion' },

  // Section B - Personal (mix of generated + uploaded)
  acta_constitutiva: { section: 'B', label: 'Acta Constitutiva' },
  poder_notarial: { section: 'B', label: 'Poder Notarial' },
  cv_productor: { section: 'B', label: 'CV Productor' },
  identificacion_rep_legal: { section: 'B', label: 'Identificaciones' },
  'B3-prod': { section: 'B', label: 'Contrato Productor' },
  'B3-dir': { section: 'B', label: 'Contrato Director' },
  contrato_productor: { section: 'B', label: 'Contrato Firmado Productor' },
  contrato_director: { section: 'B', label: 'Contrato Firmado Director' },
  contrato_guionista: { section: 'B', label: 'Contrato Firmado Guionista' },

  // Section C - ERPI (mix of generated + uploaded)
  constancia_fiscal: { section: 'C', label: 'Constancia de Situacion Fiscal' },
  indautor_guion: { section: 'C', label: 'Certificado INDAUTOR' },
  C2b: { section: 'C', label: 'Cesion de Derechos' },
  C3a: { section: 'C', label: 'Carta Buenas Practicas' },
  C3b: { section: 'C', label: 'Carta PICS' },
  C4: { section: 'C', label: 'Ficha Tecnica' },

  // Section D - Cotizaciones (uploaded docs, keys = tipo)
  cotizacion_seguro: { section: 'D', label: 'Cotizacion Seguro' },
  cotizacion_contador: { section: 'D', label: 'Cotizacion Contador' },

  // Section E - Finanzas (mix of generated + uploaded)
  E1: { section: 'E', label: 'Esquema Financiero' },
  estado_cuenta: { section: 'E', label: 'Estado de Cuenta Bancario' },
  E2: {
    section: 'E',
    label: 'Carta de Aportacion Exclusiva',
    conditional: true,
    conditionField: 'hasExclusiveContribution',
  },
  E3: {
    section: 'E',
    label: 'Contrato Terceros',
    conditional: true,
    conditionField: 'hasThirdPartyContribution',
  },
  E4: {
    section: 'E',
    label: 'Contrato Coproduccion',
    conditional: true,
    conditionField: 'hasInternationalCoproduction',
  },
}

/**
 * 8 prohibited expenditure categories for EFICINE funds.
 * Per validation_rules.md Rule 7.
 */
export const PROHIBITED_CATEGORIES: string[] = [
  'gastos_previos_al_estimulo',
  'distribucion_difusion_comercializacion',
  'elaboracion_carpeta',
  'completion_bond',
  'mark_up_servicios_produccion',
  'honorarios_erpi_persona_fisica',
  'activos_fijos',
  'gastos_admin_post_coprod_internacional_mayoritaria',
]

/**
 * Document types subject to 3-month (90 day) expiration.
 * Per validation_rules.md Rule 4.
 */
export const EXPIRABLE_DOC_TYPES: string[] = [
  'seguro',
  'contador',
  'estado_cuenta',
  'carta_apoyo',
  'cotizacion_especie',
]
