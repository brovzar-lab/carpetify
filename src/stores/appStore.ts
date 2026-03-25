import { create } from 'zustand'

interface AppState {
  activeProjectId: string | null
  currentUserId: string | null
  setActiveProject: (id: string | null) => void
  setCurrentUserId: (id: string | null) => void
  resetStore: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectId: null,
  currentUserId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  setCurrentUserId: (id) => set({ currentUserId: id }),
  resetStore: () => set({ activeProjectId: null, currentUserId: null }),
}))
