import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'

interface ActivityFiltersProps {
  members: { uid: string; displayName: string }[]
  selectedMember: string | null
  onMemberChange: (uid: string | null) => void
  selectedType: string | null
  onTypeChange: (type: string | null) => void
}

const EVENT_TYPE_FILTERS = [
  { key: null, label: es.activity.filterAllTypes },
  { key: 'edits', label: es.activity.filterEdits },
  { key: 'generation', label: es.activity.filterGeneration },
  { key: 'team', label: es.activity.filterTeam },
  { key: 'export', label: es.activity.filterExport },
] as const

/**
 * Pill toggle filters for team member and event type.
 * Two rows: Row 1 = team members, Row 2 = event types.
 * Single-select per row with AND combination.
 * Per D-08: pill shape, not dropdown.
 */
export function ActivityFilters({
  members,
  selectedMember,
  onMemberChange,
  selectedType,
  onTypeChange,
}: ActivityFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Team member filter */}
      <div role="radiogroup" aria-label="Filtrar por miembro" className="flex flex-wrap gap-2">
        <Button
          role="radio"
          aria-checked={selectedMember === null}
          variant={selectedMember === null ? 'default' : 'outline'}
          className="rounded-full text-sm px-3 py-1 h-auto"
          onClick={() => onMemberChange(null)}
        >
          {es.activity.filterAllMembers}
        </Button>
        {members.map((member) => (
          <Button
            key={member.uid}
            role="radio"
            aria-checked={selectedMember === member.uid}
            variant={selectedMember === member.uid ? 'default' : 'outline'}
            className="rounded-full text-sm px-3 py-1 h-auto"
            onClick={() => onMemberChange(member.uid)}
          >
            {member.displayName}
          </Button>
        ))}
      </div>

      {/* Row 2: Event type filter */}
      <div role="radiogroup" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
        {EVENT_TYPE_FILTERS.map((filter) => (
          <Button
            key={filter.key ?? 'all'}
            role="radio"
            aria-checked={selectedType === filter.key}
            variant={selectedType === filter.key ? 'default' : 'outline'}
            className="rounded-full text-sm px-3 py-1 h-auto"
            onClick={() => onTypeChange(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
