/**
 * Step-by-step progress display for the export pipeline per D-15.
 *
 * Four sequential stages:
 * 1. Verificacion de idioma
 * 2. Generando PDFs
 * 3. Descargando documentos subidos
 * 4. Compilando ZIP
 */
import { es } from '@/locales/es'
import type { ExportProgress } from '@/lib/export/types'
import { ExportProgressStep } from './ExportProgressStep'

interface ExportProgressViewProps {
  progress: ExportProgress | null
  languageCheckDone: boolean
}

type StepState = 'pending' | 'active' | 'complete' | 'error'

export function ExportProgressView({
  progress,
  languageCheckDone,
}: ExportProgressViewProps) {
  if (!progress && !languageCheckDone) return null

  const phase = progress?.phase ?? 'language-check'
  const isError = phase === 'error'

  // Determine step states based on current phase
  function getStepState(stepPhase: string): StepState {
    if (isError && phase === 'error') {
      // Find which step errored based on what was last active
      const phases = ['language-check', 'rendering', 'fetching', 'compiling', 'complete']
      const stepIdx = phases.indexOf(stepPhase)
      const progressIdx = progress?.current === 0 ? 0 : -1
      if (progressIdx >= 0 && stepIdx > 0) return 'pending'
      // Default: mark the first incomplete step as error
      return stepIdx === 0 && !languageCheckDone ? 'error' : 'pending'
    }

    const phases = ['language-check', 'rendering', 'fetching', 'compiling', 'complete']
    const currentIdx = phases.indexOf(phase)
    const stepIdx = phases.indexOf(stepPhase)

    if (phase === 'complete') return 'complete'
    if (stepIdx < currentIdx) return 'complete'
    if (stepIdx === currentIdx) return 'active'
    return 'pending'
  }

  // Step 1: Language check
  const step1State = languageCheckDone
    ? (phase === 'language-check' && isError ? 'error' : 'complete')
    : getStepState('language-check')
  const step1Detail = step1State === 'active'
    ? es.export.progressStep1Running
    : step1State === 'complete'
      ? es.export.progressStep1Complete
      : undefined

  // Step 2: PDF rendering
  const step2State = getStepState('rendering')
  const step2Detail = step2State === 'active' && progress
    ? es.export.progressStep2Running(progress.current, progress.total)
    : step2State === 'complete' && progress
      ? es.export.progressStep2Complete(progress.total || 0)
      : undefined

  // Step 3: Fetch uploads
  const step3State = getStepState('fetching')
  const step3Detail = step3State === 'active' && progress
    ? es.export.progressStep3Running(progress.current, progress.total)
    : step3State === 'complete' && progress
      ? es.export.progressStep3Complete(progress.total || 0)
      : undefined

  // Step 4: Compile ZIP
  const step4State = getStepState('compiling')
  const step4Detail = step4State === 'active'
    ? es.export.progressStep4Running
    : step4State === 'complete'
      ? es.export.progressStep4Complete
      : undefined

  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-1">
      <ExportProgressStep
        stepNumber={1}
        label={es.export.progressStep1Label}
        state={step1State}
        detail={step1Detail}
      />
      <ExportProgressStep
        stepNumber={2}
        label={es.export.progressStep2Label}
        state={step2State}
        detail={step2Detail}
        progress={
          step2State === 'active' && progress
            ? { current: progress.current, total: progress.total }
            : undefined
        }
      />
      <ExportProgressStep
        stepNumber={3}
        label={es.export.progressStep3Label}
        state={step3State}
        detail={step3Detail}
        progress={
          step3State === 'active' && progress
            ? { current: progress.current, total: progress.total }
            : undefined
        }
      />
      <ExportProgressStep
        stepNumber={4}
        label={es.export.progressStep4Label}
        state={step4State}
        detail={step4Detail}
      />
    </div>
  )
}
