import { useParams } from 'react-router'
import { Loader2 } from 'lucide-react'
import { WizardSidebar } from '@/components/wizard/WizardSidebar'
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator'
import { ReadOnlyBanner } from '@/components/common/ReadOnlyBanner'
import { AccessDenied } from '@/components/auth/AccessDenied'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useValidation } from '@/hooks/useValidation'
import { useProjectAccess } from '@/hooks/useProjectAccess'
import { canEditScreen } from '@/lib/permissions'
import { es } from '@/locales/es'
import type { WizardScreen } from '@/stores/wizardStore'

// Screen components
import { ProjectSetup } from '@/components/wizard/ProjectSetup'
import { CreativeTeam } from '@/components/wizard/CreativeTeam'
import { ScreenplayUpload } from '@/components/wizard/ScreenplayUpload'
import { FinancialStructure } from '@/components/wizard/FinancialStructure'
import { DocumentUpload } from '@/components/wizard/DocumentUpload'
import { GenerationScreen } from '@/components/generation/GenerationScreen'
import { ValidationDashboard } from '@/components/validation/ValidationDashboard'
import { ExportScreen } from '@/components/export/ExportScreen'
import { TeamMembers } from '@/components/project/TeamMembers'

/**
 * Wizard layout: 240px sidebar + content area.
 * Reads projectId and screen from URL params.
 * Renders the active screen component with auto-save indicator.
 *
 * RBAC gate: checks project membership via useProjectAccess.
 * Non-members see AccessDenied page. Non-editable screens show ReadOnlyBanner.
 */
export function WizardShell() {
  const { projectId = '', screen } = useParams<{
    projectId: string
    screen: string
  }>()
  const activeScreen = (screen || 'datos') as WizardScreen

  // RBAC: check project access
  const { hasAccess, role, loading: accessLoading, ownerName, collaborators, ownerId } = useProjectAccess(projectId)

  // Auto-save hook for the current screen's metadata
  const { status: saveStatus } = useAutoSave(projectId, 'metadata')

  // Per-screen validation statuses for sidebar traffic lights (VALD-16)
  const { screenStatuses } = useValidation(projectId)

  // Access loading state
  if (accessLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{es.rbac.loadingAccess}</span>
        </div>
      </div>
    )
  }

  // Access denied gate
  if (!hasAccess) {
    return <AccessDenied />
  }

  // Determine if current screen is read-only for this role
  const isReadOnly = role !== null && !canEditScreen(role, activeScreen)

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
      case 'exportar':
        return <ExportScreen projectId={projectId} />
      default:
        return <ProjectSetup projectId={projectId} />
    }
  }

  // Screens that use full-width layouts (no max-width constraint)
  const isFullWidth = activeScreen === 'guion' || activeScreen === 'financiera' || activeScreen === 'generacion' || activeScreen === 'validacion' || activeScreen === 'exportar'

  // Generation and validation screens manage their own layout (full-width panels)
  if (activeScreen === 'generacion' || activeScreen === 'validacion' || activeScreen === 'exportar') {
    return (
      <div className="flex h-screen">
        <WizardSidebar screenStatuses={screenStatuses} />
        <main className="flex-1 flex flex-col min-h-0">
          {isReadOnly && (
            <div className="px-6 pt-4">
              <ReadOnlyBanner productorName={ownerName ?? undefined} />
            </div>
          )}
          {renderScreen()}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <WizardSidebar screenStatuses={screenStatuses} />
      <main className="flex-1 overflow-y-auto">
        <div
          className={`relative p-8 ${isFullWidth ? '' : 'mx-auto max-w-[800px]'}`}
        >
          {/* Auto-save indicator top-right */}
          <div className="absolute right-8 top-8">
            <AutoSaveIndicator status={saveStatus} />
          </div>
          {isReadOnly && <ReadOnlyBanner productorName={ownerName ?? undefined} />}
          {renderScreen()}
          {/* Team management panel — visible to productor on datos screen */}
          {activeScreen === 'datos' && role === 'productor' && ownerId && (
            <div className="mt-8 border-t pt-8">
              <TeamMembers projectId={projectId} collaborators={collaborators} ownerId={ownerId} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
