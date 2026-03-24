/**
 * ZIP folder structure constants for the export package.
 *
 * Defines the EFICINE-mandated folder hierarchy and maps
 * user-uploaded document types to their correct ZIP folder.
 */

import { sanitizeProjectAbbrev } from './fileNaming'

/**
 * ZIP folder names in order.
 * Matches SHCP upload structure per schemas/export_manager.json.
 * '_INTERNO' folder is for internal reference docs (not uploaded to IMCINE).
 */
export const EXPORT_FOLDERS = [
  '00_ERPI',
  'A_PROPUESTA',
  'B_PERSONAL',
  'C_ERPI',
  'D_COTIZ',
  'E_FINANZAS',
  '_INTERNO',
] as const

export type ExportFolder = (typeof EXPORT_FOLDERS)[number]

/**
 * Maps each user-uploaded document type (from DocumentChecklist REQUIRED_UPLOADS)
 * to its destination folder in the export ZIP.
 *
 * Types correspond to the 'tipo' field in the uploaded document records.
 */
export const UPLOADED_DOC_FOLDER_MAP: Record<string, string> = {
  // ERPI documents -> 00_ERPI
  acta_constitutiva: '00_ERPI',
  poder_notarial: '00_ERPI',
  identificacion_rep_legal: '00_ERPI',
  constancia_fiscal: '00_ERPI',

  // CVs and IDs -> B_PERSONAL
  cv_productor: 'B_PERSONAL',
  cv_director: 'B_PERSONAL',
  cv_guionista: 'B_PERSONAL',
  identificacion_equipo: 'B_PERSONAL',

  // Signed contracts -> B_PERSONAL (uploaded signed versions)
  contrato_productor: 'B_PERSONAL',
  contrato_director: 'B_PERSONAL',
  contrato_guionista: 'B_PERSONAL',

  // INDAUTOR -> C_ERPI
  indautor_guion: 'C_ERPI',
  indautor_musica: 'C_ERPI',

  // Coprod recognition -> C_ERPI
  reconocimiento_coprod: 'C_ERPI',

  // Insurance, CPA, equipment quotes -> D_COTIZ
  cotizacion_seguro: 'D_COTIZ',
  cotizacion_contador: 'D_COTIZ',
  cotizacion_equipo: 'D_COTIZ',

  // Bank statements and support letters -> E_FINANZAS
  estado_cuenta: 'E_FINANZAS',
  carta_apoyo: 'E_FINANZAS',
}

/**
 * Generate the ZIP filename for a project export.
 *
 * Format: carpeta_{ABBREV}_{YYYY-MM-DD}.zip
 * Per D-16 naming convention.
 *
 * @param projectTitle - Full project title
 * @returns ZIP filename string
 */
export function generateZipFilename(projectTitle: string): string {
  const abbrev = sanitizeProjectAbbrev(projectTitle)
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `carpeta_${abbrev}_${yyyy}-${mm}-${dd}.zip`
}
