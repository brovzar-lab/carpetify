import { useState, useCallback, useRef, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, functions } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ScreenplayViewer } from '@/components/wizard/ScreenplayViewer'
import { ScreenplayParsedData } from '@/components/wizard/ScreenplayParsedData'
import { AnalysisResults } from '@/components/wizard/AnalysisResults'
import { uploadFile, getFileURL } from '@/services/storage'
import { useAutoSave } from '@/hooks/useAutoSave'
import { screenplaySchema, type Screenplay } from '@/schemas/screenplay'
import { es } from '@/locales/es'

interface ScreenplayUploadProps {
  projectId: string
}

const defaultScreenplay: Screenplay = {
  escenas: [],
  locaciones: [],
  personajes: [],
  screenplay_status: 'pending',
}

/**
 * Screen 2 (Guion): Side-by-side PDF viewer + parsed data editor.
 * Left panel: PDF viewer or upload prompt.
 * Right panel: Editable parsed screenplay data + analysis results.
 * Per D-23 through D-27, INTK-04, INTK-05.
 * Updated for Phase 2: Cloud Function extraction + Claude analysis flow.
 */
export function ScreenplayUpload({ projectId }: ScreenplayUploadProps) {
  const [data, setData] = useState<Screenplay>(defaultScreenplay)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  // Analysis state
  const [analysisStatus, setAnalysisStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [analysisData, setAnalysisData] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const { save } = useAutoSave(projectId, 'screenplay')

  // Load existing screenplay data and analysis from Firestore
  useEffect(() => {
    async function load() {
      try {
        const docRef = doc(db, `projects/${projectId}/screenplay/data`)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const raw = snap.data()
          const parsed = screenplaySchema.safeParse(raw)
          if (parsed.success) {
            setData(parsed.data)
            // Load PDF URL if file was uploaded
            if (parsed.data.uploaded_file_path) {
              try {
                const url = await getFileURL(parsed.data.uploaded_file_path)
                setFileUrl(url)
              } catch {
                // File might not exist anymore
              }
            }
          }
        }

        // Load analysis data if it exists
        const analysisSnap = await getDoc(
          doc(db, `projects/${projectId}/screenplay/analysis`),
        )
        if (analysisSnap.exists()) {
          setAnalysisData(analysisSnap.data())
          setAnalysisStatus('success')
        }
      } catch {
        // First time -- no data yet
      }
      setLoaded(true)
    }
    load()
  }, [projectId])

  // Handle file upload -- now uses Cloud Function for extraction
  const MAX_FILE_SIZE_CF = 15 * 1024 * 1024 // 15 MB per D-05
  const MAX_FILE_SIZE_STORAGE = 40 * 1024 * 1024 // 40 MB per SHCP

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('El archivo debe ser un PDF.')
        return
      }
      if (file.size > MAX_FILE_SIZE_STORAGE) {
        toast.error('El archivo excede el limite de 40 MB.')
        return
      }
      // D-05: Client-side check before uploading to Cloud Function
      if (file.size > MAX_FILE_SIZE_CF) {
        toast.error(es.screen2.extractionFailedLarge)
        return
      }

      setUploading(true)
      try {
        // 1. Upload file to Storage
        const storagePath = await uploadFile(projectId, 'guion', file)
        const url = await getFileURL(storagePath)
        setFileUrl(url)

        // 2. Save upload metadata to Firestore
        const updatedData: Screenplay = {
          ...data,
          uploaded_file_path: storagePath,
          screenplay_status: 'extracting',
        }
        setData(updatedData)
        const docRef = doc(db, `projects/${projectId}/screenplay/data`)
        await setDoc(
          docRef,
          { ...updatedData, updatedAt: serverTimestamp() },
          { merge: true },
        )

        // 3. Call extraction Cloud Function
        try {
          const extractScreenplay = httpsCallable(
            functions,
            'extractScreenplay',
          )
          const result = await extractScreenplay({ projectId, storagePath })
          const response = result.data as {
            success: boolean
            breakdown?: Record<string, unknown>
          }

          if (response.success && response.breakdown) {
            const breakdown = response.breakdown
            const parsedData: Screenplay = {
              ...data,
              ...(breakdown as Partial<Screenplay>),
              uploaded_file_path: storagePath,
              screenplay_status: 'parsed',
            }
            setData(parsedData)
            toast.success(es.screen2.extractionSuccess)

            // Mark existing analysis as stale if it exists
            if (analysisStatus === 'success') {
              parsedData.analysis_stale = true
              setData({ ...parsedData, analysis_stale: true })
            }
          }
        } catch (extractErr) {
          console.warn(
            '[ScreenplayUpload] Extraction failed (non-fatal):',
            extractErr,
          )
          // Fall back to uploaded state -- user can enter data manually
          setData({
            ...data,
            uploaded_file_path: storagePath,
            screenplay_status: 'uploaded',
          })
          toast.warning(es.screen2.parserFailed)
        }

        toast.success('Guion subido exitosamente')
      } catch (err) {
        console.error('[ScreenplayUpload] Upload failed:', err)
        toast.error(es.errors.fileUpload)
      } finally {
        setUploading(false)
      }
    },
    [projectId, data, analysisStatus],
  )

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file)
      e.target.value = ''
    },
    [handleUpload],
  )

  // Handle replace confirmation
  const handleReplaceConfirm = useCallback(() => {
    setShowReplaceDialog(false)
    replaceInputRef.current?.click()
  }, [])

  // Handle parsed data changes
  const handleDataChange = useCallback(
    (newData: Screenplay) => {
      setData(newData)
      // Auto-save parsed data changes
      const { uploaded_file_path: _file, ...saveable } = newData
      save(saveable as unknown as Record<string, unknown>)
    },
    [save],
  )

  // Handle "Analizar guion" click
  const handleAnalyze = useCallback(async () => {
    setAnalysisStatus('loading')
    setAnalysisError(null)
    try {
      const analyzeScreenplay = httpsCallable(functions, 'analyzeScreenplay')
      const result = await analyzeScreenplay({ projectId })
      const response = result.data as {
        success: boolean
        analysis?: Record<string, unknown>
      }
      if (response.success && response.analysis) {
        setAnalysisData(response.analysis)
        setAnalysisStatus('success')

        // Update local screenplay data with analysis results
        const analysis = response.analysis as {
          estimacion_jornadas?: { media?: number }
          complejidad_global?: {
            escenas_stunts?: number
            escenas_vfx?: number
            escenas_agua?: number
            escenas_menores?: number
            escenas_nocturnas?: number
            escenas_diurnas?: number
          }
        }
        setData((prev) => ({
          ...prev,
          screenplay_status: 'analyzed',
          analysis_stale: false,
          dias_rodaje_estimados: analysis.estimacion_jornadas?.media,
          complejidad: {
            stunts: (analysis.complejidad_global?.escenas_stunts || 0) > 0,
            vfx: (analysis.complejidad_global?.escenas_vfx || 0) > 0,
            agua: (analysis.complejidad_global?.escenas_agua || 0) > 0,
            animales: false,
            ninos: (analysis.complejidad_global?.escenas_menores || 0) > 0,
            noche_pct:
              (analysis.complejidad_global?.escenas_nocturnas || 0) > 0
                ? Math.round(
                    ((analysis.complejidad_global?.escenas_nocturnas || 0) /
                      ((analysis.complejidad_global?.escenas_nocturnas || 0) +
                        (analysis.complejidad_global?.escenas_diurnas || 1))) *
                      100,
                  )
                : 0,
          },
        }))
        toast.success(es.screen2.analysisSuccess)
      }
    } catch (err) {
      console.error('Analysis failed:', err)
      setAnalysisStatus('error')
      setAnalysisError(es.screen2.analysisFailed)
    }
  }, [projectId])

  const hasUploadedFile =
    data.screenplay_status !== 'pending' && data.uploaded_file_path

  // Determine if the analyze button should be disabled
  const canAnalyze =
    data.escenas.length > 0 ||
    data.locaciones.length > 0 ||
    data.personajes.length > 0

  if (!loaded) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{es.screen2.title}</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{es.screen2.title}</h1>

      {/* Side-by-side layout */}
      <div className="flex gap-4" style={{ minHeight: '70vh' }}>
        {/* Left panel: PDF viewer or empty state */}
        <div className="w-1/2 rounded-md border bg-muted/30">
          {hasUploadedFile && fileUrl ? (
            <div className="relative h-full">
              {/* Replace button */}
              <div className="absolute right-2 top-2 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplaceDialog(true)}
                >
                  Reemplazar guion
                </Button>
              </div>
              <ScreenplayViewer fileUrl={fileUrl} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                {es.screen2.emptyStateHeading}
              </h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                {es.screen2.emptyStateBody}
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Subiendo...' : es.screen2.uploadCTA}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={onFileSelect}
              />
            </div>
          )}
        </div>

        {/* Right panel: Parsed data editor + Analysis */}
        <div className="w-1/2 overflow-y-auto rounded-md border">
          <ScreenplayParsedData data={data} onChange={handleDataChange} />

          {/* Analysis CTA zone -- only show when screenplay has been parsed or uploaded */}
          {data.screenplay_status !== 'pending' && (
            <div className="px-4 pb-4">
              <Separator className="mb-4" />

              {/* Extraction spinner */}
              {data.screenplay_status === 'extracting' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {es.screen2.extracting}
                </div>
              )}

              {/* Analysis loading state */}
              {analysisStatus === 'loading' ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {es.screen2.analyzing}
                </div>
              ) : analysisStatus === 'error' ? (
                /* Error state with retry */
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center justify-between">
                    <span>{analysisError}</span>
                    <Button size="sm" onClick={handleAnalyze}>
                      {es.screen2.analysisRetryCTA}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : data.analysis_stale && analysisStatus === 'success' ? (
                /* Stale warning with reanalyze */
                <Alert>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{es.screen2.analysisStale}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyze}
                    >
                      {es.screen2.reanalyzeCTA}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : analysisStatus === 'success' ? (
                /* Success badge */
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {es.screen2.analysisBadge}
                  </Badge>
                </div>
              ) : data.screenplay_status !== 'extracting' ? (
                /* Idle -- show CTA button */
                canAnalyze ? (
                  <Button className="w-full" onClick={handleAnalyze}>
                    {es.screen2.analyzeCTA}
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        className="w-full"
                        disabled
                      >
                        <span className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50">
                          {es.screen2.analyzeCTA}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {es.screen2.analyzeCTADisabledTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              ) : null}

              {/* Analysis Results section -- only when analysis data exists */}
              {analysisStatus === 'success' && analysisData && (
                <>
                  <Separator className="my-4" />
                  <AnalysisResults
                    complejidad={data.complejidad}
                    diasRodaje={data.dias_rodaje_estimados}
                    lastAnalyzed={
                      analysisData.analyzed_at
                        ? new Date(
                            (
                              analysisData.analyzed_at as {
                                seconds: number
                              }
                            ).seconds * 1000,
                          )
                        : null
                    }
                    estimacion={
                      analysisData.estimacion_jornadas as
                        | {
                            baja: number
                            media: number
                            alta: number
                          }
                        | undefined
                    }
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for replace */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={onFileSelect}
      />

      {/* Replace confirmation dialog per D-27 */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reemplazar guion</DialogTitle>
            <DialogDescription>
              {es.screen2.reuploadConfirmBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReplaceDialog(false)}
            >
              {es.screen2.reuploadCancel}
            </Button>
            <Button onClick={handleReplaceConfirm}>
              {es.screen2.reuploadConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
