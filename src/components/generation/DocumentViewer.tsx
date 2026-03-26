/**
 * Right-panel document viewer with read/edit/history/compare modes.
 * Shows formatted document content with metadata footer.
 * Edit mode provides Textarea with save/cancel and "edits will be lost" warning.
 * Edits write manuallyEdited flag to Firestore.
 * A9b excluded from text editing (uses BudgetEditor in Plan 06).
 *
 * Phase 14: Added version history panel, side-by-side diff comparison,
 * and revert with soft downstream warning per D-10 override.
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
import { VersionHistoryPanel } from '@/components/versioning/VersionHistoryPanel'
import { VersionSelector } from '@/components/versioning/VersionSelector'
import { ProseDiffViewer } from '@/components/versioning/ProseDiffViewer'
import { StructuredDiffViewer } from '@/components/versioning/StructuredDiffViewer'
import { RevertConfirmDialog } from '@/components/versioning/RevertConfirmDialog'
import {
  getDocumentVersions,
  getCurrentDocumentAsVersion,
  revertDocumentVersion,
} from '@/services/versionHistory'
import { writeActivityEntry } from '@/services/activityLog'
import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle, Download, History, X } from 'lucide-react'
import { toast } from 'sonner'
import type { PassId } from '@/services/generation'
import type { DocumentVersion, CurrentDocumentVersion } from '@/types/versioning'

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

  // Version history state
  const [viewMode, setViewMode] = useState<'content' | 'history' | 'compare'>('content')
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [currentVersionData, setCurrentVersionData] = useState<CurrentDocumentVersion | null>(null)
  const [versionsLoading, setVersionsLoading] = useState(false)

  // Comparison state
  const [versionA, setVersionA] = useState<number>(0)
  const [versionB, setVersionB] = useState<number>(0)

  // Revert state
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [revertTargetVersion, setRevertTargetVersion] = useState<number>(0)
  const [revertLoading, setRevertLoading] = useState(false)
  const [affectedDocuments, setAffectedDocuments] = useState<string[]>([])

  const { user } = useAuth()

  // Load document content from Firestore when docId changes
  useEffect(() => {
    if (!docId || !projectId) return
    setLoading(true)
    setIsEditing(false)
    setViewMode('content')
    setVersions([])
    setCurrentVersionData(null)
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

  // Load version history when entering history/compare mode
  const loadVersions = async () => {
    if (!docId || !projectId) return
    setVersionsLoading(true)
    try {
      const [hist, current] = await Promise.all([
        getDocumentVersions(projectId, docId),
        getCurrentDocumentAsVersion(projectId, docId),
      ])
      setVersions(hist)
      setCurrentVersionData(current)
      // Default comparison: current vs immediately previous
      if (current && hist.length > 0) {
        setVersionB(current.version)
        setVersionA(hist[0].version)
      }
    } catch {
      toast.error(es.versioning.fetchError)
    } finally {
      setVersionsLoading(false)
    }
  }

  const handleStartEdit = () => {
    setViewMode('content') // Exit history/compare if open
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

  // History toggle handler
  const handleToggleHistory = () => {
    if (viewMode === 'history' || viewMode === 'compare') {
      setViewMode('content')
    } else {
      setViewMode('history')
      setIsEditing(false) // History and edit are mutually exclusive per UI-SPEC
      loadVersions()
    }
  }

  const handleCompare = () => {
    setViewMode('compare')
    if (versions.length === 0) loadVersions()
  }

  const handleCloseCompare = () => {
    setViewMode('history')
  }

  // Revert handler with soft cascade warning (D-10 override)
  const handleRevertRequest = (targetVersion: number) => {
    setRevertTargetVersion(targetVersion)
    // Per D-10 override: affectedDocuments will be populated from the revert response
    // and shown in a toast after success. For pre-confirmation, we clear any stale state.
    setAffectedDocuments([])
    setRevertDialogOpen(true)
  }

  const handleRevertConfirm = async () => {
    if (!docId || !projectId) return
    setRevertLoading(true)
    try {
      const result = await revertDocumentVersion(projectId, docId, revertTargetVersion)

      // Log revert activity per D-12 (no staleness cascade log entry per D-10 override)
      if (user) {
        const docName = es.generation.docNames[docId as keyof typeof es.generation.docNames] ?? docId
        await writeActivityEntry(projectId, {
          userId: user.uid,
          displayName: user.displayName ?? '',
          photoURL: user.photoURL ?? null,
          userRole: '',
          screen: 'generacion',
          action: 'revert',
          changedFields: [docId],
          summary: es.versioning.activityRevert(
            user.displayName ?? 'Usuario',
            docName,
            revertTargetVersion,
          ),
        })
      }

      toast.success(es.versioning.revertSuccess)

      // Per D-10 override: show non-blocking downstream warning if affected docs exist
      if (result.affectedDocuments && result.affectedDocuments.length > 0) {
        toast.warning(
          es.versioning.downstreamWarning(result.affectedDocuments.join(', ')),
          { duration: 8000 },
        )
      }

      setRevertDialogOpen(false)
      setViewMode('content')

      // Reload the document content to show reverted version
      onDocUpdated?.()
      setLoading(true)
      const docRef = doc(db, `projects/${projectId}/generated/${docId}`)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const data = snap.data()
        const content = data.editedContent ?? data.content
        setDocContent(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
        setDocMeta({
          generatedAt: data.generatedAt?.toDate?.() ?? null,
          modelUsed: data.modelUsed ?? '',
          manuallyEdited: data.manuallyEdited ?? false,
        })
      }
      setLoading(false)
    } catch {
      toast.error(es.versioning.revertError)
    } finally {
      setRevertLoading(false)
    }
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
      {/* Header bar: doc title + history/edit buttons */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-xl font-semibold">
          {es.generation.docNames[docId as keyof typeof es.generation.docNames] ?? docId}
        </h2>
        <div className="flex items-center gap-2">
          {/* History toggle button per UI-SPEC */}
          {!loading && (
            <Button
              variant={viewMode === 'history' || viewMode === 'compare' ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleHistory}
            >
              {viewMode === 'history' || viewMode === 'compare' ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  {es.versioning.closeHistory}
                </>
              ) : (
                <>
                  <History className="h-4 w-4 mr-1" />
                  {es.versioning.historyButton}
                </>
              )}
            </Button>
          )}
          {/* Existing edit button -- only show in content mode */}
          {viewMode === 'content' && !isEditing && docId !== 'A9b' && !loading && (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              {es.generation.editButton}
            </Button>
          )}
        </div>
      </div>

      {/* Edit mode warning banner */}
      {isEditing && (
        <Alert className="m-4 mb-0" variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{es.generation.editWarning}</AlertDescription>
        </Alert>
      )}

      {/* Staleness banner */}
      {isStale && !isEditing && viewMode === 'content' && docPassId && staleReasonText && onRegenerate && (
        <StalenessIndicator
          passId={docPassId}
          reason={staleReasonText}
          onRegenerate={onRegenerate}
          hasEditedDocs={passHasEditedDocs}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Content area -- mode-dependent */}
      {viewMode === 'history' ? (
        <VersionHistoryPanel
          projectId={projectId}
          docId={docId}
          currentVersion={currentVersionData}
          onCompare={handleCompare}
          onRevert={handleRevertRequest}
          onClose={() => setViewMode('content')}
        />
      ) : viewMode === 'compare' ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="border-b p-3">
            <VersionSelector
              versions={[
                ...(currentVersionData ? [{
                  version: currentVersionData.version,
                  generatedAt: currentVersionData.generatedAt,
                  triggeredBy: null,
                  triggerReason: 'regeneration' as const,
                }] : []),
                ...versions.map(v => ({
                  version: v.version,
                  generatedAt: v.generatedAt,
                  triggeredBy: v.triggeredBy,
                  triggerReason: v.triggerReason,
                })),
              ]}
              currentVersion={currentVersionData?.version ?? 0}
              versionA={versionA}
              versionB={versionB}
              onVersionAChange={setVersionA}
              onVersionBChange={setVersionB}
              onClose={handleCloseCompare}
            />
          </div>
          <ScrollArea className="flex-1 p-6">
            {versionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : (() => {
              // Find content for selected versions
              const contentA = versionA === currentVersionData?.version
                ? currentVersionData?.content
                : versions.find(v => v.version === versionA)?.content
              const contentB = versionB === currentVersionData?.version
                ? currentVersionData?.content
                : versions.find(v => v.version === versionB)?.content
              const contentType = currentVersionData?.contentType ?? 'prose'

              const labelA = `${es.versioning.versionLabel(versionA)}`
              const labelB = versionB === currentVersionData?.version
                ? `${es.versioning.versionLabel(versionB)} ${es.versioning.currentLabel}`
                : `${es.versioning.versionLabel(versionB)}`

              if (contentType === 'prose') {
                return (
                  <ProseDiffViewer
                    oldContent={String(contentA ?? '')}
                    newContent={String(contentB ?? '')}
                    oldLabel={labelA}
                    newLabel={labelB}
                  />
                )
              }
              return (
                <StructuredDiffViewer
                  oldContent={contentA}
                  newContent={contentB}
                  oldLabel={labelA}
                  newLabel={labelB}
                />
              )
            })()}
          </ScrollArea>
        </div>
      ) : (
        /* Content mode (read + edit) -- existing functionality */
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
      )}

      {/* Footer: metadata */}
      {viewMode === 'content' && !isEditing && docMeta && !loading && (
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

      {/* Revert confirmation dialog */}
      <RevertConfirmDialog
        open={revertDialogOpen}
        onOpenChange={setRevertDialogOpen}
        targetVersion={revertTargetVersion}
        targetDate={
          versions.find(v => v.version === revertTargetVersion)?.generatedAt
            ? formatDateES(versions.find(v => v.version === revertTargetVersion)!.generatedAt!)
            : null
        }
        isManuallyEdited={docMeta?.manuallyEdited ?? false}
        onConfirm={handleRevertConfirm}
        isLoading={revertLoading}
        affectedDocuments={affectedDocuments}
      />
    </div>
  )
}
