/**
 * React hook for pipeline invocation with real-time streaming progress.
 * Wraps the generation service with state management for the UI.
 */
import { useState, useCallback, useRef } from 'react'
import {
  runFullPipeline,
  runPass,
  PIPELINE_ORDER,
  type PassId,
  type ProgressChunk,
  type PassResult,
} from '@/services/generation'

// ---- Types ----

export interface DocProgress {
  docId: string
  status: 'pending' | 'generating' | 'complete'
}

export interface PassProgress {
  passId: PassId
  status: 'pending' | 'running' | 'complete' | 'error'
  docs: DocProgress[]
  completedCount: number
}

export type PipelineStatus =
  | 'idle'
  | 'running'
  | 'complete'
  | 'partial'
  | 'error'

// ---- Document assignments per pass (mirrors backend DOCUMENT_REGISTRY) ----

const PASS_DOCS: Record<PassId, string[]> = {
  lineProducer: ['A7', 'A8a', 'A8b', 'A9a', 'A9b'],
  financeAdvisor: ['A9d', 'E1', 'E2'],
  legal: ['B3-prod', 'B3-dir', 'C2b', 'C3a', 'C3b'],
  combined: ['A1', 'A2', 'A4', 'A6', 'A10', 'A11', 'C4', 'PITCH'],
}

function createInitialPassProgress(): Record<PassId, PassProgress> {
  const progress = {} as Record<PassId, PassProgress>
  for (const passId of PIPELINE_ORDER) {
    progress[passId] = {
      passId,
      status: 'pending',
      docs: PASS_DOCS[passId].map((docId) => ({
        docId,
        status: 'pending',
      })),
      completedCount: 0,
    }
  }
  return progress
}

// ---- Hook ----

export function useGeneration(projectId: string) {
  const [isRunning, setIsRunning] = useState(false)
  const [passProgress, setPassProgress] = useState<
    Record<PassId, PassProgress>
  >(createInitialPassProgress)
  const [pipelineStatus, setPipelineStatus] =
    useState<PipelineStatus>('idle')
  const [failedAtPass, setFailedAtPass] = useState<PassId | null>(null)
  const abortRef = useRef(false)

  const startPipeline = useCallback(
    async (startFromPass?: PassId) => {
      setIsRunning(true)
      setPipelineStatus('running')
      setFailedAtPass(null)
      abortRef.current = false

      // Reset progress for passes that will run
      setPassProgress((prev) => {
        const next = { ...prev }
        const startIndex = startFromPass
          ? PIPELINE_ORDER.indexOf(startFromPass)
          : 0
        for (let i = startIndex; i < PIPELINE_ORDER.length; i++) {
          const passId = PIPELINE_ORDER[i]
          next[passId] = {
            passId,
            status: 'pending',
            docs: PASS_DOCS[passId].map((docId) => ({
              docId,
              status: 'pending',
            })),
            completedCount: 0,
          }
        }
        return next
      })

      const handleProgress = (passId: PassId, chunk: ProgressChunk) => {
        setPassProgress((prev) => {
          const pass = { ...prev[passId] }
          pass.status = 'running'
          pass.docs = pass.docs.map((doc) =>
            doc.docId === chunk.docId
              ? { ...doc, status: chunk.status }
              : doc,
          )
          if (chunk.status === 'complete') {
            pass.completedCount = pass.docs.filter(
              (d) =>
                d.status === 'complete' ||
                (d.docId === chunk.docId && chunk.status === 'complete'),
            ).length
          }
          return { ...prev, [passId]: pass }
        })
      }

      const handlePassComplete = (passId: PassId, _result: PassResult) => {
        setPassProgress((prev) => ({
          ...prev,
          [passId]: {
            ...prev[passId],
            status: 'complete',
            completedCount: PASS_DOCS[passId].length,
            docs: prev[passId].docs.map((d) => ({
              ...d,
              status: 'complete' as const,
            })),
          },
        }))
      }

      try {
        const result = await runFullPipeline(
          projectId,
          handleProgress,
          handlePassComplete,
          startFromPass,
        )

        if (result.success) {
          setPipelineStatus('complete')
        } else {
          setPipelineStatus('partial')
          setFailedAtPass(result.failedAtPass ?? null)
          // Mark the failed pass
          if (result.failedAtPass) {
            setPassProgress((prev) => ({
              ...prev,
              [result.failedAtPass!]: {
                ...prev[result.failedAtPass!],
                status: 'error',
              },
            }))
          }
        }
      } catch {
        setPipelineStatus('error')
      } finally {
        setIsRunning(false)
      }
    },
    [projectId],
  )

  const regeneratePass = useCallback(
    async (passId: PassId) => {
      setIsRunning(true)
      setPipelineStatus('running')
      setFailedAtPass(null)

      // Reset only this pass
      setPassProgress((prev) => ({
        ...prev,
        [passId]: {
          passId,
          status: 'pending',
          docs: PASS_DOCS[passId].map((docId) => ({
            docId,
            status: 'pending',
          })),
          completedCount: 0,
        },
      }))

      try {
        // Run only the single pass (not the full pipeline)
        const result = await runPass(passId, projectId, (chunk) => {
          setPassProgress((prev) => {
            const pass = { ...prev[passId] }
            pass.status = 'running'
            pass.docs = pass.docs.map((doc) =>
              doc.docId === chunk.docId
                ? { ...doc, status: chunk.status }
                : doc,
            )
            if (chunk.status === 'complete') {
              pass.completedCount = pass.docs.filter(
                (d) => d.status === 'complete' || d.docId === chunk.docId,
              ).length
            }
            return { ...prev, [passId]: pass }
          })
        })

        setPassProgress((prev) => ({
          ...prev,
          [passId]: {
            ...prev[passId],
            status: result.success ? 'complete' : 'error',
            completedCount: result.success
              ? PASS_DOCS[passId].length
              : prev[passId].completedCount,
            docs: result.success
              ? prev[passId].docs.map((d) => ({
                  ...d,
                  status: 'complete' as const,
                }))
              : prev[passId].docs,
          },
        }))

        setPipelineStatus(result.success ? 'complete' : 'error')
      } catch {
        setPipelineStatus('error')
        setPassProgress((prev) => ({
          ...prev,
          [passId]: { ...prev[passId], status: 'error' },
        }))
      } finally {
        setIsRunning(false)
      }
    },
    [projectId],
  )

  return {
    isRunning,
    passProgress,
    pipelineStatus,
    failedAtPass,
    startPipeline,
    regeneratePass,
  }
}
