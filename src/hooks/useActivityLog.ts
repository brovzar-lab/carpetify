import { useEffect, useState, useCallback, useRef } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  startAfter,
  getDocs,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ActivityLogEntry } from '@/services/activityLog'

/**
 * Real-time activity log subscription with cursor-based pagination.
 *
 * - Subscribes to the latest `pageSize` entries via onSnapshot (real-time updates)
 * - loadMore() fetches the next page using startAfter cursor
 * - Returns { entries, loading, hasMore, loadMore, loadingMore }
 */
export function useActivityLog(projectId: string, pageSize = 50) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)

  // Real-time subscription to the latest entries
  useEffect(() => {
    if (!projectId) return

    const q = query(
      collection(db, `projects/${projectId}/activity_log`),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId,
          displayName: data.displayName,
          photoURL: data.photoURL ?? null,
          userRole: data.userRole ?? '',
          screen: data.screen,
          action: data.action,
          changedFields: data.changedFields ?? [],
          summary: data.summary ?? '',
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          metadata: data.metadata,
        } as ActivityLogEntry
      })
      setEntries(items)
      setLoading(false)
      setHasMore(snap.docs.length >= pageSize)
      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1]
      }
    })

    return unsubscribe
  }, [projectId, pageSize])

  // Load more (pagination via startAfter cursor)
  const loadMore = useCallback(async () => {
    if (!lastDocRef.current || !projectId || loadingMore) return

    setLoadingMore(true)
    const q = query(
      collection(db, `projects/${projectId}/activity_log`),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocRef.current),
      limit(pageSize),
    )

    const snap = await getDocs(q)
    const moreItems = snap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data.userId,
        displayName: data.displayName,
        photoURL: data.photoURL ?? null,
        userRole: data.userRole ?? '',
        screen: data.screen,
        action: data.action,
        changedFields: data.changedFields ?? [],
        summary: data.summary ?? '',
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        metadata: data.metadata,
      } as ActivityLogEntry
    })

    setEntries((prev) => [...prev, ...moreItems])
    setHasMore(snap.docs.length >= pageSize)
    if (snap.docs.length > 0) {
      lastDocRef.current = snap.docs[snap.docs.length - 1]
    }
    setLoadingMore(false)
  }, [projectId, pageSize, loadingMore])

  return { entries, loading, hasMore, loadMore, loadingMore }
}
