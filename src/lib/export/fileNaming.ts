/**
 * IMCINE file naming registry and sanitization utilities.
 *
 * Maps every generated document to its EFICINE-compliant filename template
 * and ZIP folder. Enforces max 15 chars, ASCII-only pattern per
 * schemas/export_manager.json nomenclatura rules.
 */

import type { ExportFileEntry } from './types'

/**
 * Registry mapping each document ID (from FRONTEND_DOC_REGISTRY)
 * to its export filename template, ZIP folder, and PDF template type.
 *
 * 21 entries covering all generated documents.
 */
export const EXPORT_FILE_MAP: Record<string, ExportFileEntry> = {
  // Section A — Propuesta
  A1:  { section: 'A_PROPUESTA', filenameTemplate: 'A1_RE_{PROJ}',   templateType: 'resumen-ejecutivo' },
  A2:  { section: 'A_PROPUESTA', filenameTemplate: 'A2_SIN_{PROJ}',  templateType: 'prose' },
  A4:  { section: 'A_PROPUESTA', filenameTemplate: 'A4_PD_{PROJ}',   templateType: 'prose' },
  A6:  { section: 'A_PROPUESTA', filenameTemplate: 'A6_SE_{PROJ}',   templateType: 'solidez-equipo' },
  A7:  { section: 'A_PROPUESTA', filenameTemplate: 'A7_PP_{PROJ}',   templateType: 'prose' },
  A8a: { section: 'A_PROPUESTA', filenameTemplate: 'A8_PR_{PROJ}',   templateType: 'prose' },
  A8b: { section: 'A_PROPUESTA', filenameTemplate: 'A8_RC_{PROJ}',   templateType: 'ruta-critica' },
  A9a: { section: 'A_PROPUESTA', filenameTemplate: 'A9_PRES_{PROJ}', templateType: 'budget-summary' },
  A9b: { section: 'A_PROPUESTA', filenameTemplate: 'A9_DEG_{PROJ}',  templateType: 'budget-detail' },
  A9d: { section: 'A_PROPUESTA', filenameTemplate: 'A9_FE_{PROJ}',   templateType: 'cash-flow' },
  A10: { section: 'A_PROPUESTA', filenameTemplate: 'A10_EXH_{PROJ}', templateType: 'prose' },
  A11: { section: 'A_PROPUESTA', filenameTemplate: 'A11_BP_{PROJ}',  templateType: 'prose' },

  // Section B — Personal
  'B3-prod': { section: 'B_PERSONAL', filenameTemplate: 'B3_CP_{PROJ}', templateType: 'contract' },
  'B3-dir':  { section: 'B_PERSONAL', filenameTemplate: 'B3_CD_{PROJ}', templateType: 'contract' },

  // Section C — ERPI
  C2b: { section: 'C_ERPI', filenameTemplate: 'C2_CES_{PROJ}', templateType: 'contract' },
  C3a: { section: 'C_ERPI', filenameTemplate: 'C3_BPC_{PROJ}', templateType: 'carta' },
  C3b: { section: 'C_ERPI', filenameTemplate: 'C3_PIC_{PROJ}', templateType: 'carta' },
  C4:  { section: 'C_ERPI', filenameTemplate: 'C4_FT_{PROJ}',  templateType: 'ficha-tecnica' },

  // Section E — Finanzas
  E1: { section: 'E_FINANZAS', filenameTemplate: 'E1_EF_{PROJ}',  templateType: 'financial-scheme' },
  E2: { section: 'E_FINANZAS', filenameTemplate: 'E2_CAE_{PROJ}', templateType: 'carta-aportacion' },

  // Internal
  PITCH: { section: '_INTERNO', filenameTemplate: 'PITCH_{PROJ}', templateType: 'prose' },
}

/**
 * Sanitize a project title to create the {PROJ} abbreviation.
 *
 * - Normalizes to NFD and strips diacritical marks (accents, tilde)
 * - Removes non-alphanumeric characters (spaces, symbols)
 * - Takes first 4 characters
 * - Uppercases
 *
 * @returns Max 4 chars, uppercase, ASCII-only abbreviation
 */
export function sanitizeProjectAbbrev(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip combining diacritical marks
    .replace(/[^A-Za-z0-9]/g, '')    // Keep ASCII alphanumeric only
    .substring(0, 4)
    .toUpperCase()
}

/**
 * Generate a final filename (without .pdf extension) from a template string.
 *
 * Replaces {PROJ} with the sanitized project abbreviation, strips any
 * remaining non-ASCII/non-underscore characters, and truncates to 15 chars
 * per IMCINE nomenclatura rules.
 *
 * @param template - Filename template containing {PROJ}, e.g. 'A1_RE_{PROJ}'
 * @param projectTitle - Full project title to abbreviate
 * @returns Sanitized filename, max 15 chars, matching ^[A-Za-z0-9_]{1,15}$
 */
export function generateFilename(template: string, projectTitle: string): string {
  const proj = sanitizeProjectAbbrev(projectTitle)
  const name = template.replace('{PROJ}', proj)
  // Enforce ASCII-only + underscore, truncate to 15 chars
  const sanitized = name.replace(/[^A-Za-z0-9_]/g, '').substring(0, 15)
  return sanitized
}

/**
 * Validate all filenames in EXPORT_FILE_MAP for a given project title.
 *
 * Checks that every generated filename:
 * - Is <= 15 characters
 * - Matches the IMCINE pattern ^[A-Za-z0-9_]{1,15}$
 *
 * @returns { valid: boolean; violations: string[] }
 */
export function validateAllFilenames(projectTitle: string): {
  valid: boolean
  violations: string[]
} {
  const pattern = /^[A-Za-z0-9_]{1,15}$/
  const violations: string[] = []

  for (const [docId, entry] of Object.entries(EXPORT_FILE_MAP)) {
    const filename = generateFilename(entry.filenameTemplate, projectTitle)
    if (!pattern.test(filename)) {
      violations.push(
        `${docId}: "${filename}" does not match IMCINE pattern (${filename.length} chars)`,
      )
    }
  }

  return { valid: violations.length === 0, violations }
}
