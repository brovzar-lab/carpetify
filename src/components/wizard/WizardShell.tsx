import { useParams } from 'react-router'
import { WizardSidebar } from '@/components/wizard/WizardSidebar'
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { WizardScreen } from '@/stores/wizardStore'

// Lazy-loaded screen components (Screen 1 and 3 are real, rest are placeholders)
import { ProjectSetup } from '@/components/wizard/ProjectSetup'
import { CreativeTeam } from '@/components/wizard/CreativeTeam'

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">Pantalla en desarrollo.</p>
    </div>
  )
}

/**
 * Wizard layout: 240px sidebar + content area.
 * Reads projectId and screen from URL params.
 * Renders the active screen component with auto-save indicator.
 */
export function WizardShell() {
  const { projectId = '', screen } = useParams<{
    projectId: string
    screen: string
  }>()
  const activeScreen = (screen || 'datos') as WizardScreen

  // Auto-save hook for the current screen's metadata
  const { status: saveStatus } = useAutoSave(projectId, 'metadata')

  function renderScreen() {
    switch (activeScreen) {
      case 'datos':
        return <ProjectSetup projectId={projectId} />
      case 'guion':
        return <PlaceholderScreen title="Guion" />
      case 'equipo':
        return <CreativeTeam projectId={projectId} />
      case 'financiera':
        return <PlaceholderScreen title="Estructura Financiera" />
      case 'documentos':
        return <PlaceholderScreen title="Documentos" />
      default:
        return <ProjectSetup projectId={projectId} />
    }
  }

  return (
    <div className="flex h-screen">
      <WizardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="relative mx-auto max-w-[800px] p-8">
          {/* Auto-save indicator top-right */}
          <div className="absolute right-8 top-8">
            <AutoSaveIndicator status={saveStatus} />
          </div>
          {renderScreen()}
        </div>
      </main>
    </div>
  )
}
