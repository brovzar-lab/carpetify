import { useEffect, useMemo, useState } from 'react'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import { es as dateFnsEs } from 'date-fns/locale/es'
import { Activity, Loader2 } from 'lucide-react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useActivityLog } from '@/hooks/useActivityLog'
import { ActivityEntry } from '@/components/collaboration/ActivityEntry'
import { ActivityFilters } from '@/components/collaboration/ActivityFilters'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'
import type { ActivityLogEntry } from '@/services/activityLog'

interface ActivityTabProps {
  projectId: string
}

/** Map filter type keys to action values for client-side filtering */
function matchesTypeFilter(
  action: ActivityLogEntry['action'],
  filterType: string | null,
): boolean {
  if (!filterType) return true
  switch (filterType) {
    case 'edits':
      return action === 'update'
    case 'generation':
      return action === 'generate'
    case 'team':
      return (
        action === 'invite' ||
        action === 'accept_invite' ||
        action === 'role_change'
      )
    case 'export':
      return action === 'export'
    default:
      return true
  }
}

/** Group entries by calendar day */
function groupByDay(
  entries: ActivityLogEntry[],
): { label: string; entries: ActivityLogEntry[] }[] {
  const groups: Map<string, ActivityLogEntry[]> = new Map()

  for (const entry of entries) {
    const dayKey = startOfDay(entry.createdAt).toISOString()
    if (!groups.has(dayKey)) {
      groups.set(dayKey, [])
    }
    groups.get(dayKey)!.push(entry)
  }

  return Array.from(groups.entries()).map(([dayKey, dayEntries]) => {
    const date = new Date(dayKey)
    let label: string
    if (isToday(date)) {
      label = es.activity.today
    } else if (isYesterday(date)) {
      label = es.activity.yesterday
    } else {
      label = format(date, "d 'de' MMMM 'de' yyyy", { locale: dateFnsEs })
    }
    return { label, entries: dayEntries }
  })
}

/**
 * Full activity tab with filters, day-grouped feed, load more, empty state, badge management.
 * Per D-05: dedicated tab alongside wizard screens, full-width layout.
 * Per D-06: writes lastViewedActivity on mount to reset badge count.
 */
export function ActivityTab({ projectId }: ActivityTabProps) {
  const { user } = useAuth()
  const { entries, loading, hasMore, loadMore, loadingMore } =
    useActivityLog(projectId)

  // Filter state
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Write lastViewedActivity on mount to reset badge count (per D-06)
  useEffect(() => {
    if (!user || !projectId) return
    const ref = doc(db, `userProjects/${user.uid}/projects/${projectId}`)
    setDoc(ref, { lastViewedActivity: serverTimestamp() }, { merge: true }).catch(
      (err) => console.warn('Failed to update lastViewedActivity:', err),
    )
  }, [user, projectId])

  // Extract unique team members for filter pills
  const members = useMemo(() => {
    const seen = new Map<string, string>()
    for (const entry of entries) {
      if (!seen.has(entry.userId)) {
        seen.set(entry.userId, entry.displayName)
      }
    }
    return Array.from(seen.entries()).map(([uid, displayName]) => ({
      uid,
      displayName,
    }))
  }, [entries])

  // Apply client-side filters
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedMember && entry.userId !== selectedMember) return false
      if (!matchesTypeFilter(entry.action, selectedType)) return false
      return true
    })
  }, [entries, selectedMember, selectedType])

  // Group by day
  const dayGroups = useMemo(
    () => groupByDay(filteredEntries),
    [filteredEntries],
  )

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">{es.wizard.screen9}</h1>
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">{es.wizard.screen9}</h1>
        <div className="flex flex-col items-center justify-center mt-24 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold">
            {es.activity.emptyHeading}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {es.activity.emptyBody}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-8" aria-live="polite">
      <h1 className="text-xl font-semibold">{es.wizard.screen9}</h1>

      {/* Filter pills */}
      <div className="mt-6">
        <ActivityFilters
          members={members}
          selectedMember={selectedMember}
          onMemberChange={setSelectedMember}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />
      </div>

      {/* Scrollable feed */}
      <ScrollArea className="flex-1 mt-6">
        {dayGroups.map((group, groupIdx) => (
          <div key={group.label}>
            {/* Day header */}
            <h3
              className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 ${
                groupIdx > 0 ? 'mt-6' : ''
              }`}
            >
              {group.label}
            </h3>

            {/* Entries */}
            {group.entries.map((entry) => (
              <div key={entry.id} className="transition-opacity duration-200">
                <ActivityEntry entry={entry} />
              </div>
            ))}
          </div>
        ))}

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center py-6">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {es.activity.loadingMore}
                </>
              ) : (
                es.activity.loadMore
              )}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
