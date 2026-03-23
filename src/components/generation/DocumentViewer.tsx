/**
 * Right-panel document viewer with read/edit modes.
 * Shows formatted document content with metadata footer.
 * Edit mode provides Textarea with save/cancel and "edits will be lost" warning.
 * Edits write manuallyEdited flag to Firestore.
 * A9b excluded from text editing (uses BudgetEditor in Plan 06).
 */
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { es } from '@/locales/es'
import { formatDateES } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { StalenessIndicator } from '@/components/generation/StalenessIndicator'
import { AlertTriangle, Download } from 'lucide-react'
import type { PassId } from '@/services/generation'
import { toast } from 'sonner'

// ---- Types ----

interface DocumentViewerProps {
  projectId: string
  docId: string | null
  onDocUpdated?: () => void
  /** Whether the currently viewed document is stale */
  isStale?: boolean
  /** PassId the current document belongs to (for staleness banner) */
  docPassId?: PassId
  /** Reason text for staleness */
  staleReasonText?: string
  /** Whether any doc in the current pass has manual edits */
  passHasEditedDocs?: boolean
  /** Callback to regenerate the pass */
  onRegenerate?: () => void
  /** Whether regeneration is in progress */
  isRegenerating?: boolean
}

interface DocMeta {
  generatedAt: Date | null
  modelUsed: string
  manuallyEdited: boolean
}

// ---- Component ----

export function DocumentViewer({
  projectId,
  docId,
  onDocUpdated,
  isStale = false,
  docPassId,
  staleReasonText,
  passHasEditedDocs = false,
  onRegenerate,
  isRegenerating = false,
}: DocumentViewerProps) {
  const [docContent, setDocContent] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [docMeta, setDocMeta] = useState<DocMeta | null>(null)
  const [loading, setLoading] = useState(false)

  // Load document content from Firestore when docId changes
  useEffect(() => {
    if (!docId || !projectId) return
    setLoading(true)
    setIsEditing(false)
    const docRef = doc(db, `projects/${projectId}/generated/${docId}`)
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        // Use editedContent if available (manual edits), otherwise original content
        const content = data.editedContent ?? data.content
        // For prose: content is a string
        // For structured: content is JSON (render as formatted text)
        setDocContent(
          typeof content === 'string'
            ? content
            : JSON.stringify(content, null, 2),
        )
        setDocMeta({
          generatedAt: data.generatedAt?.toDate?.() ?? null,
          modelUsed: data.modelUsed ?? '',
          manuallyEdited: data.manuallyEdited ?? false,
        })
      } else {
        setDocContent(null)
        setDocMeta(null)
      }
      setLoading(false)
    })
  }, [projectId, docId])

  const handleStartEdit = () => {
    setEditedContent(docContent ?? '')
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!docId) return
    const docRef = doc(db, `projects/${projectId}/generated/${docId}`)
    await updateDoc(docRef, {
      editedContent: editedContent,
      manuallyEdited: true,
    })
    setDocContent(editedContent)
    setIsEditing(false)
    setDocMeta((prev) => (prev ? { ...prev, manuallyEdited: true } : null))
    onDocUpdated?.()
    toast.success(es.generation.editSaved)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // A4 Word export handler -- generates a simple .txt template for the director
  const handleA4WordExport = () => {
    const templateText = [
      'PROPUESTA DE DIRECCION',
      '',
      'Proyecto: ___________________________',
      'Director: ___________________________',
      'Fecha: ___________________________',
      '',
      '1. Vision del director',
      '',
      '   [El director describira aqui su vision artistica para el proyecto.]',
      '',
      '2. Propuesta visual',
      '',
      '   [Descripcion de la estetica visual, paleta de color, iluminacion, movimientos de camara.]',
      '',
      '3. Direccion de actores',
      '',
      '   [Enfoque para el trabajo con los actores, metodo, ensayos.]',
      '',
      '4. Propuesta sonora',
      '',
      '   [Descripcion del diseno sonoro y banda sonora.]',
      '',
      '5. Referencias visuales',
      '',
      '   [Peliculas, fotografias u obras que inspiran el proyecto.]',
      '',
    ].join('\n')

    const blob = new Blob([templateText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'A4_PropDir.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Empty state: no document selected
  if (!docId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="font-semibold text-foreground">
            {es.generation.viewerEmptyHeading}
          </p>
          <p className="text-sm mt-1">{es.generation.viewerEmptyBody}</p>
        </div>
      </div>
    )
  }

  // A4 special handling: Word export template for the director (D-07)
  if (docId === 'A4') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">
            {es.generation.docNames.A4}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center max-w-md space-y-4">
            <p>{es.generation.wordExportTooltip}</p>
            <Button variant="outline" onClick={handleA4WordExport}>
              <Download className="h-4 w-4 mr-2" />
              {es.generation.wordExportButton}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header bar: doc title + edit button */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-xl font-semibold">
          {es.generation.docNames[docId as keyof typeof es.generation.docNames] ?? docId}
        </h2>
        {!isEditing && docId !== 'A9b' && !loading && (
          <Button variant="outline" onClick={handleStartEdit}>
            {es.generation.editButton}
          </Button>
        )}
      </div>

      {/* Edit mode warning banner */}
      {isEditing && (
        <Alert className="m-4 mb-0" variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{es.generation.editWarning}</AlertDescription>
        </Alert>
      )}

      {/* Staleness banner */}
      {isStale && !isEditing && docPassId && staleReasonText && onRegenerate && (
        <StalenessIndicator
          passId={docPassId}
          reason={staleReasonText}
          onRegenerate={onRegenerate}
          hasEditedDocs={passHasEditedDocs}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Content area */}
      <ScrollArea className="flex-1 p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                {es.generation.cancelEdits}
              </Button>
              <Button onClick={handleSaveEdit}>
                {es.generation.saveEdits}
              </Button>
            </div>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {docContent}
          </div>
        )}
      </ScrollArea>

      {/* Footer: metadata */}
      {!isEditing && docMeta && !loading && (
        <div className="border-t p-4 text-xs text-muted-foreground flex items-center gap-4">
          {docMeta.generatedAt && (
            <span>Generado: {formatDateES(docMeta.generatedAt)}</span>
          )}
          {docMeta.modelUsed && <span>Modelo: {docMeta.modelUsed}</span>}
          {docMeta.manuallyEdited && (
            <Badge
              variant="outline"
              className="text-[hsl(38_92%_50%)]"
            >
              {es.generation.statusEdited}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
