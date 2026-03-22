import { useState, useCallback, useRef, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { ScreenplayViewer } from '@/components/wizard/ScreenplayViewer'
import { ScreenplayParsedData } from '@/components/wizard/ScreenplayParsedData'
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
 * Right panel: Editable parsed screenplay data.
 * Per D-23 through D-27, INTK-04, INTK-05.
 */
export function ScreenplayUpload({ projectId }: ScreenplayUploadProps) {
  const [data, setData] = useState<Screenplay>(defaultScreenplay)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const { save, status: saveStatus } = useAutoSave(projectId, 'screenplay')

  // Load existing screenplay data from Firestore
  useEffect(() => {
    async function load() {
      try {
        const docRef = doc(db, `projects/${projectId}/screenplay`)
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
      } catch {
        // First time -- no data yet
      }
      setLoaded(true)
    }
    load()
  }, [projectId])

  // Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error(es.errors.fileUpload)
        return
      }
      setUploading(true)
      try {
        const storagePath = await uploadFile(projectId, 'guion', file)
        const url = await getFileURL(storagePath)
        setFileUrl(url)

        const updatedData: Screenplay = {
          ...data,
          uploaded_file_path: storagePath,
          screenplay_status: 'uploaded',
        }
        setData(updatedData)

        // Persist to Firestore
        const docRef = doc(db, `projects/${projectId}/screenplay`)
        await setDoc(
          docRef,
          { ...updatedData, updatedAt: serverTimestamp() },
          { merge: true },
        )
        toast.success('Guion subido exitosamente')
      } catch {
        toast.error(es.errors.fileUpload)
      } finally {
        setUploading(false)
      }
    },
    [projectId, data],
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

  const hasUploadedFile =
    data.screenplay_status !== 'pending' && data.uploaded_file_path

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

        {/* Right panel: Parsed data editor */}
        <div className="w-1/2 rounded-md border">
          <ScreenplayParsedData data={data} onChange={handleDataChange} />
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
