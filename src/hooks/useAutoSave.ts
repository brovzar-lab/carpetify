import { useCallback, useRef, useEffect, useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { coalesceOrCreate } from '@/services/activityLog'
import { useAppStore } from '@/stores/appStore'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Auto-save hook with 1500ms debounce for Notion-like editing experience.
 * Flushes pending save on unmount. Retries up to 3 times with exponential backoff.
 *
 * Lock coordination (optional, for section locking per D-12):
 * - lockOwned: when provided as false, doSave skips the save entirely
 * - onSaveComplete: callback after successful save (resets idle lock timer)
 * - flushAndWait: immediately executes pending save (used before lock release per Pitfall 5)
 *
 * Activity logging (Phase 13):
 * - After successful save, computes field diff and writes activity entry via coalesceOrCreate
 * - Activity write is fire-and-forget (errors are swallowed, never block the save)
 * - Rapid edits within 30s coalesce into a single activity entry
 */
export function useAutoSave(
  projectId: string,
  path: string,
  debounceMs = 1500,
  lockOwned?: boolean,
  onSaveComplete?: () => void,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const retriesRef = useRef(0)
  const pendingDataRef = useRef<Record<string, unknown> | null>(null)
  const maxRetries = 3

  // Activity logging: track previous state for diffing
  const lastSavedRef = useRef<Record<string, unknown>>({})

  // Auth context for activity attribution
  const { user } = useAuth()
  const currentProjectRole = useAppStore((s) => s.currentProjectRole)

  // Keep onSaveComplete in a ref to avoid stale closures
  const onSaveCompleteRef = useRef(onSaveComplete)
  useEffect(() => {
    onSaveCompleteRef.current = onSaveComplete
  }, [onSaveComplete])

  // Keep user and role in refs to avoid stale closures in doSave
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])
  const roleRef = useRef(currentProjectRole)
  useEffect(() => {
    roleRef.current = currentProjectRole
  }, [currentProjectRole])

  const doSave = useCallback(
    async (data: Record<string, unknown>) => {
      // Per D-12: skip save if lock is not held
      if (lockOwned === false) return

      setStatus('saving')
      try {
        const ref = doc(db, `projects/${projectId}/${path}/data`)
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
        setStatus('saved')
        retriesRef.current = 0
        pendingDataRef.current = null
        // Call onSaveComplete after successful save
        onSaveCompleteRef.current?.()

        // Activity logging: compute changed fields by comparing against last-saved snapshot
        const changedFields = Object.keys(data).filter(
          (key) =>
            key !== 'updatedAt' &&
            JSON.stringify(data[key]) !== JSON.stringify(lastSavedRef.current[key]),
        )

        if (changedFields.length > 0 && userRef.current) {
          // Fire-and-forget activity log write (per D-01: per-save, not per-field)
          coalesceOrCreate(
            projectId,
            {
              userId: userRef.current.uid,
              displayName:
                userRef.current.displayName ?? userRef.current.email ?? 'Usuario',
              photoURL: userRef.current.photoURL ?? null,
              userRole: roleRef.current ?? 'productor',
              screen: path,
              action: 'update',
              changedFields,
            },
            userRef.current,
          ).catch((err: unknown) =>
            console.warn('Activity log write failed:', err),
          )
        }

        lastSavedRef.current = { ...data }

        // Reset to idle after 3 seconds
        setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 3000)
      } catch {
        retriesRef.current += 1
        if (retriesRef.current < maxRetries) {
          setStatus('error')
          const backoff = Math.pow(2, retriesRef.current) * 1000
          setTimeout(() => doSave(data), backoff)
        } else {
          setStatus('error')
        }
      }
    },
    [projectId, path, lockOwned],
  )

  const save = useCallback(
    (data: Record<string, unknown>) => {
      pendingDataRef.current = data
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => doSave(data), debounceMs)
    },
    [doSave, debounceMs],
  )

  /**
   * Immediately execute any pending debounced save and wait for completion.
   * Used before lock release per Pitfall 5: flush pending auto-save before releasing lock.
   */
  const flushAndWait = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (pendingDataRef.current) {
      const data = pendingDataRef.current
      await doSave(data)
    }
  }, [doSave])

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { save, status, flushAndWait }
}
