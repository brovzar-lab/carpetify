import { cn } from '@/lib/utils'
import type { PresenceEntry } from '@/hooks/useProjectPresence'

interface SidebarPresenceDotProps {
  entries: PresenceEntry[]
}

/**
 * SidebarPresenceDot: Small avatar dots for sidebar screen items.
 *
 * Per D-05:
 * - Shows tiny colored circles for users on a specific screen
 * - Green = active, dimmed = idle
 * - Max 3 dots visible, "+N" overflow text for more
 * - Tooltip shows first initial of each user
 * - Returns null if no entries
 */
export function SidebarPresenceDot({ entries }: SidebarPresenceDotProps) {
  if (entries.length === 0) return null

  const visible = entries.slice(0, 3)
  const overflow = entries.length - 3

  return (
    <div className="flex items-center gap-0.5">
      {visible.map((entry) => (
        <span
          key={entry.userId}
          title={entry.displayName}
          className={cn(
            'inline-block h-2 w-2 rounded-full',
            entry.status === 'idle'
              ? 'bg-muted-foreground/30'
              : 'bg-green-500',
          )}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}
