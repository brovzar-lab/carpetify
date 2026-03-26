import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { projectPresencePath } from '@/lib/rtdb'
import type { ProjectRole } from '@/lib/permissions'

/**
 * Shape of a single user's presence entry as read from RTDB.
 */
export interface PresenceEntry {
  userId: string
  displayName: string
  photoURL: string | null
  role: ProjectRole | string
  screen: string
  status: 'active' | 'idle'
  lastActive: number
}

/**
 * useProjectPresence: Subscribes to all presence entries for a project
 * in real-time. Returns an array of PresenceEntry objects for all users
 * currently online in the project, excluding the current user.
 *
 * Per D-05, D-06: provides real-time awareness of who is online and
 * which screen they are viewing.
 */
export function useProjectPresence(projectId: string): PresenceEntry[] {
  const { user } = useAuth()
  const [entries, setEntries] = useState<PresenceEntry[]>([])

  useEffect(() => {
    if (!projectId) {
      setEntries([])
      return
    }

    const presenceRef = ref(rtdb, projectPresencePath(projectId))

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const val = snapshot.val()
      if (!val || typeof val !== 'object') {
        setEntries([])
        return
      }

      const parsed: PresenceEntry[] = Object.entries(val as Record<string, Record<string, unknown>>)
        .filter(([userId]) => userId !== user?.uid)
        .map(([userId, data]) => ({
          userId,
          displayName: (data.displayName as string) ?? 'Usuario',
          photoURL: (data.photoURL as string | null) ?? null,
          role: (data.role as string) ?? 'productor',
          screen: (data.screen as string) ?? '',
          status: (data.status as 'active' | 'idle') ?? 'active',
          lastActive: (data.lastActive as number) ?? 0,
        }))

      setEntries(parsed)
    })

    return () => unsubscribe()
  }, [projectId, user?.uid])

  return entries
}
