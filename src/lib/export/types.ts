/**
 * Shared types for the export pipeline.
 * Used across file naming, PDF rendering, ZIP compilation, and export UI.
 */

export type TemplateType =
  | 'prose'
  | 'resumen-ejecutivo'
  | 'solidez-equipo'
  | 'budget-summary'
  | 'budget-detail'
  | 'cash-flow'
  | 'ruta-critica'
  | 'financial-scheme'
  | 'contract'
  | 'carta'
  | 'carta-aportacion'
  | 'ficha-tecnica'

export interface ExportFileEntry {
  /** ZIP folder: 'A_PROPUESTA', 'B_PERSONAL', etc. */
  section: string
  /** Filename template with {PROJ} placeholder, e.g. 'A1_RE_{PROJ}' */
  filenameTemplate: string
  /** Which PDF template to use for rendering */
  templateType: TemplateType
}

export interface ExportProgress {
  phase: 'language-check' | 'rendering' | 'fetching' | 'compiling' | 'complete' | 'error'
  current: number
  total: number
  currentFile?: string
  errorMessage?: string
}
