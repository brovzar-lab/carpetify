import { cn } from '@/lib/utils'
import type { PresenceEntry } from '@/hooks/useProjectPresence'
import { PresenceAvatar } from './PresenceAvatar'

interface PresenceAvatarRowProps {
  entries: PresenceEntry[]
  lockHolderIds?: Set<string>
}

/**
 * PresenceAvatarRow: Horizontal row of presence avatars for the project header.
 *
 * Per D-05:
 * - Shows all online team members
 * - Overlapping style (-space-x-1) when 3+ users
 * - Passes isEditing based on lockHolderIds set
 * - Returns null if no entries
 */
export function PresenceAvatarRow({ entries, lockHolderIds }: PresenceAvatarRowProps) {
  if (entries.length === 0) return null

  const useOverlap = entries.length >= 3

  return (
    <div
      className={cn(
        'flex items-center',
        useOverlap ? '-space-x-1' : 'gap-1',
      )}
    >
      {entries.map((entry) => (
        <PresenceAvatar
          key={entry.userId}
          entry={entry}
          size="sm"
          isEditing={lockHolderIds?.has(entry.userId) ?? false}
        />
      ))}
    </div>
  )
}
