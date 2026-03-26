import { create } from 'zustand'

export type WizardScreen =
  | 'datos'
  | 'guion'
  | 'equipo'
  | 'financiera'
  | 'documentos'
  | 'generacion'
  | 'validacion'
  | 'exportar'
  | 'actividad'

interface WizardState {
  activeScreen: WizardScreen
  setActiveScreen: (screen: WizardScreen) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useWizardStore = create<WizardState>((set) => ({
  activeScreen: 'datos',
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
