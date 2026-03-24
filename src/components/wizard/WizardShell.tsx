import { useParams } from 'react-router'
import { WizardSidebar } from '@/components/wizard/WizardSidebar'
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useValidation } from '@/hooks/useValidation'
import type { TrafficLightStatus } from '@/components/common/TrafficLight'
import type { WizardScreen } from '@/stores/wizardStore'

// Screen components
import { ProjectSetup } from '@/components/wizard/ProjectSetup'
import { CreativeTeam } from '@/components/wizard/CreativeTeam'
import { ScreenplayUpload } from '@/components/wizard/ScreenplayUpload'
import { FinancialStructure } from '@/components/wizard/FinancialStructure'
import { DocumentUpload } from '@/components/wizard/DocumentUpload'
import { GenerationScreen } from '@/components/generation/GenerationScreen'
import { ValidationDashboard } from '@/components/validation/ValidationDashboard'

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

  // Validation report for sidebar traffic light (VALD-16 gap closure)
  const { report: validationReport } = useValidation(projectId)

  // Derive traffic light status from validation report
  const validacionStatus: TrafficLightStatus = !validationReport
    ? 'partial'
    : validationReport.blockers.length > 0
      ? 'error'
      : validationReport.warnings.length > 0
        ? 'partial'
        : 'complete'

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
      case 'generacion':
        return <GenerationScreen projectId={projectId} />
      case 'validacion':
        return <ValidationDashboard projectId={projectId} />
      default:
        return <ProjectSetup projectId={projectId} />
    }
  }

  // Screens that use full-width layouts (no max-width constraint)
  const isFullWidth = activeScreen === 'guion' || activeScreen === 'financiera' || activeScreen === 'generacion' || activeScreen === 'validacion'

  // Generation and validation screens manage their own layout (full-width panels)
  if (activeScreen === 'generacion' || activeScreen === 'validacion') {
    return (
      <div className="flex h-screen">
        <WizardSidebar screenStatuses={{ validacion: validacionStatus }} />
        <main className="flex-1 flex flex-col min-h-0">
          {renderScreen()}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <WizardSidebar screenStatuses={{ validacion: validacionStatus }} />
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
