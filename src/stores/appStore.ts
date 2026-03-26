import { create } from 'zustand'
import type { ProjectRole } from '@/lib/permissions'

interface AppState {
  activeProjectId: string | null
  currentUserId: string | null
  currentProjectRole: ProjectRole | null
  setActiveProject: (id: string | null) => void
  setCurrentUserId: (id: string | null) => void
  setCurrentProjectRole: (role: ProjectRole | null) => void
  resetStore: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectId: null,
  currentUserId: null,
  currentProjectRole: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  setCurrentUserId: (id) => set({ currentUserId: id }),
  setCurrentProjectRole: (role) => set({ currentProjectRole: role }),
  resetStore: () => set({ activeProjectId: null, currentUserId: null, currentProjectRole: null }),
}))
