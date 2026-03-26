import { useEffect, useState, useCallback, useRef } from 'react'
import { ref, onValue, runTransaction, update, remove, get, onDisconnect, type DatabaseReference } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/stores/appStore'
import { lockPath } from '@/lib/rtdb'

/** Data shape stored in RTDB for a lock holder. */
export interface LockHolder {
  userId: string
  displayName: string
  role: string
  acquiredAt: number
  expiresAt: number
}

/** Current state of a section lock. */
export interface LockState {
  isLocked: boolean
  isMyLock: boolean
  holder: LockHolder | null
}

/** Lock duration in milliseconds (2 minutes). */
const LOCK_DURATION_MS = 120_000

/**
 * Get an estimate of server time using .info/serverTimeOffset.
 * This accounts for clock skew between client and Firebase (Pitfall 4).
 */
async function getServerNow(): Promise<number> {
  try {
    const offsetRef = ref(rtdb, '.info/serverTimeOffset')
    const snapshot = await get(offsetRef)
    const offset = (snapshot.val() as number) ?? 0
    return Date.now() + offset
  } catch {
    return Date.now()
  }
}

/**
 * useSectionLock: Provides atomic lock acquire, release, and renew
 * for a wizard screen section within a project. Uses RTDB transactions
 * for compare-and-set semantics to prevent race conditions.
 *
 * Per D-01, D-02, D-03, D-15:
 * - Lock stored at locks/{projectId}/{screenId}
 * - Expires after 2 minutes (expiresAt field)
 * - onDisconnect removes lock if browser closes
 * - renewLock extends expiry (called every 30s while active)
 *
 * Per research Pattern 3: runTransaction for atomic lock acquisition.
 */
export function useSectionLock(projectId: string, screenId: string) {
  const { user } = useAuth()
  const currentProjectRole = useAppStore((s) => s.currentProjectRole)
  const [lockState, setLockState] = useState<LockState>({
    isLocked: false,
    isMyLock: false,
    holder: null,
  })
  const disconnectRef = useRef<ReturnType<typeof onDisconnect> | null>(null)
  const lockRefCurrent = useRef<DatabaseReference | null>(null)

  // Subscribe to lock status
  useEffect(() => {
    if (!projectId || !screenId) return

    const lockRef = ref(rtdb, lockPath(projectId, screenId))
    lockRefCurrent.current = lockRef

    const unsubscribe = onValue(lockRef, (snapshot) => {
      const data = snapshot.val() as LockHolder | null

      if (!data) {
        setLockState({ isLocked: false, isMyLock: false, holder: null })
        return
      }

      // Check if lock is expired
      if (data.expiresAt < Date.now()) {
        // Expired lock — clean it up and treat as unlocked
        remove(lockRef)
        setLockState({ isLocked: false, isMyLock: false, holder: null })
        return
      }

      setLockState({
        isLocked: true,
        isMyLock: data.userId === user?.uid,
        holder: data,
      })
    })

    return () => {
      unsubscribe()
      lockRefCurrent.current = null
    }
  }, [projectId, screenId, user?.uid])

  /**
   * Attempt to acquire the lock. Returns true if successful.
   * Uses runTransaction for atomic compare-and-set.
   */
  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!user || !projectId || !screenId) return false

    const lockRef = ref(rtdb, lockPath(projectId, screenId))
    const serverNow = await getServerNow()

    const result = await runTransaction(lockRef, (currentData: LockHolder | null) => {
      // Lock is free — take it
      if (currentData === null) {
        return {
          userId: user.uid,
          displayName: user.displayName ?? user.email ?? 'Usuario',
          role: currentProjectRole ?? 'productor',
          acquiredAt: serverNow,
          expiresAt: serverNow + LOCK_DURATION_MS,
        }
      }

      // Lock expired — take over
      if (currentData.expiresAt < serverNow) {
        return {
          userId: user.uid,
          displayName: user.displayName ?? user.email ?? 'Usuario',
          role: currentProjectRole ?? 'productor',
          acquiredAt: serverNow,
          expiresAt: serverNow + LOCK_DURATION_MS,
        }
      }

      // Lock held by someone else — abort
      return undefined
    })

    if (result.committed && result.snapshot.val()?.userId === user.uid) {
      // Set up onDisconnect to remove lock if browser closes
      const disconnectHandler = onDisconnect(lockRef)
      disconnectRef.current = disconnectHandler
      await disconnectHandler.remove()
      return true
    }

    return false
  }, [user, projectId, screenId, currentProjectRole])

  /**
   * Release the lock. Cancels onDisconnect and removes the lock node.
   */
  const releaseLock = useCallback(async (): Promise<void> => {
    if (!projectId || !screenId) return

    const lockRef = ref(rtdb, lockPath(projectId, screenId))

    // Cancel onDisconnect handler
    if (disconnectRef.current) {
      await disconnectRef.current.cancel()
      disconnectRef.current = null
    }

    await remove(lockRef)
  }, [projectId, screenId])

  /**
   * Renew the lock by extending expiresAt. Called by idle detection
   * heartbeat every 30s while user is active.
   */
  const renewLock = useCallback(async (): Promise<void> => {
    if (!projectId || !screenId) return

    const lockRef = ref(rtdb, lockPath(projectId, screenId))
    const serverNow = await getServerNow()

    await update(lockRef, { expiresAt: serverNow + LOCK_DURATION_MS })
  }, [projectId, screenId])

  // Cleanup on unmount — cancel disconnect handler
  useEffect(() => {
    return () => {
      if (disconnectRef.current) {
        disconnectRef.current.cancel()
        disconnectRef.current = null
      }
    }
  }, [])

  return { lockState, acquireLock, releaseLock, renewLock }
}
