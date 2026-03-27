/**
 * Client-side streaming callable wrapper for the pre-submission review Cloud Function.
 * Mirrors the pattern from src/services/generation.ts.
 *
 * Types are re-declared here because frontend cannot import from functions/src/.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// ---- Types (mirrored from functions/src/review/reviewTypes.ts) ----

export interface ReviewFinding {
  personaId: string
  personaName: string
  documentId: string
  documentName: string
  role: string
  criterion: string
  weakness: string
  suggestion: string
  resolved: boolean
}

export interface CoherenceContradiction {
  personaId: string
  personaName: string
  description: string
  documentIds: string[]
}

export interface ReviewResult {
  success: boolean
  personaResults: Array<{
    personaId: string
    personaName: string
    findings: ReviewFinding[]
  } | null>
  coherenceContradictions: CoherenceContradiction[]
  readiness: 'lista' | 'casi_lista' | 'necesita_trabajo' | 'no_lista'
  estimatedScore: number
  reviewedAt: string
  generatedDocsTimestamp: string
  errors?: string[]
}

export interface ReviewProgressChunk {
  type: 'progress'
  step: 'loading_data' | 'evaluating' | 'persona_complete' | 'coherence' | 'saving'
  personaId?: string
  personaName?: string
  completedCount?: number
  totalCount?: number
  message: string
}

// ---- Service function ----

/**
 * Run pre-submission review with streaming progress.
 * Calls the runPreSubmissionReview Cloud Function and streams progress chunks.
 */
export async function runPreSubmissionReview(
  projectId: string,
  onProgress: (chunk: ReviewProgressChunk) => void,
): Promise<ReviewResult> {
  const fn = httpsCallable<
    { projectId: string },
    ReviewResult,
    ReviewProgressChunk
  >(functions, 'runPreSubmissionReview')

  const { stream, data } = await fn.stream({ projectId })

  for await (const chunk of stream) {
    onProgress(chunk)
  }

  return await data
}
