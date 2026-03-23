/**
 * Single document item in the document list.
 * Shows: EFICINE ID badge, document name, status dot (10px circle), status label.
 * Active item: bg-primary/10 text-primary font-semibold (matches WizardSidebar pattern).
 * Special A4 Word icon and A9b budget link behavior planned for future plans.
 */
import { FileText, Loader2 } from 'lucide-react'
import { es } from '@/locales/es'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type DocStatus = 'pending' | 'generating' | 'complete' | 'error' | 'stale'

interface DocumentListItemProps {
  docId: string
  docName: string
  status: DocStatus
  isSelected: boolean
  manuallyEdited: boolean
  onClick: () => void
}

// Status dot colors
const statusDotColors: Record<DocStatus, string> = {
  complete: 'bg-[hsl(142_76%_36%)] dark:bg-[hsl(142_70%_45%)]',
  stale: 'bg-[hsl(38_92%_50%)]',
  error: 'bg-[hsl(0_84%_60%)] dark:bg-[hsl(0_62%_30%)]',
  pending: 'bg-muted-foreground/40',
  generating: 'bg-primary animate-pulse',
}

// Status label mapping
const statusLabels: Record<DocStatus, string> = {
  pending: es.generation.statusPending,
  generating: es.generation.statusGenerating,
  complete: es.generation.statusComplete,
  stale: es.generation.statusStale,
  error: es.generation.statusError,
}

export function DocumentListItem({
  docId,
  docName,
  status,
  isSelected,
  manuallyEdited,
  onClick,
}: DocumentListItemProps) {
  const isClickable = status === 'complete' || status === 'stale' || manuallyEdited

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable && status !== 'pending'}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left',
        isSelected
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-foreground hover:bg-muted',
        !isClickable && status !== 'pending' && 'cursor-default',
      )}
    >
      {/* EFICINE ID badge */}
      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 font-mono">
        {docId}
      </Badge>

      {/* Document name */}
      <span className="flex-1 truncate text-xs">{docName}</span>

      {/* Manually edited badge */}
      {manuallyEdited && (
        <Badge
          variant="secondary"
          className="shrink-0 text-[10px] bg-[hsl(38_92%_50%)]/15 text-[hsl(38_92%_50%)]"
        >
          <FileText className="h-3 w-3" />
        </Badge>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        {status === 'generating' ? (
          <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
        ) : (
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
              statusDotColors[status],
            )}
          />
        )}
        <span
          className={cn(
            'text-[10px]',
            status === 'complete' && 'text-[hsl(142_76%_36%)] dark:text-[hsl(142_70%_45%)]',
            status === 'pending' && 'text-muted-foreground',
            status === 'generating' && 'text-primary',
            status === 'stale' && 'text-[hsl(38_92%_50%)]',
            status === 'error' && 'text-destructive',
          )}
        >
          {statusLabels[status]}
        </span>
      </div>
    </button>
  )
}
