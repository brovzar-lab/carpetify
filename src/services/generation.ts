/**
 * Client-side wrappers for the 4 generation Cloud Functions with streaming support.
 * Each pass is invoked via Firebase httpsCallable().stream() for real-time progress.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// ---- Types ----

export interface ProgressChunk {
  type: 'progress'
  docId: string
  status: 'generating' | 'complete'
  message?: string
}

export interface PassResult {
  success: boolean
  completedDocs: string[]
}

export type PassId = 'lineProducer' | 'financeAdvisor' | 'legal' | 'combined'

// ---- Cloud Function name mapping ----

const PASS_FUNCTION_NAMES: Record<PassId, string> = {
  lineProducer: 'runLineProducerPass',
  financeAdvisor: 'runFinanceAdvisorPass',
  legal: 'runLegalPass',
  combined: 'runCombinedPass',
} as const

// ---- Pipeline execution order ----

/** Sequential pass order: Line Producer -> Finance Advisor -> Legal -> Combined */
export const PIPELINE_ORDER: PassId[] = [
  'lineProducer',
  'financeAdvisor',
  'legal',
  'combined',
]

// ---- Pass-level number mapping (for UI display) ----

export const PASS_NUMBERS: Record<PassId, number> = {
  lineProducer: 2,
  financeAdvisor: 3,
  legal: 4,
  combined: 5,
}

// ---- Single pass execution ----

/**
 * Run a single generation pass with streaming progress.
 * Calls the corresponding Cloud Function and streams progress chunks.
 */
export async function runPass(
  passId: PassId,
  projectId: string,
  onProgress: (chunk: ProgressChunk) => void,
): Promise<PassResult> {
  const fn = httpsCallable<
    { projectId: string },
    PassResult,
    ProgressChunk
  >(functions, PASS_FUNCTION_NAMES[passId])

  const { stream, data } = await fn.stream({ projectId })

  for await (const chunk of stream) {
    onProgress(chunk)
  }

  return await data
}

// ---- Full pipeline execution ----

/**
 * Run the full 4-pass pipeline sequentially with streaming progress.
 * Optionally start from a specific pass (for resume after partial failure).
 */
export async function runFullPipeline(
  projectId: string,
  onProgress: (passId: PassId, chunk: ProgressChunk) => void,
  onPassComplete: (passId: PassId, result: PassResult) => void,
  startFromPass?: PassId,
): Promise<{
  success: boolean
  completedPasses: PassId[]
  failedAtPass?: PassId
}> {
  const startIndex = startFromPass
    ? PIPELINE_ORDER.indexOf(startFromPass)
    : 0
  const passesToRun = PIPELINE_ORDER.slice(startIndex)
  const completedPasses: PassId[] = []

  for (const passId of passesToRun) {
    try {
      const result = await runPass(passId, projectId, (chunk) =>
        onProgress(passId, chunk),
      )
      onPassComplete(passId, result)
      completedPasses.push(passId)
    } catch (error) {
      console.error(`Pipeline failed at pass ${passId}:`, error)
      return { success: false, completedPasses, failedAtPass: passId }
    }
  }

  return { success: true, completedPasses }
}
