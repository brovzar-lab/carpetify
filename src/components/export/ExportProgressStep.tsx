/**
 * Single step within the export progress view.
 *
 * States per UI-SPEC:
 * - pending: gray circle, gray label
 * - active: spinner, primary label, progress bar, detail text
 * - complete: green checkmark, green label, completion text
 * - error: red X, red label, error detail
 */
import { CheckCircle2, Loader2, XCircle, Circle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ExportProgressStepProps {
  stepNumber: number
  label: string
  detail?: string
  state: 'pending' | 'active' | 'complete' | 'error'
  progress?: { current: number; total: number }
}

export function ExportProgressStep({
  stepNumber: _stepNumber,
  label,
  detail,
  state,
  progress,
}: ExportProgressStepProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {/* State icon */}
      <div className="mt-0.5 shrink-0">
        {state === 'pending' && (
          <Circle className="size-5 text-muted-foreground" />
        )}
        {state === 'active' && (
          <Loader2 className="size-5 animate-spin text-primary" />
        )}
        {state === 'complete' && (
          <CheckCircle2 className="size-5 text-[hsl(142_76%_36%)]" />
        )}
        {state === 'error' && (
          <XCircle className="size-5 text-[hsl(0_84%_60%)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            state === 'pending'
              ? 'text-muted-foreground'
              : state === 'active'
                ? 'text-primary'
                : state === 'complete'
                  ? 'text-[hsl(142_76%_36%)]'
                  : 'text-[hsl(0_84%_60%)]'
          }`}
        >
          {label}
        </p>

        {/* Detail text */}
        {detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        )}

        {/* Progress bar for active state */}
        {state === 'active' && progress && progress.total > 0 && (
          <div className="mt-1.5">
            <Progress
              value={(progress.current / progress.total) * 100}
              className="h-1.5"
            />
          </div>
        )}

        {/* Indeterminate progress for active without total */}
        {state === 'active' && (!progress || progress.total === 0) && (
          <div className="mt-1.5">
            <Progress value={0} className="h-1.5" />
          </div>
        )}
      </div>
    </div>
  )
}
