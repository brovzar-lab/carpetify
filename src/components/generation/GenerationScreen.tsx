/**
 * Main generation screen with pipeline control, document list, and viewer placeholder.
 * Layout: header (title + CTA) + optional pipeline progress + two-panel (doc list + viewer).
 */
import { useState } from 'react'
import { es } from '@/locales/es'
import { useGeneration } from '@/hooks/useGeneration'
import { useGeneratedDocs } from '@/hooks/useGeneratedDocs'
import { PipelineControl } from '@/components/generation/PipelineControl'
import { PipelineProgress } from '@/components/generation/PipelineProgress'
import { DocumentList } from '@/components/generation/DocumentList'
import { DocumentViewer } from '@/components/generation/DocumentViewer'

interface GenerationScreenProps {
  projectId: string
}

export function GenerationScreen({ projectId }: GenerationScreenProps) {
  const {
    isRunning,
    passProgress,
    pipelineStatus,
    failedAtPass,
    startPipeline,
  } = useGeneration(projectId)
  const { docs, loading } = useGeneratedDocs(projectId)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)

  const hasDocs = docs.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header: title + CTA */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <h1 className="text-xl font-semibold">{es.generation.pageTitle}</h1>
        <PipelineControl
          isRunning={isRunning}
          pipelineStatus={pipelineStatus}
          failedAtPass={failedAtPass}
          onGenerate={() => startPipeline()}
          onResume={(passId) => startPipeline(passId)}
        />
      </div>

      {/* Pipeline progress (when running, above content) */}
      {(isRunning || pipelineStatus === 'partial') && (
        <div className="shrink-0">
          <PipelineProgress
            passProgress={passProgress}
            isRunning={isRunning}
            pipelineStatus={pipelineStatus}
          />
        </div>
      )}

      {/* Two-panel layout or empty state */}
      {!hasDocs && !isRunning && !loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center max-w-md">
            <p className="font-semibold text-foreground">
              {es.generation.emptyHeading}
            </p>
            <p className="text-sm mt-2">{es.generation.emptyBody}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Document list (left panel, 320px) */}
          <DocumentList
            docs={docs}
            loading={loading}
            selectedDocId={selectedDocId}
            onSelectDoc={setSelectedDocId}
            passProgress={passProgress}
          />

          {/* Document viewer (right panel) */}
          <div className="flex-1 border-l flex">
            <DocumentViewer
              projectId={projectId}
              docId={selectedDocId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
