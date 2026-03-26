import { useEffect, useRef, useCallback } from 'react'

/**
 * Callbacks fired by idle detection at various inactivity thresholds.
 */
export interface IdleCallbacks {
  /** Called after idleMs of no activity. Dims presence. */
  onIdle: () => void
  /** Called when activity resumes after idle state. Restores presence. */
  onActive: () => void
  /** Called after lockTimeoutMs of no activity. Releases lock. */
  onLockTimeout: () => void
}

interface IdleOptions {
  /** Milliseconds of inactivity before idle state. Default: 30,000 (30s). */
  idleMs?: number
  /** Milliseconds of inactivity before lock timeout. Default: 60,000 (60s). */
  lockTimeoutMs?: number
}

/** Default idle threshold per D-07: 30 seconds. */
const DEFAULT_IDLE_MS = 30_000
/** Default lock timeout per D-03: 60 seconds. */
const DEFAULT_LOCK_TIMEOUT_MS = 60_000

/** Events that indicate user activity. */
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove',
  'keydown',
  'mousedown',
  'touchstart',
  'scroll',
]

/**
 * useIdleDetection: Monitors user activity and fires callbacks when the user
 * goes idle (30s) or when the lock should be released due to extended
 * inactivity (60s).
 *
 * Per D-03, D-07, research Pattern 4:
 * - Activity events: mousemove, keydown, mousedown, touchstart, scroll
 * - Tab hidden: immediately starts idle timer
 * - Tab visible: resets timers (treats as activity)
 * - All event listeners are passive for performance
 */
export function useIdleDetection(
  callbacks: IdleCallbacks,
  options?: IdleOptions,
) {
  const { idleMs = DEFAULT_IDLE_MS, lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS } = options ?? {}

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isIdleRef = useRef(false)
  const callbacksRef = useRef(callbacks)

  // Keep callbacks ref current to avoid stale closures
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current !== undefined) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = undefined
    }
    if (lockTimerRef.current !== undefined) {
      clearTimeout(lockTimerRef.current)
      lockTimerRef.current = undefined
    }
  }, [])

  const startTimers = useCallback(() => {
    clearTimers()

    idleTimerRef.current = setTimeout(() => {
      if (!isIdleRef.current) {
        isIdleRef.current = true
        callbacksRef.current.onIdle()
      }
    }, idleMs)

    lockTimerRef.current = setTimeout(() => {
      callbacksRef.current.onLockTimeout()
    }, lockTimeoutMs)
  }, [idleMs, lockTimeoutMs, clearTimers])

  const handleActivity = useCallback(() => {
    if (isIdleRef.current) {
      isIdleRef.current = false
      callbacksRef.current.onActive()
    }
    startTimers()
  }, [startTimers])

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab hidden: start idle timer immediately
      clearTimers()
      idleTimerRef.current = setTimeout(() => {
        if (!isIdleRef.current) {
          isIdleRef.current = true
          callbacksRef.current.onIdle()
        }
      }, idleMs)
      lockTimerRef.current = setTimeout(() => {
        callbacksRef.current.onLockTimeout()
      }, lockTimeoutMs)
    } else {
      // Tab visible: treat as activity
      handleActivity()
    }
  }, [idleMs, lockTimeoutMs, clearTimers, handleActivity])

  useEffect(() => {
    // Start initial timers
    startTimers()

    // Register activity listeners (passive for performance)
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true })
    }

    // Register visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimers()
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startTimers, handleActivity, handleVisibilityChange, clearTimers])
}
