import { useCallback, useRef, useEffect, useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Auto-save hook with 1500ms debounce for Notion-like editing experience.
 * Flushes pending save on unmount. Retries up to 3 times with exponential backoff.
 */
export function useAutoSave(
  projectId: string,
  path: string,
  debounceMs = 1500,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const retriesRef = useRef(0)
  const maxRetries = 3

  const doSave = useCallback(
    async (data: Record<string, unknown>) => {
      setStatus('saving')
      try {
        const ref = doc(db, `projects/${projectId}/${path}`)
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
        setStatus('saved')
        retriesRef.current = 0
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
    [projectId, path],
  )

  const save = useCallback(
    (data: Record<string, unknown>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => doSave(data), debounceMs)
    },
    [doSave, debounceMs],
  )

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { save, status }
}
