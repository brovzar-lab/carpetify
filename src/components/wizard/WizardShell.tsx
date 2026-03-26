import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams } from 'react-router'
import { Loader2, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import { WizardSidebar } from '@/components/wizard/WizardSidebar'
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator'
import { ReadOnlyBanner } from '@/components/common/ReadOnlyBanner'
import { AccessDenied } from '@/components/auth/AccessDenied'
import { LockBanner } from '@/components/collaboration/LockBanner'
import { ForceBreakDialog } from '@/components/collaboration/ForceBreakDialog'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useValidation } from '@/hooks/useValidation'
import { useProjectAccess } from '@/hooks/useProjectAccess'
import { usePresence } from '@/hooks/usePresence'
import { useProjectPresence } from '@/hooks/useProjectPresence'
import { useSectionLock } from '@/hooks/useSectionLock'
import { useIdleDetection } from '@/hooks/useIdleDetection'
import { canEditScreen } from '@/lib/permissions'
import { es } from '@/locales/es'
import { Button } from '@/components/ui/button'
import type { WizardScreen } from '@/stores/wizardStore'
import { useAppStore } from '@/stores/appStore'

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
import { ActivityTab } from '@/components/collaboration/ActivityTab'

/**
 * Wizard layout: 240px sidebar + content area.
 * Reads projectId and screen from URL params.
 * Renders the active screen component with auto-save indicator.
 *
 * RBAC gate: checks project membership via useProjectAccess.
 * Non-members see AccessDenied page. Non-editable screens show ReadOnlyBanner.
 *
 * Collaboration (Plan 12-03):
 * - Presence: writes user's current screen to RTDB, shows others' avatars
 * - Section locking: acquires lock on edit intent (D-01), releases on navigate/idle/explicit (D-03)
 * - Role priority: role restriction takes priority over lock banner (D-14)
 * - Idle detection: dims presence after 30s, releases lock after 60s (D-07, D-03)
 * - Auto-save: flushes before lock release (Pitfall 5), skips save when lock not held (D-12)
 */
export function WizardShell() {
  const { projectId = '', screen } = useParams<{
    projectId: string
    screen: string
  }>()
  const activeScreen = (screen || 'datos') as WizardScreen

  // Set active project in global store so AppHeader can show presence avatars
  const setActiveProject = useAppStore((s) => s.setActiveProject)
  useEffect(() => {
    setActiveProject(projectId)
    return () => setActiveProject(null)
  }, [projectId, setActiveProject])

  // RBAC: check project access
  const { hasAccess, role, loading: accessLoading, ownerName, collaborators, ownerId } = useProjectAccess(projectId)

  // --- Collaboration hooks (Plan 12-03) ---

  // Presence: write current user's screen to RTDB (D-05, D-07)
  const { setPresenceIdle, setPresenceActive } = usePresence(projectId, activeScreen)

  // Presence: read all other users' presence (D-05, D-06)
  const presenceList = useProjectPresence(projectId)

  // Section lock: acquire/release/renew for current screen (D-01, D-02)
  const { lockState, acquireLock, releaseLock, renewLock } = useSectionLock(projectId, activeScreen)

  // Edit state: track whether current user is actively editing
  const [isEditing, setIsEditing] = useState(false)
  const [forceBreakOpen, setForceBreakOpen] = useState(false)

  // Auto-save hook for the current screen's metadata (D-12: lock-aware)
  const { status: saveStatus, flushAndWait } = useAutoSave(
    projectId,
    'metadata',
    1500,
    isEditing, // lockOwned: only save when editing (lock held)
    renewLock, // onSaveComplete: renew lock after each save
  )

  // Per-screen validation statuses for sidebar traffic lights (VALD-16)
  const { screenStatuses } = useValidation(projectId)

  // --- Edit intent handler (D-01: lock on edit intent, not page open) ---
  const handleStartEditing = useCallback(async () => {
    const acquired = await acquireLock()
    if (acquired) {
      setIsEditing(true)
      toast.success(es.collaboration.lockAcquired)
    } else {
      toast.error(es.collaboration.lockFailed)
    }
  }, [acquireLock])

  // --- Stop editing handler (D-03: explicit release, Pitfall 5: flush before release) ---
  const handleStopEditing = useCallback(async () => {
    await flushAndWait() // Flush pending auto-save before releasing lock
    await releaseLock()
    setIsEditing(false)
    toast.info(es.collaboration.lockReleased)
  }, [flushAndWait, releaseLock])

  // --- Idle detection (D-03, D-07) ---
  useIdleDetection({
    onIdle: () => setPresenceIdle(),
    onActive: () => {
      setPresenceActive()
      if (isEditing) renewLock() // Renew lock while active
    },
    onLockTimeout: () => {
      if (isEditing) handleStopEditing() // Auto-release lock after 60s idle
    },
  })

  // --- Lock release on screen change ---
  const prevScreenRef = useRef(activeScreen)
  useEffect(() => {
    if (prevScreenRef.current !== activeScreen && isEditing) {
      handleStopEditing()
    }
    prevScreenRef.current = activeScreen
  }, [activeScreen, isEditing, handleStopEditing])

  // --- Lock + role priority in UI (D-14, D-16) ---
  const canEdit = role !== null && canEditScreen(role, activeScreen)
  // D-14: role restriction takes priority -- never show lock banner if user can't edit
  const showReadOnlyBanner = !canEdit
  const showLockBanner = canEdit && lockState.isLocked && !lockState.isMyLock
  const isProductor = role === 'productor'

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
      case 'actividad':
        return <ActivityTab projectId={projectId} />
      default:
        return <ProjectSetup projectId={projectId} />
    }
  }

  /** Render the collaboration banner area: read-only, lock, or edit controls */
  function renderCollaborationBanner() {
    // Role restriction takes priority (D-14)
    if (showReadOnlyBanner) {
      return <ReadOnlyBanner productorName={ownerName ?? undefined} />
    }

    // Another user holds the lock
    if (showLockBanner) {
      return (
        <LockBanner
          holderName={lockState.holder?.displayName ?? ''}
          holderRole={lockState.holder?.role ?? ''}
          canForceBreak={isProductor}
          onForceBreak={() => setForceBreakOpen(true)}
        />
      )
    }

    // User can edit and no lock conflict
    if (canEdit && !isEditing && !lockState.isLocked) {
      return (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEditing}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            {es.collaboration.startEditing}
          </Button>
        </div>
      )
    }

    // User is actively editing (lock held)
    if (canEdit && isEditing && lockState.isMyLock) {
      return (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopEditing}
          >
            <Check className="mr-2 h-3.5 w-3.5" />
            {es.collaboration.finishEditing}
          </Button>
        </div>
      )
    }

    return null
  }

  // Screens that use full-width layouts (no max-width constraint)
  const isFullWidth = activeScreen === 'guion' || activeScreen === 'financiera' || activeScreen === 'generacion' || activeScreen === 'validacion' || activeScreen === 'exportar' || activeScreen === 'actividad'

  // Generation and validation screens manage their own layout (full-width panels)
  if (activeScreen === 'generacion' || activeScreen === 'validacion' || activeScreen === 'exportar' || activeScreen === 'actividad') {
    return (
      <div className="flex h-screen">
        <WizardSidebar screenStatuses={screenStatuses} presenceList={presenceList} />
        <main className="flex-1 flex flex-col min-h-0">
          {renderCollaborationBanner() && (
            <div className="px-6 pt-4">
              {renderCollaborationBanner()}
            </div>
          )}
          {renderScreen()}
        </main>
        <ForceBreakDialog
          open={forceBreakOpen}
          onOpenChange={setForceBreakOpen}
          holderName={lockState.holder?.displayName ?? ''}
          holderRole={lockState.holder?.role ?? ''}
          projectId={projectId}
          screenId={activeScreen}
          onSuccess={() => setForceBreakOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <WizardSidebar screenStatuses={screenStatuses} presenceList={presenceList} />
      <main className="flex-1 overflow-y-auto">
        <div
          className={`relative p-8 ${isFullWidth ? '' : 'mx-auto max-w-[800px]'}`}
        >
          {/* Auto-save indicator top-right */}
          <div className="absolute right-8 top-8">
            <AutoSaveIndicator status={saveStatus} />
          </div>
          {renderCollaborationBanner()}
          {renderScreen()}
          {/* Team management panel -- visible to productor on datos screen */}
          {activeScreen === 'datos' && role === 'productor' && ownerId && (
            <div className="mt-8 border-t pt-8">
              <TeamMembers projectId={projectId} collaborators={collaborators} ownerId={ownerId} />
            </div>
          )}
        </div>
      </main>
      <ForceBreakDialog
        open={forceBreakOpen}
        onOpenChange={setForceBreakOpen}
        holderName={lockState.holder?.displayName ?? ''}
        holderRole={lockState.holder?.role ?? ''}
        projectId={projectId}
        screenId={activeScreen}
        onSuccess={() => setForceBreakOpen(false)}
      />
    </div>
  )
}
