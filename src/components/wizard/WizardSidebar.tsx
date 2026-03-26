import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Lock, Activity } from 'lucide-react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { es } from '@/locales/es'
import { TrafficLight, type TrafficLightStatus } from '@/components/common/TrafficLight'
import { SidebarPresenceDot } from '@/components/collaboration/SidebarPresenceDot'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { canEditScreen } from '@/lib/permissions'
import type { WizardScreen } from '@/stores/wizardStore'
import type { PresenceEntry } from '@/hooks/useProjectPresence'

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
  /** Presence entries for other users in this project (per D-05). */
  presenceList?: PresenceEntry[]
}

/**
 * Hook to compute badge count of unseen activity entries.
 * Subscribes to activity_log and compares against lastViewedActivity timestamp.
 */
function useActivityBadge(projectId: string | undefined): number {
  const { user } = useAuth()
  const [badgeCount, setBadgeCount] = useState(0)
  const lastViewedRef = useRef<Date | null>(null)

  // Read lastViewedActivity once on mount
  useEffect(() => {
    if (!user || !projectId) return
    const ref = doc(db, `userProjects/${user.uid}/projects/${projectId}`)
    getDoc(ref)
      .then((snap) => {
        const data = snap.data()
        if (data?.lastViewedActivity) {
          lastViewedRef.current = data.lastViewedActivity.toDate?.() ?? new Date(data.lastViewedActivity)
        } else {
          lastViewedRef.current = new Date(0) // No previous view -- everything is "new"
        }
      })
      .catch(() => {
        lastViewedRef.current = new Date(0)
      })
  }, [user, projectId])

  // Subscribe to activity_log and count entries newer than lastViewedActivity
  useEffect(() => {
    if (!projectId) return

    const q = query(
      collection(db, `projects/${projectId}/activity_log`),
      orderBy('createdAt', 'desc'),
      limit(100),
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!lastViewedRef.current) {
        // lastViewedActivity not yet loaded, count all
        setBadgeCount(snap.docs.length)
        return
      }

      const count = snap.docs.filter((d) => {
        const ts = d.data().createdAt?.toDate?.()
        return ts && ts > lastViewedRef.current!
      }).length

      setBadgeCount(count)
    })

    return unsubscribe
  }, [projectId])

  return badgeCount
}

/**
 * Wizard sidebar navigation with screen links and traffic light status.
 * 240px fixed width, full height, muted background.
 * All screens always accessible (free navigation per D-01).
 * Shows lock icon next to screens the user cannot edit (per RBAC role).
 * Shows presence dots next to screens where other users are present (per D-05).
 * Shows Actividad link with badge count after third separator.
 */
export function WizardSidebar({ screenStatuses = {}, presenceList = [] }: WizardSidebarProps) {
  const { projectId, screen } = useParams<{
    projectId: string
    screen: string
  }>()
  const activeScreen = (screen || 'datos') as WizardScreen
  const currentProjectRole = useAppStore((s) => s.currentProjectRole)
  const badgeCount = useActivityBadge(projectId)

  function renderLink(item: ScreenItem) {
    const isActive = activeScreen === item.key
    const status = screenStatuses[item.key] || 'partial'
    const isLocked = currentProjectRole !== null && !canEditScreen(currentProjectRole, item.key)
    const screenEntries = presenceList.filter((entry) => entry.screen === item.key)

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
        <SidebarPresenceDot entries={screenEntries} />
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

        {/* Activity tab -- separated from generation/validation/export screens */}
        <Separator className="my-2" />
        <Link
          to={`/project/${projectId}/actividad`}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
            activeScreen === 'actividad'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          aria-label={
            badgeCount > 0
              ? `${es.wizard.screen9}, ${es.activity.newEntries(badgeCount)}`
              : es.wizard.screen9
          }
        >
          <Activity className="h-4 w-4" />
          <span className="flex-1">{es.wizard.screen9}</span>
          {badgeCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
              {badgeCount}
            </Badge>
          )}
        </Link>
      </nav>
    </aside>
  )
}
