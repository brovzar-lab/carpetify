import { useEffect, useRef, useCallback } from 'react'
import { ref, set, update, remove, onValue, onDisconnect, serverTimestamp, type Unsubscribe } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/stores/appStore'
import { presencePath } from '@/lib/rtdb'

/**
 * usePresence: Writes and maintains the current user's presence in RTDB
 * at presence/{projectId}/{userId}. Sets up onDisconnect cleanup so
 * presence is automatically removed if the browser tab closes or loses
 * connection.
 *
 * Per D-05, D-07, D-08: presence data includes displayName, role, screen,
 * status, and lastActive timestamp.
 *
 * Per Pitfall 1: onDisconnect is queued BEFORE set() to prevent orphaned
 * presence entries on race conditions.
 */
export function usePresence(projectId: string, screen: string) {
  const { user } = useAuth()
  const currentProjectRole = useAppStore((s) => s.currentProjectRole)
  const presenceRefCurrent = useRef<ReturnType<typeof ref> | null>(null)
  const disconnectRefCurrent = useRef<ReturnType<typeof onDisconnect> | null>(null)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  // Write presence when connected
  useEffect(() => {
    if (!user || !projectId) return

    const myPresenceRef = ref(rtdb, presencePath(projectId, user.uid))
    presenceRefCurrent.current = myPresenceRef

    const connectedRef = ref(rtdb, '.info/connected')

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return

      // Pitfall 1: Queue onDisconnect BEFORE set
      const disconnectHandler = onDisconnect(myPresenceRef)
      disconnectRefCurrent.current = disconnectHandler

      disconnectHandler.remove().then(() => {
        set(myPresenceRef, {
          displayName: user.displayName ?? user.email ?? 'Usuario',
          photoURL: user.photoURL ?? null,
          role: currentProjectRole ?? 'productor',
          screen,
          status: 'active',
          lastActive: serverTimestamp(),
        })
      })
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      // Cancel onDisconnect handler to prevent stale cleanup
      if (disconnectRefCurrent.current) {
        disconnectRefCurrent.current.cancel()
        disconnectRefCurrent.current = null
      }
      // Remove presence on unmount
      remove(myPresenceRef)
      // Unsubscribe from .info/connected
      unsubscribe()
      unsubscribeRef.current = null
      presenceRefCurrent.current = null
    }
    // Intentionally exclude `screen` from deps — screen changes handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId, currentProjectRole])

  // Update screen in presence when screen prop changes
  useEffect(() => {
    if (!presenceRefCurrent.current || !user || !projectId) return
    update(presenceRefCurrent.current, {
      screen,
      lastActive: serverTimestamp(),
    })
  }, [screen, user, projectId])

  /** Dim presence status to idle (called by idle detection). */
  const setPresenceIdle = useCallback(() => {
    if (presenceRefCurrent.current) {
      update(presenceRefCurrent.current, { status: 'idle' })
    }
  }, [])

  /** Restore presence status to active (called by idle detection on activity). */
  const setPresenceActive = useCallback(() => {
    if (presenceRefCurrent.current) {
      update(presenceRefCurrent.current, {
        status: 'active',
        lastActive: serverTimestamp(),
      })
    }
  }, [])

  /** Explicitly remove presence (e.g., on sign-out). */
  const cleanupPresence = useCallback(() => {
    if (disconnectRefCurrent.current) {
      disconnectRefCurrent.current.cancel()
      disconnectRefCurrent.current = null
    }
    if (presenceRefCurrent.current) {
      remove(presenceRefCurrent.current)
      presenceRefCurrent.current = null
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
  }, [])

  return { setPresenceIdle, setPresenceActive, cleanupPresence }
}
