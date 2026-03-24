/**
 * Export data service -- fetches all project data needed for export.
 *
 * Reads generated document contents from Firestore and uploaded file blobs
 * from Firebase Storage. Renames uploaded files per IMCINE convention and
 * validates them per D-04 (PDF format, size <= 40MB).
 */
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getFileURL } from '@/services/storage'
import { UPLOADED_DOC_FOLDER_MAP } from '@/lib/export/folderStructure'
import { sanitizeProjectAbbrev } from '@/lib/export/fileNaming'

// ---- Types ----

export interface ExportDocData {
  docId: string
  docName: string
  content: unknown // raw Firestore content
  contentType: string
}

export interface ExportUploadData {
  tipo: string
  filename: string // IMCINE-convention renamed filename (without .pdf)
  folder: string // target ZIP folder from UPLOADED_DOC_FOLDER_MAP
  storagePath: string
  downloadUrl: string
  blob: Blob
}

export interface UploadValidationError {
  tipo: string
  originalFilename: string
  reason: 'not_pdf' | 'too_large' | 'fetch_failed'
  details?: string
}

// ---- Upload tipo to IMCINE filename mapping ----

const UPLOAD_FILENAME_MAP: Record<string, string> = {
  acta_constitutiva: 'ACTA',
  poder_notarial: 'PODER',
  identificacion_rep_legal: 'ID_REP',
  constancia_fiscal: 'CSF',
  cv_productor: 'CV_PROD',
  cv_director: 'CV_DIR',
  cv_guionista: 'CV_GUIN',
  identificacion_equipo: 'ID_EQ',
  contrato_productor: 'CTR_PROD',
  contrato_director: 'CTR_DIR',
  contrato_guionista: 'CTR_GUIN',
  indautor_guion: 'IND_GUI',
  indautor_musica: 'IND_MUS',
  reconocimiento_coprod: 'REC_COP',
  cotizacion_seguro: 'COT_SEG',
  cotizacion_contador: 'COT_CPA',
  cotizacion_equipo: 'COT_EQ',
  estado_cuenta: 'EDO_CTA',
  carta_apoyo: 'CRT_APO',
}

// ---- Fetch generated document contents ----

/**
 * Read all docs from projects/{projectId}/generated, return docId + full content.
 */
export async function fetchGeneratedDocContents(
  projectId: string,
): Promise<ExportDocData[]> {
  const colRef = collection(db, `projects/${projectId}/generated`)
  const snapshot = await getDocs(colRef)

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      docId: docSnap.id,
      docName: (data.docName as string) ?? '',
      content: data.content ?? data,
      contentType: (data.contentType as string) ?? 'prose',
    }
  })
}

// ---- Fetch and validate uploaded files per D-04 ----

const MAX_FILE_SIZE = 40 * 1024 * 1024 // 40MB per SHCP limit

/**
 * Fetch uploaded files from Firebase Storage, rename per IMCINE convention,
 * and validate (PDF format, size <= 40MB).
 */
export async function fetchUploadedFiles(
  projectId: string,
  projectTitle: string,
  onProgress: (current: number, total: number) => void,
): Promise<{ files: ExportUploadData[]; errors: UploadValidationError[] }> {
  // Read uploaded docs metadata from Firestore
  const colRef = collection(db, `projects/${projectId}/documents`)
  const snapshot = await getDocs(colRef)

  const files: ExportUploadData[] = []
  const errors: UploadValidationError[] = []
  const total = snapshot.docs.length
  let current = 0

  const proj = sanitizeProjectAbbrev(projectTitle)

  for (const docSnap of snapshot.docs) {
    current++
    const data = docSnap.data()
    const tipo = (data.tipo as string) ?? ''
    const originalFilename = (data.filename as string) ?? ''
    const storagePath = (data.storagePath as string) ?? ''

    // Check folder mapping exists
    const folder = UPLOADED_DOC_FOLDER_MAP[tipo]
    if (!folder) {
      // Unknown tipo -- skip
      onProgress(current, total)
      continue
    }

    // Validate PDF format
    if (!originalFilename.toLowerCase().endsWith('.pdf')) {
      errors.push({
        tipo,
        originalFilename,
        reason: 'not_pdf',
      })
      onProgress(current, total)
      continue
    }

    // Generate IMCINE-convention filename
    const baseName = UPLOAD_FILENAME_MAP[tipo] ?? tipo.toUpperCase().substring(0, 8)
    const filename = `${baseName}_${proj}`.substring(0, 15)

    // Fetch blob from Storage
    try {
      const downloadUrl = await getFileURL(storagePath)
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        errors.push({
          tipo,
          originalFilename,
          reason: 'fetch_failed',
          details: `HTTP ${response.status}`,
        })
        onProgress(current, total)
        continue
      }

      const blob = await response.blob()

      // Validate size
      if (blob.size > MAX_FILE_SIZE) {
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1)
        errors.push({
          tipo,
          originalFilename,
          reason: 'too_large',
          details: `${sizeMB} MB`,
        })
        onProgress(current, total)
        continue
      }

      files.push({
        tipo,
        filename,
        folder,
        storagePath,
        downloadUrl,
        blob,
      })
    } catch {
      errors.push({
        tipo,
        originalFilename,
        reason: 'fetch_failed',
        details: 'Error de red',
      })
    }

    onProgress(current, total)
  }

  return { files, errors }
}

/**
 * Fetch the project metadata (title, etc.) for export.
 */
export async function fetchProjectTitle(projectId: string): Promise<string> {
  const docRef = doc(db, `projects/${projectId}`)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return ''
  const data = snap.data()
  const metadata = data.metadata as Record<string, unknown> | undefined
  return (metadata?.titulo_proyecto as string) ?? ''
}
