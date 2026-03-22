import { useParams } from 'react-router'
import { WizardSidebar } from '@/components/wizard/WizardSidebar'
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { WizardScreen } from '@/stores/wizardStore'

// Screen components
import { ProjectSetup } from '@/components/wizard/ProjectSetup'
import { CreativeTeam } from '@/components/wizard/CreativeTeam'
import { ScreenplayUpload } from '@/components/wizard/ScreenplayUpload'
import { FinancialStructure } from '@/components/wizard/FinancialStructure'
import { DocumentUpload } from '@/components/wizard/DocumentUpload'

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
        return <ScreenplayUpload projectId={projectId} />
      case 'equipo':
        return <CreativeTeam projectId={projectId} />
      case 'financiera':
        return <FinancialStructure projectId={projectId} />
      case 'documentos':
        return <DocumentUpload projectId={projectId} />
      default:
        return <ProjectSetup projectId={projectId} />
    }
  }

  // Screen 2 (guion) and Screen 4 (financiera) use full-width layouts
  const isFullWidth = activeScreen === 'guion' || activeScreen === 'financiera'

  return (
    <div className="flex h-screen">
      <WizardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div
          className={`relative p-8 ${isFullWidth ? '' : 'mx-auto max-w-[800px]'}`}
        >
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
