import { Link, useParams } from 'react-router'
import { ArrowLeft, Lock } from 'lucide-react'
import { es } from '@/locales/es'
import { TrafficLight, type TrafficLightStatus } from '@/components/common/TrafficLight'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { canEditScreen } from '@/lib/permissions'
import type { WizardScreen } from '@/stores/wizardStore'

interface ScreenItem {
  key: WizardScreen
  label: string
}

const screens: ScreenItem[] = [
  { key: 'datos', label: es.wizard.screen1 },
  { key: 'guion', label: es.wizard.screen2 },
  { key: 'equipo', label: es.wizard.screen3 },
  { key: 'financiera', label: es.wizard.screen4 },
  { key: 'documentos', label: es.wizard.screen5 },
]

/** Additional screens below the separator */
const additionalScreens: ScreenItem[] = [
  { key: 'generacion', label: es.wizard.screen6 },
  { key: 'validacion', label: es.wizard.screen7 },
  { key: 'exportar', label: es.wizard.screen8 },
]

interface WizardSidebarProps {
  /** Traffic light status per screen. Defaults to 'partial' if not provided. */
  screenStatuses?: Partial<Record<WizardScreen, TrafficLightStatus>>
}

/**
 * Wizard sidebar navigation with screen links and traffic light status.
 * 240px fixed width, full height, muted background.
 * All screens always accessible (free navigation per D-01).
 * Shows lock icon next to screens the user cannot edit (per RBAC role).
 */
export function WizardSidebar({ screenStatuses = {} }: WizardSidebarProps) {
  const { projectId, screen } = useParams<{
    projectId: string
    screen: string
  }>()
  const activeScreen = (screen || 'datos') as WizardScreen
  const currentProjectRole = useAppStore((s) => s.currentProjectRole)

  function renderLink(item: ScreenItem) {
    const isActive = activeScreen === item.key
    const status = screenStatuses[item.key] || 'partial'
    const isLocked = currentProjectRole !== null && !canEditScreen(currentProjectRole, item.key)

    return (
      <Link
        key={item.key}
        to={`/project/${projectId}/${item.key}`}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <TrafficLight status={status} />
        <span className="flex-1">{item.label}</span>
        {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />}
      </Link>
    )
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col bg-muted/50 border-r">
      {/* Back to dashboard */}
      <Link
        to="/"
        className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{es.wizard.backToDashboard}</span>
      </Link>

      {/* Screen navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {screens.map(renderLink)}

        {/* Generation/validation/export screens -- separated from intake wizard screens */}
        <Separator className="my-2" />
        {additionalScreens.map(renderLink)}
      </nav>
    </aside>
  )
}
