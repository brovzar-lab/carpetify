import { useCallback, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { getERPISettings, updateERPISettings } from '@/services/erpi'
import { es } from '@/locales/es'
import { ERPICompanyForm } from './ERPICompanyForm'
import { PriorProjectsList } from './PriorProjectsList'
import type { ERPISettings } from '@/schemas/erpi'
import type { ProyectoPrevio } from '@/schemas/erpi'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Auto-save hook for ERPI settings (global singleton, not per-project).
 * Mirrors the useAutoSave pattern with 1500ms debounce.
 */
function useAutoSaveERPI() {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const retriesRef = useRef(0)
  const maxRetries = 3

  const doSave = useCallback(async (data: Partial<ERPISettings>) => {
    setStatus('saving')
    try {
      await updateERPISettings(data)
      setStatus('saved')
      retriesRef.current = 0
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 3000)
    } catch {
      retriesRef.current += 1
      if (retriesRef.current < maxRetries) {
        setStatus('error')
        const backoff = Math.pow(2, retriesRef.current) * 1000
        setTimeout(() => doSave(data), backoff)
      } else {
        setStatus('error')
      }
    }
  }, [])

  const save = useCallback(
    (data: Partial<ERPISettings>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => doSave(data), 1500)
    },
    [doSave],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { save, status }
}

const EMPTY_DEFAULTS: ERPISettings = {
  razon_social: '',
  rfc: '',
  representante_legal: '',
  domicilio_fiscal: '',
  proyectos_previos_eficine: [],
  solicitudes_periodo_actual: 0,
  domicilio_fuera_zmcm: false,
}

export function ERPISettingsPage() {
  const queryClient = useQueryClient()
  const { save, status } = useAutoSaveERPI()

  const { data: settings } = useQuery({
    queryKey: ['erpi-settings'],
    queryFn: getERPISettings,
  })

  const currentSettings = settings ?? EMPTY_DEFAULTS

  const handleCompanySave = useCallback(
    (data: Partial<ERPISettings>) => {
      save(data)
      queryClient.setQueryData(['erpi-settings'], (old: ERPISettings | null) => ({
        ...(old ?? EMPTY_DEFAULTS),
        ...data,
      }))
    },
    [save, queryClient],
  )

  const handlePriorProjectsChange = useCallback(
    (projects: ProyectoPrevio[]) => {
      const update = { proyectos_previos_eficine: projects }
      save(update)
      queryClient.setQueryData(['erpi-settings'], (old: ERPISettings | null) => ({
        ...(old ?? EMPTY_DEFAULTS),
        ...update,
      }))
    },
    [save, queryClient],
  )

  const statusLabel =
    status === 'saving'
      ? es.autoSave.saving
      : status === 'saved'
        ? es.autoSave.saved
        : status === 'error'
          ? es.autoSave.error
          : null

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[800px] px-6 py-8">
        {/* Back link + status */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {es.wizard.backToDashboard}
          </Link>
          {statusLabel && (
            <span className="text-[14px] text-muted-foreground">
              {statusLabel}
            </span>
          )}
        </div>

        {/* Title + description */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold leading-[1.2]">
            {es.erpi.title}
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {es.erpi.description}
          </p>
        </div>

        {/* Company form */}
        <ERPICompanyForm
          defaultValues={{
            razon_social: currentSettings.razon_social ?? '',
            rfc: currentSettings.rfc ?? '',
            representante_legal: currentSettings.representante_legal ?? '',
            domicilio_fiscal: currentSettings.domicilio_fiscal ?? '',
            solicitudes_periodo_actual: currentSettings.solicitudes_periodo_actual ?? 0,
            domicilio_fuera_zmcm: currentSettings.domicilio_fuera_zmcm ?? false,
          }}
          onSave={handleCompanySave}
        />

        <Separator className="my-8" />

        {/* Prior projects */}
        <PriorProjectsList
          projects={currentSettings.proyectos_previos_eficine ?? []}
          onChange={handlePriorProjectsChange}
        />
      </div>
    </div>
  )
}
