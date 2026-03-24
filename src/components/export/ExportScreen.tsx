/**
 * Main export wizard screen (8th sidebar item).
 *
 * Three zones stacked vertically:
 * 1. ExportReadinessCard (always visible)
 * 2. LanguageCheckResults (visible after export attempt with findings)
 * 3. ExportProgressView + DownloadCard (visible during/after export)
 *
 * Upload validation errors shown in an Alert below progress view.
 */
import { useState, useCallback, useEffect } from 'react'
import { es } from '@/locales/es'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, FileText } from 'lucide-react'
import { useValidation } from '@/hooks/useValidation'
import { useGeneratedDocs } from '@/hooks/useGeneratedDocs'
import { useExport } from '@/hooks/useExport'
import { fetchProjectTitle } from '@/services/export'
import { ExportReadinessCard } from './ExportReadinessCard'
import { ExportBlockedDialog } from './ExportBlockedDialog'
import { ExportWarningsPanel } from './ExportWarningsPanel'
import { LanguageCheckResults } from './LanguageCheckResults'
import { ExportProgressView } from './ExportProgressView'
import { DownloadCard } from './DownloadCard'

interface ExportScreenProps {
  projectId: string
}

export function ExportScreen({ projectId }: ExportScreenProps) {
  const { report, viabilityScore, improvements, loading: validationLoading } = useValidation(projectId)
  const { docs: generatedDocs, loading: docsLoading } = useGeneratedDocs(projectId)

  // Fetch project title
  const [projectTitle, setProjectTitle] = useState('')
  useEffect(() => {
    fetchProjectTitle(projectId).then(setProjectTitle)
  }, [projectId])

  const {
    startExport,
    progress,
    isExporting,
    languageCheckResult,
    downloadInfo,
    error,
    uploadErrors,
    redownload,
  } = useExport(projectId, projectTitle, report, viabilityScore, improvements)

  // Blocked dialog state
  const [blockedOpen, setBlockedOpen] = useState(false)

  // Language check dismissed findings
  const [dismissedLangFindings, setDismissedLangFindings] = useState<Set<number>>(new Set())

  const handleDismissLangFinding = useCallback((index: number) => {
    setDismissedLangFindings((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }, [])

  const handleDismissAllLangFindings = useCallback(() => {
    if (!languageCheckResult) return
    const allDismissable = new Set<number>()
    languageCheckResult.findings.forEach((f, idx) => {
      if (f.severity === 'flagged') allDismissable.add(idx)
    })
    setDismissedLangFindings(allDismissable)
  }, [languageCheckResult])

  // Warning dismissed IDs
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set())

  const handleDismissWarning = useCallback((ruleId: string) => {
    setDismissedWarnings((prev) => {
      const next = new Set(prev)
      next.add(ruleId)
      return next
    })
  }, [])

  const handleDismissAllWarnings = useCallback(() => {
    if (!report) return
    const allIds = new Set(report.warnings.map((w) => w.ruleId))
    setDismissedWarnings(allIds)
  }, [report])

  // Derived state
  const loading = validationLoading || docsLoading
  const generatedDocsExist = generatedDocs.length > 0
  const exportComplete = progress?.phase === 'complete'

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 space-y-4">
        <h1 className="text-xl font-semibold">{es.export.pageTitle}</h1>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  // Empty state -- no generated docs
  if (!generatedDocsExist) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-xl font-semibold mb-6">{es.export.pageTitle}</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {es.export.emptyStateHeading}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {es.export.emptyStateBody}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">{es.export.pageTitle}</h1>

      {/* Zone 1: Readiness card */}
      <ExportReadinessCard
        report={report}
        generatedDocsExist={generatedDocsExist}
        isExporting={isExporting}
        onExport={startExport}
        onShowBlockers={() => setBlockedOpen(true)}
        onRetry={startExport}
        hasError={!!error}
        exportComplete={exportComplete}
      />

      {/* Warnings panel */}
      {report && report.warnings.length > 0 && (
        <ExportWarningsPanel
          warnings={report.warnings}
          dismissedIds={dismissedWarnings}
          onDismiss={handleDismissWarning}
          onDismissAll={handleDismissAllWarnings}
        />
      )}

      {/* Zone 2: Language check results (after first export attempt) */}
      {languageCheckResult && (
        <LanguageCheckResults
          result={languageCheckResult}
          dismissedFindings={dismissedLangFindings}
          onDismiss={handleDismissLangFinding}
          onDismissAll={handleDismissAllLangFindings}
        />
      )}

      {/* Zone 3: Progress view */}
      {(isExporting || progress) && (
        <ExportProgressView
          progress={progress}
          languageCheckDone={languageCheckResult !== null}
        />
      )}

      {/* Upload validation errors */}
      {uploadErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Errores en documentos subidos</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1 text-sm">
              {uploadErrors.map((err, idx) => (
                <li key={idx}>
                  {err.reason === 'not_pdf'
                    ? es.export.uploadErrorNotPdf(err.tipo)
                    : err.reason === 'too_large'
                      ? es.export.uploadErrorTooLarge(err.tipo, err.details ?? '')
                      : es.export.uploadErrorFetchFailed(err.tipo)}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Zone 4: Download card (after export completion) */}
      {downloadInfo && (
        <DownloadCard
          filename={downloadInfo.filename}
          sizeMB={downloadInfo.size}
          date={downloadInfo.date}
          onRedownload={redownload}
        />
      )}

      {/* Blocked dialog */}
      <ExportBlockedDialog
        open={blockedOpen}
        onOpenChange={setBlockedOpen}
        blockers={report?.blockers ?? []}
      />
    </div>
  )
}
