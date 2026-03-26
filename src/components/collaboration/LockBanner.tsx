import { Lock } from 'lucide-react'
import { es } from '@/locales/es'
import type { ProjectRole } from '@/lib/permissions'

interface LockBannerProps {
  holderName: string
  holderRole: string
  canForceBreak: boolean
  onForceBreak?: () => void
}

function getRoleName(role: string): string {
  const roleKey = role as ProjectRole
  return es.rbac.roles[roleKey] ?? role
}

/**
 * LockBanner: Displays a conflict banner when another user holds the section lock.
 *
 * Per D-16, D-15:
 * - Orange-themed banner with Lock icon
 * - Spanish message from es.collaboration.lockMessage
 * - Optional "Desbloquear" button for productor force-break
 * - Dark mode support
 */
export function LockBanner({ holderName, holderRole, canForceBreak, onForceBreak }: LockBannerProps) {
  const roleName = getRoleName(holderRole)

  return (
    <div className="flex items-start gap-3 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-800 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-200">
      <Lock className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">
        {es.collaboration.lockMessage(holderName, roleName)}
      </p>
      {canForceBreak && onForceBreak && (
        <button
          type="button"
          onClick={onForceBreak}
          className="shrink-0 text-sm font-medium underline underline-offset-2 hover:text-orange-900 dark:hover:text-orange-100"
        >
          {es.collaboration.forceBreak}
        </button>
      )}
    </div>
  )
}
