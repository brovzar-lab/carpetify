/**
 * Left panel (320px) document list organized by EFICINE section.
 * Groups all 21 documents by section: A, B, C, E, EXTRA.
 * Uses ScrollArea for independent scrolling.
 * Shows empty state when no documents exist.
 */
import { es } from '@/locales/es'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { DocumentListItem } from '@/components/generation/DocumentListItem'
import type { GeneratedDocClient } from '@/hooks/useGeneratedDocs'
import type { PassProgress } from '@/hooks/useGeneration'
import type { PassId } from '@/services/generation'

// ---- Frontend document registry (mirrors backend DOCUMENT_REGISTRY) ----

interface DocRegistryEntry {
  docId: string
  section: string
  passId: string
}

const FRONTEND_DOC_REGISTRY: DocRegistryEntry[] = [
  { docId: 'A1', section: 'A', passId: 'combined' },
  { docId: 'A2', section: 'A', passId: 'combined' },
  { docId: 'A4', section: 'A', passId: 'combined' },
  { docId: 'A6', section: 'A', passId: 'combined' },
  { docId: 'A7', section: 'A', passId: 'lineProducer' },
  { docId: 'A8a', section: 'A', passId: 'lineProducer' },
  { docId: 'A8b', section: 'A', passId: 'lineProducer' },
  { docId: 'A9a', section: 'A', passId: 'lineProducer' },
  { docId: 'A9b', section: 'A', passId: 'lineProducer' },
  { docId: 'A9d', section: 'A', passId: 'financeAdvisor' },
  { docId: 'A10', section: 'A', passId: 'combined' },
  { docId: 'A11', section: 'A', passId: 'combined' },
  { docId: 'B3-prod', section: 'B', passId: 'legal' },
  { docId: 'B3-dir', section: 'B', passId: 'legal' },
  { docId: 'C2b', section: 'C', passId: 'legal' },
  { docId: 'C3a', section: 'C', passId: 'legal' },
  { docId: 'C3b', section: 'C', passId: 'legal' },
  { docId: 'C4', section: 'C', passId: 'combined' },
  { docId: 'E1', section: 'E', passId: 'financeAdvisor' },
  { docId: 'E2', section: 'E', passId: 'financeAdvisor' },
  { docId: 'PITCH', section: 'EXTRA', passId: 'combined' },
]

/** Section display order per EFICINE convention (no D section for generated docs) */
const SECTION_ORDER = ['A', 'B', 'C', 'E', 'EXTRA'] as const

/** Group documents by section maintaining the EFICINE order */
function groupBySection(registry: DocRegistryEntry[]) {
  const groups: Record<string, DocRegistryEntry[]> = {}
  for (const entry of registry) {
    if (!groups[entry.section]) {
      groups[entry.section] = []
    }
    groups[entry.section].push(entry)
  }
  return groups
}

// ---- Component ----

interface DocumentListProps {
  docs: GeneratedDocClient[]
  loading: boolean
  selectedDocId: string | null
  onSelectDoc: (docId: string) => void
  passProgress: Record<PassId, PassProgress>
}

export function DocumentList({
  docs,
  loading,
  selectedDocId,
  onSelectDoc,
  passProgress,
}: DocumentListProps) {
  const grouped = groupBySection(FRONTEND_DOC_REGISTRY)

  // Build a lookup map of generated docs by docId
  const generatedDocsMap = new Map(docs.map((d) => [d.docId, d]))

  if (loading) {
    return (
      <div className="w-[320px] shrink-0 bg-muted/50 border-r p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[14px] w-[200px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-[320px] shrink-0 bg-muted/50 border-r flex flex-col min-h-0">
      <ScrollArea className="flex-1">
        <div className="p-2">
          {SECTION_ORDER.map((section) => {
            const sectionDocs = grouped[section] || []
            const sectionHeader =
              es.generation.sectionHeaders[
                section as keyof typeof es.generation.sectionHeaders
              ] ?? section

            return (
              <div key={section} className="mt-6 first:mt-2">
                {/* Section header */}
                <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {sectionHeader}
                </h3>

                {/* Document items */}
                <div className="space-y-0.5">
                  {sectionDocs.map((entry) => {
                    const generatedDoc = generatedDocsMap.get(entry.docId)
                    const passDoc = passProgress[
                      entry.passId as PassId
                    ]?.docs.find((d) => d.docId === entry.docId)

                    // Determine document status from pipeline progress or generated data
                    let docStatus: 'pending' | 'generating' | 'complete' | 'error' | 'stale' = 'pending'
                    if (passDoc?.status === 'generating') {
                      docStatus = 'generating'
                    } else if (generatedDoc) {
                      docStatus = 'complete'
                    } else if (passDoc?.status === 'complete') {
                      docStatus = 'complete'
                    }

                    const docName =
                      es.generation.docNames[
                        entry.docId as keyof typeof es.generation.docNames
                      ] ?? entry.docId

                    return (
                      <DocumentListItem
                        key={entry.docId}
                        docId={entry.docId}
                        docName={docName}
                        status={docStatus}
                        isSelected={selectedDocId === entry.docId}
                        manuallyEdited={generatedDoc?.manuallyEdited ?? false}
                        onClick={() => onSelectDoc(entry.docId)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
