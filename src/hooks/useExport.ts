/**
 * Export orchestration hook -- coordinates the full export pipeline.
 *
 * Pipeline steps:
 * 1. Language check (LANG-05) -- scan for anglicisms, format issues, title mismatches
 * 2. Render PDFs -- adapt raw Firestore content, render via pdfRenderer
 * 3. Render meta docs -- validation report, score estimate, submission guide
 * 4. Fetch uploads -- download uploaded files from Storage, rename per IMCINE convention
 * 5. Compile ZIP -- assemble all files into structured ZIP
 * 6. Download -- trigger browser download, store for re-download
 */
import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { ExportProgress } from '@/lib/export/types'
import type { LanguageCheckResult } from '@/lib/export/languageCheck'
import { runLanguageCheck } from '@/lib/export/languageCheck'
import { adaptContentForTemplate, getSectionLabel } from '@/lib/export/contentAdapters'
import { EXPORT_FILE_MAP, generateFilename, sanitizeProjectAbbrev } from '@/lib/export/fileNaming'
import { renderDocumentToPdf, renderMetaDocument } from '@/lib/export/pdfRenderer'
import { compileExportZip, downloadZip } from '@/lib/export/zipCompiler'
import type { ZipFileEntry, ZipMetaEntry } from '@/lib/export/zipCompiler'
import { fetchGeneratedDocContents, fetchUploadedFiles } from '@/services/export'
import type { UploadValidationError } from '@/services/export'
import { es } from '@/locales/es'
import { formatDateES } from '@/lib/format'
import type { ValidationReport } from '@/validation/types'
import type { ScoreCategory, ImprovementSuggestion } from '@/validation/scoring'

// ---- Types ----

export interface UseExportResult {
  startExport: () => Promise<void>
  progress: ExportProgress | null
  isExporting: boolean
  languageCheckResult: LanguageCheckResult | null
  downloadInfo: { blob: Blob; filename: string; size: string; date: string } | null
  error: string | null
  uploadErrors: UploadValidationError[]
  redownload: () => void
}

// ---- Hook ----

export function useExport(
  projectId: string,
  projectTitle: string,
  validationReport: ValidationReport | null,
  viabilityScore: ScoreCategory[],
  improvements: ImprovementSuggestion[],
): UseExportResult {
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [languageCheckResult, setLanguageCheckResult] = useState<LanguageCheckResult | null>(null)
  const [downloadInfo, setDownloadInfo] = useState<{
    blob: Blob
    filename: string
    size: string
    date: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<UploadValidationError[]>([])

  // Store ZIP blob in ref so it survives re-renders for re-download
  const zipBlobRef = useRef<{ blob: Blob; filename: string } | null>(null)

  const redownload = useCallback(() => {
    if (zipBlobRef.current) {
      downloadZip(zipBlobRef.current.blob, zipBlobRef.current.filename)
    }
  }, [])

  const startExport = useCallback(async () => {
    setIsExporting(true)
    setError(null)
    setUploadErrors([])
    setProgress(null)

    try {
      // ---- Phase 1: Language check ----
      setProgress({ phase: 'language-check', current: 0, total: 1 })

      const allDocs = await fetchGeneratedDocContents(projectId)

      // Prepare docs for language check (flatten content to string)
      const docsForCheck = allDocs.map((d) => ({
        docId: d.docId,
        docName: d.docName || d.docId,
        content: flattenContent(d.content),
      }))

      const langResult = runLanguageCheck(docsForCheck, projectTitle)
      setLanguageCheckResult(langResult)

      if (langResult.hasBlockers) {
        // Title mismatches are blockers -- stop export
        setProgress({ phase: 'error', current: 0, total: 0, errorMessage: 'Errores de titulo detectados' })
        setError('Errores de titulo detectados')
        return
      }

      // ---- Phase 2: Render PDFs ----
      const docEntries = Object.entries(EXPORT_FILE_MAP).filter(
        ([docId]) => allDocs.some((d) => d.docId === docId),
      )
      const totalPdfs = docEntries.length
      const generatedPdfs: ZipFileEntry[] = []
      let renderedCount = 0

      setProgress({ phase: 'rendering', current: 0, total: totalPdfs })

      // Batch render 3 at a time to avoid memory pressure
      for (let i = 0; i < docEntries.length; i += 3) {
        const batch = docEntries.slice(i, i + 3)
        const batchResults = await Promise.allSettled(
          batch.map(async ([docId, entry]) => {
            const docData = allDocs.find((d) => d.docId === docId)
            if (!docData) return null

            const sectionLabel = getSectionLabel(docId)
            const adapted = adaptContentForTemplate(
              docId,
              entry.templateType,
              docData.content,
              projectTitle,
              sectionLabel,
            )

            const blob = await renderDocumentToPdf({
              docId,
              content: adapted,
              templateType: entry.templateType,
              projectTitle,
              sectionLabel,
            })

            const filename = generateFilename(entry.filenameTemplate, projectTitle)

            return {
              folder: entry.section,
              filename,
              blob,
            } satisfies ZipFileEntry
          }),
        )

        for (const result of batchResults) {
          renderedCount++
          if (result.status === 'fulfilled' && result.value) {
            generatedPdfs.push(result.value)
          } else if (result.status === 'rejected') {
            const docEntry = batch[batchResults.indexOf(result)]
            const docName = docEntry?.[0] ?? 'desconocido'
            toast.error(es.export.errorPdfGeneration(docName))
          }
          setProgress({
            phase: 'rendering',
            current: renderedCount,
            total: totalPdfs,
            currentFile: batch[batchResults.indexOf(result)]?.[0],
          })
        }
      }

      // ---- Phase 3: Render meta documents ----
      const metaDocs: ZipMetaEntry[] = []

      try {
        // Validation report
        if (validationReport) {
          const validationBlob = await renderMetaDocument({
            type: 'validation-report',
            data: { report: validationReport },
            projectTitle,
          })
          metaDocs.push({ filename: 'validacion', blob: validationBlob })
        }

        // Score estimate
        if (viabilityScore.length > 0) {
          const scoreBlob = await renderMetaDocument({
            type: 'score-estimate',
            data: { categories: viabilityScore, improvements },
            projectTitle,
          })
          metaDocs.push({ filename: 'estimacion_puntaje', blob: scoreBlob })
        }

        // Submission guide
        const guideBlob = await renderMetaDocument({
          type: 'submission-guide',
          data: {},
          projectTitle,
        })
        metaDocs.push({ filename: 'guia_carga', blob: guideBlob })
      } catch (metaError) {
        console.error('Error rendering meta documents:', metaError)
        // Continue without meta docs -- not critical
      }

      // ---- Phase 4: Fetch uploads ----
      setProgress({ phase: 'fetching', current: 0, total: 0 })

      const uploadResult = await fetchUploadedFiles(
        projectId,
        projectTitle,
        (current, total) => {
          setProgress({ phase: 'fetching', current, total })
        },
      )

      if (uploadResult.errors.length > 0) {
        setUploadErrors(uploadResult.errors)
        for (const err of uploadResult.errors) {
          toast.error(es.export.errorFileFetch(err.originalFilename))
        }
      }

      const uploadedZipEntries: ZipFileEntry[] = uploadResult.files.map((f) => ({
        folder: f.folder,
        filename: f.filename,
        blob: f.blob,
      }))

      // ---- Phase 5: Compile ZIP ----
      setProgress({ phase: 'compiling', current: 0, total: 1 })

      const projectAbbrev = sanitizeProjectAbbrev(projectTitle)
      const { blob: zipBlob, filename: zipFilename } = await compileExportZip(
        projectAbbrev,
        generatedPdfs,
        uploadedZipEntries,
        metaDocs,
      )

      // ---- Phase 6: Download ----
      downloadZip(zipBlob, zipFilename)

      const sizeMB = (zipBlob.size / (1024 * 1024)).toFixed(1)
      const dateStr = formatDateES(new Date())

      zipBlobRef.current = { blob: zipBlob, filename: zipFilename }
      setDownloadInfo({
        blob: zipBlob,
        filename: zipFilename,
        size: sizeMB,
        date: dateStr,
      })

      setProgress({ phase: 'complete', current: 1, total: 1 })
      toast.success(es.export.downloadToast(zipFilename))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setProgress({ phase: 'error', current: 0, total: 0, errorMessage: message })
      setError(message)
      toast.error(es.export.progressError(message))
    } finally {
      setIsExporting(false)
    }
  }, [projectId, projectTitle, validationReport, viabilityScore, improvements])

  return {
    startExport,
    progress,
    isExporting,
    languageCheckResult,
    downloadInfo,
    error,
    uploadErrors,
    redownload,
  }
}

// ---- Helper ----

/**
 * Flatten any content structure to a string for language checking.
 */
function flattenContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (content === null || content === undefined) return ''
  if (typeof content === 'object') {
    const parts: string[] = []
    for (const value of Object.values(content as Record<string, unknown>)) {
      const flat = flattenContent(value)
      if (flat) parts.push(flat)
    }
    return parts.join(' ')
  }
  return String(content)
}
