import { cn } from '@/lib/utils'

export type TrafficLightStatus = 'complete' | 'partial' | 'error'

interface TrafficLightProps {
  status: TrafficLightStatus
  className?: string
}

const statusColors: Record<TrafficLightStatus, string> = {
  complete: 'bg-[hsl(142_76%_36%)] dark:bg-[hsl(142_70%_45%)]',
  partial: 'bg-[hsl(38_92%_50%)]',
  error: 'bg-[hsl(0_84%_60%)] dark:bg-[hsl(0_62%_30%)]',
}

/**
 * Small traffic light circle indicator for wizard sidebar.
 * 12px diameter, color based on screen validation status.
 */
export function TrafficLight({ status, className }: TrafficLightProps) {
  return (
    <span
      className={cn(
        'inline-block h-3 w-3 shrink-0 rounded-full',
        statusColors[status],
        className,
      )}
      aria-label={status}
    />
  )
}
