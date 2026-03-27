/**
 * Hook combining streaming review execution, Firestore real-time cache listener,
 * staleness detection, and activity log writes for the pre-submission review.
 *
 * Listens to projects/{projectId}/meta/pre_submission_review for cached results.
 * Compares review generatedDocsTimestamp against generation_state pass timestamps
 * to detect staleness.
 */
import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  runPreSubmissionReview as runReviewService,
  type ReviewResult,
  type ReviewProgressChunk,
  type ReviewFinding,
} from '@/services/review'
import { writeActivityEntry } from '@/services/activityLog'

interface UsePreSubmissionReviewReturn {
  /** Cached review result from Firestore (null if no review yet) */
  review: ReviewResult | null
  /** Flat list of all findings with resolved state from Firestore checklist */
  checklist: ReviewFinding[]
  /** Whether review is currently running */
  running: boolean
  /** Current progress chunk during execution */
  progress: ReviewProgressChunk | null
  /** Error message if review failed */
  error: string | null
  /** Whether cached review is stale (docs regenerated after review) */
  isStale: boolean
  /** Loading state for initial Firestore fetch */
  loading: boolean
  /** Trigger a new review */
  triggerReview: () => Promise<void>
  /** Toggle a finding's resolved state */
  toggleFinding: (findingIndex: number) => Promise<void>
}

export function usePreSubmissionReview(projectId: string): UsePreSubmissionReviewReturn {
  const { user } = useAuth()
  const [review, setReview] = useState<ReviewResult | null>(null)
  const [checklist, setChecklist] = useState<ReviewFinding[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<ReviewProgressChunk | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [loading, setLoading] = useState(true)

  // Track the review's generatedDocsTimestamp for staleness comparison
  const [reviewGenTimestamp, setReviewGenTimestamp] = useState<string | null>(null)

  // ---- Firestore listener for cached review result ----
  useEffect(() => {
    if (!projectId) {
      setReview(null)
      setChecklist([])
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      doc(db, `projects/${projectId}/meta/pre_submission_review`),
      (snap) => {
        if (!snap.exists()) {
          setReview(null)
          setChecklist([])
          setReviewGenTimestamp(null)
          setLoading(false)
          return
        }

        const data = snap.data()
        const result: ReviewResult = {
          success: data.success ?? false,
          personaResults: data.personaResults ?? [],
          coherenceContradictions: data.coherenceContradictions ?? [],
          readiness: data.readiness ?? 'no_lista',
          estimatedScore: data.estimatedScore ?? 0,
          reviewedAt: data.reviewedAt ?? '',
          generatedDocsTimestamp: data.generatedDocsTimestamp ?? '',
          errors: data.errors,
        }

        setReview(result)
        setChecklist(data.checklist ?? [])
        setReviewGenTimestamp(data.generatedDocsTimestamp ?? null)
        setLoading(false)
      },
      () => {
        setReview(null)
        setChecklist([])
        setLoading(false)
      },
    )

    return unsub
  }, [projectId])

  // ---- Staleness detection: compare review timestamp against generation_state ----
  useEffect(() => {
    if (!projectId || !reviewGenTimestamp) {
      setIsStale(false)
      return
    }

    const unsub = onSnapshot(
      doc(db, `projects/${projectId}/meta/generation_state`),
      (snap) => {
        if (!snap.exists()) {
          setIsStale(false)
          return
        }

        const data = snap.data()
        const passes = data?.passGeneratedAt ?? {}
        const reviewTs = new Date(reviewGenTimestamp).getTime()

        // If any pass was generated AFTER the review's generatedDocsTimestamp, it is stale
        const anyNewer = Object.values(passes).some((val) => {
          if (!val) return false
          const passDate = typeof (val as { toDate?: () => Date }).toDate === 'function'
            ? (val as { toDate: () => Date }).toDate()
            : new Date(val as string)
          return passDate.getTime() > reviewTs
        })

        setIsStale(anyNewer)
      },
      () => setIsStale(false),
    )

    return unsub
  }, [projectId, reviewGenTimestamp])

  // ---- Trigger a new review ----
  const triggerReview = useCallback(async () => {
    if (running || !user) return

    setRunning(true)
    setError(null)
    setProgress(null)

    // Log review START (fire-and-forget)
    try {
      await writeActivityEntry(projectId, {
        userId: user.uid,
        displayName: user.displayName ?? 'Usuario',
        photoURL: user.photoURL,
        userRole: 'productor',
        screen: 'validacion',
        action: 'review',
        changedFields: [],
        summary: 'Inicio revision pre-envio',
      })
    } catch {
      // Activity log failure must not block the review
    }

    try {
      const result = await runReviewService(projectId, (chunk) => {
        setProgress(chunk)
      })

      // Log review COMPLETION (fire-and-forget)
      try {
        await writeActivityEntry(projectId, {
          userId: user.uid,
          displayName: user.displayName ?? 'Usuario',
          photoURL: user.photoURL,
          userRole: 'productor',
          screen: 'validacion',
          action: 'review',
          changedFields: [],
          summary: 'Revision pre-envio completada',
          metadata: { readiness: result.readiness },
        })
      } catch {
        // Activity log failure must not block the review
      }
    } catch (err) {
      console.error('Pre-submission review failed:', err)
      setError(
        err instanceof Error ? err.message : 'Error desconocido',
      )
    } finally {
      setRunning(false)
      setProgress(null)
    }
  }, [projectId, running, user])

  // ---- Toggle a finding's resolved state ----
  const toggleFinding = useCallback(
    async (findingIndex: number) => {
      if (!checklist[findingIndex]) return

      const newChecklist = [...checklist]
      newChecklist[findingIndex] = {
        ...newChecklist[findingIndex],
        resolved: !newChecklist[findingIndex].resolved,
      }

      // Optimistic update
      setChecklist(newChecklist)

      const reviewRef = doc(db, `projects/${projectId}/meta/pre_submission_review`)
      await updateDoc(reviewRef, { checklist: newChecklist })
    },
    [projectId, checklist],
  )

  return {
    review,
    checklist,
    running,
    progress,
    error,
    isStale,
    loading,
    triggerReview,
    toggleFinding,
  }
}
