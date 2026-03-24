/**
 * Compact validation summary for project cards.
 * Shows clickable blocker/warning counts that navigate to the
 * validation dashboard with appropriate filter pre-selected.
 */
import { useNavigate } from 'react-router'
import { es } from '@/locales/es'

interface ValidationProjectCardBadgeProps {
  blockerCount: number
  warningCount: number
  projectId: string
  expiringCount?: number
}

export function ValidationProjectCardBadge({
  blockerCount,
  warningCount,
  projectId,
}: ValidationProjectCardBadgeProps) {
  const navigate = useNavigate()

  const handleBlockerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/project/${projectId}/validacion?filter=blockers`)
  }

  const handleWarningClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/project/${projectId}/validacion?filter=warnings`)
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {blockerCount > 0 ? (
        <button
          type="button"
          className="text-[hsl(0_84%_60%)] hover:underline cursor-pointer"
          onClick={handleBlockerClick}
        >
          {es.dashboard.blockers(blockerCount)}
        </button>
      ) : (
        <span className="text-[hsl(142_76%_36%)]">
          {es.validation.projectCardNoBlockers}
        </span>
      )}
      {warningCount > 0 && (
        <button
          type="button"
          className="text-[hsl(38_92%_50%)] hover:underline cursor-pointer"
          onClick={handleWarningClick}
        >
          {es.validation.projectCardWarnings(warningCount)}
        </button>
      )}
    </div>
  )
}
