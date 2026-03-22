import { create } from 'zustand'

interface AppState {
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
}))
