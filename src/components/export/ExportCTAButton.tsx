/**
 * Oversized export CTA button with dynamic styling per D-13.
 *
 * Height: 48px (h-12) per UI-SPEC exception.
 * Green when clean, yellow when warnings, red+disabled when blockers.
 */
import { Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'

interface ExportCTAButtonProps {
  state: 'clean' | 'warnings' | 'blockers' | 'exporting' | 'complete' | 'error'
  warningCount: number
  blockerCount: number
  onExport: () => void
  onShowBlockers: () => void
  onRetry: () => void
}

export function ExportCTAButton({
  state,
  warningCount,
  blockerCount,
  onExport,
  onShowBlockers,
  onRetry,
}: ExportCTAButtonProps) {
  // Determine button styling and behavior.
  // NOTE: 'blockers' is intentionally NOT disabled at the DOM level because
  // disabled buttons don't fire onClick events. The blockers CTA should still
  // be clickable to open the blocker detail modal; the visual "disabled" look
  // is applied through CSS only (opacity, cursor-not-allowed).
  const isDisabled = state === 'exporting'

  const handleClick = () => {
    if (state === 'blockers') {
      onShowBlockers()
      return
    }
    if (state === 'error') {
      onRetry()
      return
    }
    onExport()
  }

  // Dynamic class name for button background
  const getClassName = () => {
    const base = 'h-12 w-full text-base font-semibold gap-2'
    switch (state) {
      case 'clean':
        return `${base} bg-[hsl(142_76%_36%)] text-white hover:bg-[hsl(142_76%_30%)]`
      case 'warnings':
        return `${base} bg-[hsl(38_92%_50%)] text-white hover:bg-[hsl(38_92%_44%)]`
      case 'blockers':
        return `${base} bg-[hsl(0_84%_60%)]/50 text-white cursor-not-allowed`
      case 'exporting':
        return `${base} bg-muted text-muted-foreground cursor-not-allowed`
      case 'complete':
        return `${base} bg-[hsl(142_76%_36%)] text-white hover:bg-[hsl(142_76%_30%)]`
      case 'error':
        return `${base} bg-[hsl(0_84%_60%)] text-white hover:bg-[hsl(0_84%_50%)]`
      default:
        return base
    }
  }

  // Subtext below button
  const getSubtext = () => {
    if (state === 'blockers' && blockerCount > 0) {
      return es.export.ctaSubtextBlockers(blockerCount)
    }
    if (state === 'warnings' && warningCount > 0) {
      return es.export.ctaSubtextWarnings(warningCount)
    }
    return null
  }

  const subtext = getSubtext()

  return (
    <div className="space-y-1.5">
      <Button
        className={getClassName()}
        disabled={isDisabled}
        onClick={handleClick}
      >
        {state === 'exporting' && (
          <Loader2 className="size-5 animate-spin" />
        )}
        {state !== 'exporting' && state !== 'error' && (
          <Download className="size-5" />
        )}
        {state === 'error' ? es.export.progressRetry : es.export.ctaLabel}
      </Button>

      {subtext && (
        <p className="text-center text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  )
}
