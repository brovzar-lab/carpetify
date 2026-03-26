import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { ProjectRole } from '@/lib/permissions'
import { useAppStore } from '@/stores/appStore'

interface ProjectAccess {
  hasAccess: boolean
  role: ProjectRole | null
  loading: boolean
  ownerName: string | null
}

interface ProjectAccessData {
  hasAccess: boolean
  role: ProjectRole | null
  ownerName: string | null
}

/**
 * Checks whether the current user has access to the given project.
 * Returns the user's role, access status, and owner name for read-only banners.
 * Syncs the resolved role into appStore.currentProjectRole.
 *
 * staleTime: 30s to avoid excessive re-fetches during wizard navigation.
 */
export function useProjectAccess(projectId: string): ProjectAccess {
  const { user } = useAuth()

  const { data, isLoading } = useQuery<ProjectAccessData>({
    queryKey: ['project-access', projectId, user?.uid],
    queryFn: async (): Promise<ProjectAccessData> => {
      if (!user) {
        return { hasAccess: false, role: null, ownerName: null }
      }

      const snap = await getDoc(doc(db, 'projects', projectId))
      if (!snap.exists()) {
        return { hasAccess: false, role: null, ownerName: null }
      }

      const projectData = snap.data()

      // Check if user is owner (productor role)
      if (projectData.ownerId === user.uid) {
        return {
          hasAccess: true,
          role: 'productor' as ProjectRole,
          ownerName: user.displayName ?? null,
        }
      }

      // Check if user is a collaborator
      const collaborators = (projectData.collaborators ?? {}) as Record<string, string>
      if (user.uid in collaborators) {
        return {
          hasAccess: true,
          role: collaborators[user.uid] as ProjectRole,
          ownerName: null,
        }
      }

      return { hasAccess: false, role: null, ownerName: null }
    },
    enabled: !!user && !!projectId,
    staleTime: 30_000,
  })

  // Sync role to appStore so other components can read it without prop drilling
  useEffect(() => {
    const role = data?.role ?? null
    useAppStore.getState().setCurrentProjectRole(role)
    return () => {
      useAppStore.getState().setCurrentProjectRole(null)
    }
  }, [data?.role])

  return {
    hasAccess: data?.hasAccess ?? false,
    role: data?.role ?? null,
    loading: isLoading,
    ownerName: data?.ownerName ?? null,
  }
}
