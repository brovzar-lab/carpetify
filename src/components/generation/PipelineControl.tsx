/**
 * "Generar carpeta" CTA button with state management.
 * Button states:
 * - Enabled "Generar carpeta" (primary): pipeline not running, ready to generate
 * - Disabled "Generando...": during pipeline execution
 * - "Continuar desde Paso {n}" (primary): pipeline partially failed (D-03)
 * Per D-01: re-generation without confirmation (both full and per-pass modes)
 */
import { Loader2, Play, RotateCcw } from 'lucide-react'
import { es } from '@/locales/es'
import { Button } from '@/components/ui/button'
import { PASS_NUMBERS, type PassId } from '@/services/generation'
import type { PipelineStatus } from '@/hooks/useGeneration'

interface PipelineControlProps {
  isRunning: boolean
  pipelineStatus: PipelineStatus
  failedAtPass: PassId | null
  onGenerate: () => void
  onResume: (passId: PassId) => void
}

export function PipelineControl({
  isRunning,
  pipelineStatus,
  failedAtPass,
  onGenerate,
  onResume,
}: PipelineControlProps) {
  // During execution: show disabled "Generando..." button
  if (isRunning) {
    return (
      <Button disabled size="lg">
        <Loader2 className="animate-spin" />
        {es.generation.pipelineRunning}
      </Button>
    )
  }

  // Partial failure: show "Continuar desde Paso {n}" button
  if (pipelineStatus === 'partial' && failedAtPass) {
    const passNumber = PASS_NUMBERS[failedAtPass]
    return (
      <Button size="lg" onClick={() => onResume(failedAtPass)}>
        <RotateCcw />
        {es.generation.resumeCTA(passNumber)}
      </Button>
    )
  }

  // Default: "Generar carpeta" button
  return (
    <Button size="lg" onClick={onGenerate}>
      <Play />
      {es.generation.generateCTA}
    </Button>
  )
}
