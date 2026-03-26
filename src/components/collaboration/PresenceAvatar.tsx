import { cn } from '@/lib/utils'
import { es } from '@/locales/es'
import type { PresenceEntry } from '@/hooks/useProjectPresence'
import type { ProjectRole } from '@/lib/permissions'

interface PresenceAvatarProps {
  entry: PresenceEntry
  size?: 'sm' | 'md'
  isEditing?: boolean
}

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
} as const

const textSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
} as const

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getRoleName(role: string): string {
  const roleKey = role as ProjectRole
  return es.rbac.roles[roleKey] ?? role
}

function getRingColor(status: PresenceEntry['status'], isEditing: boolean): string {
  if (status === 'idle') return 'ring-muted-foreground/30'
  if (isEditing) return 'ring-orange-500'
  return 'ring-green-500'
}

/**
 * PresenceAvatar: Displays a single user's avatar with colored ring.
 *
 * Per D-05, D-06:
 * - Green ring = viewing (active, no lock)
 * - Orange ring = editing (has lock)
 * - Dimmed ring = idle
 * - Google photo with referrerPolicy="no-referrer", or initials fallback
 * - Tooltip shows name + role
 * - Idle dot indicator at bottom-right
 */
export function PresenceAvatar({ entry, size = 'md', isEditing = false }: PresenceAvatarProps) {
  const ringColor = getRingColor(entry.status, isEditing)
  const roleName = getRoleName(entry.role)
  const tooltip = `${entry.displayName} - ${roleName}`
  const sizeClass = sizeClasses[size]
  const textSize = textSizeClasses[size]

  return (
    <div className="relative inline-block" title={tooltip}>
      {entry.photoURL ? (
        <img
          src={entry.photoURL}
          alt={entry.displayName}
          referrerPolicy="no-referrer"
          className={cn(
            'rounded-full ring-2 object-cover',
            sizeClass,
            ringColor,
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full ring-2 bg-muted font-medium',
            sizeClass,
            ringColor,
            textSize,
          )}
        >
          {getInitials(entry.displayName)}
        </div>
      )}
      {entry.status === 'idle' && (
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-muted-foreground/50" />
      )}
    </div>
  )
}
