import { formatDistanceToNow, format, isToday } from 'date-fns'
import { es } from 'date-fns/locale/es'
import {
  Pencil,
  Sparkles,
  UserPlus,
  Download,
  Plus,
  Trash2,
  Upload,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FIELD_LABELS, type ActivityLogEntry } from '@/services/activityLog'

const ROLE_LABELS: Record<string, string> = {
  productor: 'Productor',
  line_producer: 'Line Producer',
  abogado: 'Abogado',
  director: 'Director',
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  update: Pencil,
  create: Plus,
  delete: Trash2,
  generate: Sparkles,
  invite: UserPlus,
  accept_invite: UserPlus,
  role_change: UserPlus,
  export: Download,
  upload: Upload,
  warning_dismissed: AlertTriangle,
}

interface ActivityEntryProps {
  entry: ActivityLogEntry
}

/**
 * Single activity entry row with avatar, description, role badge, icon, and timestamp.
 * Per D-07: today's entries show relative time ("hace 2 horas"), older show "HH:mm".
 */
export function ActivityEntry({ entry }: ActivityEntryProps) {
  const Icon = ACTION_ICONS[entry.action] || Pencil
  const roleLabel = ROLE_LABELS[entry.userRole] || entry.userRole

  // Compute initials from displayName
  const initials = entry.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')

  // Format timestamp: relative for today, absolute for older
  const timestamp = isToday(entry.createdAt)
    ? formatDistanceToNow(entry.createdAt, { locale: es, addSuffix: true })
    : format(entry.createdAt, 'HH:mm')

  // Build accessible label
  const ariaLabel = `${entry.displayName} ${entry.summary} ${timestamp}`

  return (
    <article className="flex items-start py-4 border-b border-border" aria-label={ariaLabel}>
      {/* Avatar */}
      <div className="shrink-0">
        {entry.photoURL ? (
          <img
            src={entry.photoURL}
            alt={entry.displayName}
            className="rounded-full w-8 h-8 object-cover"
          />
        ) : (
          <div className="rounded-full w-8 h-8 bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            {initials}
          </div>
        )}
      </div>

      {/* Center content */}
      <div className="flex-1 ml-3 min-w-0">
        {/* Line 1: Name + role badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{entry.displayName}</span>
          {roleLabel && (
            <Badge variant="outline" className="text-xs">
              {roleLabel}
            </Badge>
          )}
        </div>

        {/* Line 2: Icon + summary */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">{entry.summary}</span>
        </div>

        {/* Line 3: Changed field names (edit events only) */}
        {entry.action === 'update' && entry.changedFields.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {entry.changedFields
              .map((f) => FIELD_LABELS[f] || f)
              .join(', ')}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-muted-foreground whitespace-nowrap ml-3 shrink-0">
        {timestamp}
      </span>
    </article>
  )
}
