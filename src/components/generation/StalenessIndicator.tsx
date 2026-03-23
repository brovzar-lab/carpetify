/**
 * Yellow warning banner for stale documents/passes.
 * Shows in the document viewer when viewing a stale document,
 * with a "Regenerar Paso {n}" button and optional manual edit warning.
 * Per UI-SPEC "Staleness & Regeneration".
 */
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'
import { PASS_NUMBERS, type PassId } from '@/services/generation'

// ---- Types ----

interface StalenessIndicatorProps {
  passId: PassId
  reason: string
  onRegenerate: () => void
  hasEditedDocs: boolean
  isRegenerating?: boolean
}

// ---- Component ----

export function StalenessIndicator({
  passId,
  reason,
  onRegenerate,
  hasEditedDocs,
  isRegenerating = false,
}: StalenessIndicatorProps) {
  const passNumber = PASS_NUMBERS[passId]

  return (
    <Alert className="m-4 mb-0 border-[hsl(38_92%_50%)] bg-[hsl(38_92%_50%)]/10">
      <AlertTriangle className="h-4 w-4 text-[hsl(38_92%_50%)]" />
      <AlertTitle className="text-[hsl(38_92%_50%)]">
        {es.generation.stalePassTitle(passNumber)}
      </AlertTitle>
      <AlertDescription>
        <p>{reason}</p>
        {hasEditedDocs && (
          <p className="mt-1 font-medium">
            {es.generation.editWarning}
          </p>
        )}
        <div className="mt-2">
          <Button
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {es.generation.regeneratePassCTA(passNumber)}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
