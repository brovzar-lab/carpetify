/**
 * ZIP compilation and download for the export pipeline.
 *
 * Assembles all generated PDFs, uploaded files, and internal meta-documents
 * into a properly structured ZIP file matching EFICINE folder convention.
 */
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { EXPORT_FOLDERS } from './folderStructure'

// ---- Types ----

export interface ZipFileEntry {
  /** Target folder: '00_ERPI', 'A_PROPUESTA', etc. */
  folder: string
  /** Filename without .pdf extension */
  filename: string
  blob: Blob
}

export interface ZipMetaEntry {
  /** Filename without .pdf extension: 'validacion', 'estimacion_puntaje', 'guia_carga' */
  filename: string
  blob: Blob
}

// ---- Compilation ----

/**
 * Compile all export files into a ZIP with organized folder structure.
 *
 * Structure: carpeta_{PROJ}_{DATE}/
 *   00_ERPI/
 *   A_PROPUESTA/
 *   B_PERSONAL/
 *   C_ERPI/
 *   D_COTIZ/
 *   E_FINANZAS/
 *   _INTERNO/  (validation report, score estimate, submission guide)
 */
export async function compileExportZip(
  projectAbbrev: string,
  generatedPdfs: ZipFileEntry[],
  uploadedFiles: ZipFileEntry[],
  metaDocs: ZipMetaEntry[],
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const zipName = `carpeta_${projectAbbrev}_${today}`
  const root = zip.folder(zipName)!

  // Create all EXPORT_FOLDERS
  for (const folder of EXPORT_FOLDERS) {
    root.folder(folder)
  }

  // Add generated PDFs
  for (const entry of generatedPdfs) {
    const folder = root.folder(entry.folder)!
    folder.file(`${entry.filename}.pdf`, entry.blob)
  }

  // Add uploaded files
  for (const entry of uploadedFiles) {
    const folder = root.folder(entry.folder)!
    folder.file(`${entry.filename}.pdf`, entry.blob)
  }

  // Add meta docs to _INTERNO
  const interno = root.folder('_INTERNO')!
  for (const meta of metaDocs) {
    interno.file(`${meta.filename}.pdf`, meta.blob)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  return { blob, filename: `${zipName}.zip` }
}

// ---- Download ----

/**
 * Trigger browser download for a ZIP blob.
 */
export function downloadZip(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}
