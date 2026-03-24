import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { MXNInput } from '@/components/common/MXNInput'
import { es } from '@/locales/es'
import {
  PERIODOS_EFICINE,
  CATEGORIAS_CINEMATOGRAFICAS,
  CATEGORIAS_DIRECTOR,
} from '@/lib/constants'
import { getProject, updateProjectMetadata } from '@/services/projects'
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator'

/**
 * Form schema for Screen 1 — Datos del Proyecto.
 * Uses the project schema structure but adapted for form with optional fields
 * since the form progressively fills. Validation on blur (mode: 'onTouched').
 */
const projectFormSchema = z
  .object({
    titulo_proyecto: z.string().min(1, 'El titulo es obligatorio').max(100),
    periodo_registro: z.enum(['2026-P1', '2026-P2'], {
      error: 'Selecciona un periodo',
    }),
    categoria_cinematografica: z.enum([...CATEGORIAS_CINEMATOGRAFICAS], {
      error: 'Selecciona una categoria',
    }),
    categoria_director: z.enum([...CATEGORIAS_DIRECTOR], {
      error: 'Selecciona una categoria de director',
    }),
    duracion_estimada_minutos: z.coerce
      .number({ error: 'Ingresa un numero valido' })
      .int()
      .min(60, 'La duracion minima es 60 minutos'),
    formato_filmacion: z.string().min(1, 'Ingresa el formato de filmacion'),
    relacion_aspecto: z.string().min(1, 'Ingresa la relacion de aspecto'),
    idiomas: z.string().min(1, 'Ingresa al menos un idioma'),
    costo_total_proyecto_centavos: z
      .number()
      .int()
      .positive('El costo total debe ser mayor a $0'),
    monto_solicitado_eficine_centavos: z
      .number()
      .int()
      .positive('El monto EFICINE debe ser mayor a $0')
      .max(2500000000, 'El monto maximo EFICINE es $25,000,000 MXN'),
    es_coproduccion_internacional: z.boolean(),
    // Co-production conditional fields
    tipo_cambio_fx: z.coerce.number().positive().optional(),
    fecha_tipo_cambio: z.string().optional(),
    desglose_nacional_pct: z.coerce.number().min(0).max(100).optional(),
    desglose_extranjero_pct: z.coerce.number().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.es_coproduccion_internacional) {
        return (
          data.tipo_cambio_fx !== undefined &&
          data.tipo_cambio_fx > 0 &&
          data.fecha_tipo_cambio !== undefined &&
          data.fecha_tipo_cambio.length > 0
        )
      }
      return true
    },
    {
      message:
        'Coproduccion internacional requiere tipo de cambio y fecha de tipo de cambio',
      path: ['tipo_cambio_fx'],
    },
  )

type ProjectFormData = z.infer<typeof projectFormSchema>

interface ProjectSetupProps {
  projectId: string
}

/**
 * Screen 1: Datos del Proyecto
 * All project metadata fields with Zod validation, period selector,
 * co-production toggle with conditional fields, MXN formatting on blur.
 * Auto-saves to Firestore on every form change.
 */
export function ProjectSetup({ projectId }: ProjectSetupProps) {
  const [searchParams] = useSearchParams()
  const highlightField = searchParams.get('highlight')
  const [highlightActive, setHighlightActive] = useState(false)
  const highlightRef = useRef<HTMLElement | null>(null)

  // Field highlight from "Ir al campo" navigation
  useEffect(() => {
    if (highlightField) {
      setHighlightActive(true)
      // Find the field by id
      const el = document.getElementById(highlightField)
      if (el) {
        highlightRef.current = el.closest('[data-field]') as HTMLElement | null
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      const timer = setTimeout(() => setHighlightActive(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightField])

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const save = useCallback(
    (formValues: ProjectFormData) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus('saving')
        try {
          await updateProjectMetadata(projectId, {
            titulo_proyecto: formValues.titulo_proyecto,
            periodo_registro: formValues.periodo_registro,
            categoria_cinematografica: formValues.categoria_cinematografica,
            categoria_director: formValues.categoria_director,
            duracion_estimada_minutos: formValues.duracion_estimada_minutos,
            formato_filmacion: formValues.formato_filmacion,
            relacion_aspecto: formValues.relacion_aspecto,
            idiomas: formValues.idiomas
              ? formValues.idiomas.split(',').map((s) => s.trim()).filter(Boolean)
              : [],
            costo_total_proyecto_centavos: formValues.costo_total_proyecto_centavos,
            monto_solicitado_eficine_centavos: formValues.monto_solicitado_eficine_centavos,
            es_coproduccion_internacional: formValues.es_coproduccion_internacional,
            tipo_cambio_fx: formValues.tipo_cambio_fx,
            fecha_tipo_cambio: formValues.fecha_tipo_cambio,
          })
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 3000)
        } catch (err) {
          console.error('[ProjectSetup] Save failed:', err)
          setSaveStatus('error')
        }
      }, 1500)
    },
    [projectId],
  )

  const {
    register,
    control,
    watch,
    reset,
    formState: { errors, touchedFields },
  } = useForm<ProjectFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(projectFormSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      titulo_proyecto: '',
      periodo_registro: undefined,
      categoria_cinematografica: undefined,
      categoria_director: undefined,
      duracion_estimada_minutos: undefined as unknown as number,
      formato_filmacion: '',
      relacion_aspecto: '',
      idiomas: '',
      costo_total_proyecto_centavos: 0,
      monto_solicitado_eficine_centavos: 0,
      es_coproduccion_internacional: false,
      tipo_cambio_fx: undefined,
      fecha_tipo_cambio: '',
      desglose_nacional_pct: undefined,
      desglose_extranjero_pct: undefined,
    },
  })

  /**
   * Load saved metadata from Firestore on mount and hydrate the form.
   * This ensures that after a page refresh, previously-saved values
   * are visible in the form instead of blank defaults.
   */
  useEffect(() => {
    let cancelled = false
    getProject(projectId).then((project) => {
      if (cancelled || !project?.metadata) return
      const m = project.metadata
      reset({
        titulo_proyecto: m.titulo_proyecto ?? '',
        periodo_registro: (m.periodo_registro as ProjectFormData['periodo_registro']) ?? undefined,
        categoria_cinematografica:
          (m.categoria_cinematografica as ProjectFormData['categoria_cinematografica']) ?? undefined,
        categoria_director:
          (m.categoria_director as ProjectFormData['categoria_director']) ?? undefined,
        duracion_estimada_minutos: m.duracion_estimada_minutos ?? (undefined as unknown as number),
        formato_filmacion: m.formato_filmacion ?? '',
        relacion_aspecto: m.relacion_aspecto ?? '',
        idiomas: Array.isArray(m.idiomas) ? m.idiomas.join(', ') : m.idiomas ?? '',
        costo_total_proyecto_centavos: m.costo_total_proyecto_centavos ?? 0,
        monto_solicitado_eficine_centavos: m.monto_solicitado_eficine_centavos ?? 0,
        es_coproduccion_internacional: m.es_coproduccion_internacional ?? false,
        tipo_cambio_fx: m.tipo_cambio_fx,
        fecha_tipo_cambio: m.fecha_tipo_cambio ?? '',
        desglose_nacional_pct: undefined,
        desglose_extranjero_pct: undefined,
      })
    }).catch((err) => {
      console.error('[ProjectSetup] Failed to load project metadata:', err)
    })
    return () => { cancelled = true }
  }, [projectId, reset])

  const isCoproduction = watch('es_coproduccion_internacional')
  const formValues = watch()

  // Auto-save on form changes (only when title is present)
  useEffect(() => {
    if (formValues.titulo_proyecto) {
      save(formValues)
    }
  }, [JSON.stringify(formValues)]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [])

  return (
    <div className="space-y-6">
      {/* Screen title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{es.screen1.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {es.screen1.emptyState}
          </p>
        </div>
        <AutoSaveIndicator status={saveStatus} />
      </div>

      <Separator />

      {/* 1. Titulo del proyecto */}
      <div
        data-field="titulo_proyecto"
        className={`space-y-1.5 transition-all duration-300 rounded-md ${
          highlightField === 'titulo_proyecto' && highlightActive
            ? 'ring-2 ring-primary/50 p-2 -m-2'
            : ''
        }`}
      >
        <Label htmlFor="titulo_proyecto">{es.screen1.titleLabel}</Label>
        <Input
          id="titulo_proyecto"
          {...register('titulo_proyecto')}
          placeholder="Ingresa el titulo de tu proyecto"
          maxLength={100}
        />
        {errors.titulo_proyecto && touchedFields.titulo_proyecto && (
          <p className="text-sm text-destructive">
            {errors.titulo_proyecto.message}
          </p>
        )}
      </div>

      {/* 2. Periodo de registro EFICINE */}
      <div className="space-y-1.5">
        <Label>{es.screen1.periodLabel}</Label>
        <Controller
          name="periodo_registro"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIODOS_EFICINE).map(([key, period]) => (
                  <SelectItem key={key} value={key}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.periodo_registro && touchedFields.periodo_registro && (
          <p className="text-sm text-destructive">
            {errors.periodo_registro.message}
          </p>
        )}
      </div>

      {/* 3. Categoria cinematografica */}
      <div className="space-y-1.5">
        <Label>{es.screen1.categoryLabel}</Label>
        <Controller
          name="categoria_cinematografica"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_CINEMATOGRAFICAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoria_cinematografica &&
          touchedFields.categoria_cinematografica && (
            <p className="text-sm text-destructive">
              {errors.categoria_cinematografica.message}
            </p>
          )}
      </div>

      {/* 4. Categoria del director */}
      <div className="space-y-1.5">
        <Label>{es.screen1.directorCategoryLabel}</Label>
        <Controller
          name="categoria_director"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_DIRECTOR.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoria_director && touchedFields.categoria_director && (
          <p className="text-sm text-destructive">
            {errors.categoria_director.message}
          </p>
        )}
      </div>

      {/* 5. Duracion estimada */}
      <div className="space-y-1.5">
        <Label htmlFor="duracion_estimada_minutos">
          {es.screen1.durationLabel}
        </Label>
        <Input
          id="duracion_estimada_minutos"
          type="number"
          min={60}
          {...register('duracion_estimada_minutos')}
          placeholder="90"
        />
        {errors.duracion_estimada_minutos &&
          touchedFields.duracion_estimada_minutos && (
            <p className="text-sm text-destructive">
              {errors.duracion_estimada_minutos.message}
            </p>
          )}
      </div>

      {/* 6. Formato de filmacion */}
      <div className="space-y-1.5">
        <Label htmlFor="formato_filmacion">{es.screen1.formatLabel}</Label>
        <Input
          id="formato_filmacion"
          {...register('formato_filmacion')}
          placeholder="Digital, 35mm, etc."
        />
        {errors.formato_filmacion && touchedFields.formato_filmacion && (
          <p className="text-sm text-destructive">
            {errors.formato_filmacion.message}
          </p>
        )}
      </div>

      {/* 7. Relacion de aspecto */}
      <div className="space-y-1.5">
        <Label htmlFor="relacion_aspecto">{es.screen1.aspectRatioLabel}</Label>
        <Input
          id="relacion_aspecto"
          {...register('relacion_aspecto')}
          placeholder="2.39:1, 1.85:1, etc."
        />
        {errors.relacion_aspecto && touchedFields.relacion_aspecto && (
          <p className="text-sm text-destructive">
            {errors.relacion_aspecto.message}
          </p>
        )}
      </div>

      {/* 8. Idiomas */}
      <div className="space-y-1.5">
        <Label htmlFor="idiomas">{es.screen1.languagesLabel}</Label>
        <Input
          id="idiomas"
          {...register('idiomas')}
          placeholder="Espanol, Nahuatl, Ingles"
        />
        <p className="text-xs text-muted-foreground">
          Separa los idiomas con comas
        </p>
        {errors.idiomas && touchedFields.idiomas && (
          <p className="text-sm text-destructive">{errors.idiomas.message}</p>
        )}
      </div>

      {/* 9. Costo total del proyecto */}
      <Controller
        name="costo_total_proyecto_centavos"
        control={control}
        render={({ field }) => (
          <MXNInput
            label={es.screen1.totalBudgetLabel}
            value={field.value}
            onChange={field.onChange}
            error={
              errors.costo_total_proyecto_centavos &&
              touchedFields.costo_total_proyecto_centavos
                ? errors.costo_total_proyecto_centavos.message
                : undefined
            }
          />
        )}
      />

      {/* 10. Monto solicitado EFICINE */}
      <Controller
        name="monto_solicitado_eficine_centavos"
        control={control}
        render={({ field }) => (
          <MXNInput
            label={es.screen1.eficineAmountLabel}
            value={field.value}
            onChange={field.onChange}
            error={
              errors.monto_solicitado_eficine_centavos &&
              touchedFields.monto_solicitado_eficine_centavos
                ? errors.monto_solicitado_eficine_centavos.message
                : undefined
            }
          />
        )}
      />

      <Separator />

      {/* 11. Coproduccion internacional toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="coproduccion">
              {es.screen1.coproductionToggle}
            </Label>
            <p className="text-xs text-muted-foreground">
              {es.screen1.coproductionHint}
            </p>
          </div>
          <Controller
            name="es_coproduccion_internacional"
            control={control}
            render={({ field }) => (
              <Switch
                id="coproduccion"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Co-production conditional fields */}
        {isCoproduction && (
          <div className="space-y-4 rounded-md border p-4 bg-muted/30">
            {/* Tipo de cambio FX */}
            <div className="space-y-1.5">
              <Label htmlFor="tipo_cambio_fx">Tipo de cambio FX</Label>
              <Input
                id="tipo_cambio_fx"
                type="number"
                step="0.01"
                {...register('tipo_cambio_fx')}
                placeholder="17.50"
              />
              {errors.tipo_cambio_fx && (
                <p className="text-sm text-destructive">
                  {errors.tipo_cambio_fx.message}
                </p>
              )}
            </div>

            {/* Fecha del tipo de cambio */}
            <div className="space-y-1.5">
              <Label htmlFor="fecha_tipo_cambio">
                Fecha del tipo de cambio
              </Label>
              <Input
                id="fecha_tipo_cambio"
                type="date"
                {...register('fecha_tipo_cambio')}
              />
              <p className="text-xs text-muted-foreground">Formato: DD/MM/AAAA</p>
              {errors.fecha_tipo_cambio && (
                <p className="text-sm text-destructive">
                  {errors.fecha_tipo_cambio.message}
                </p>
              )}

            </div>

            {/* Desglose territorial */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="desglose_nacional_pct">
                  % Nacional
                </Label>
                <Input
                  id="desglose_nacional_pct"
                  type="number"
                  min={0}
                  max={100}
                  {...register('desglose_nacional_pct')}
                  placeholder="60"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desglose_extranjero_pct">
                  % Extranjero
                </Label>
                <Input
                  id="desglose_extranjero_pct"
                  type="number"
                  min={0}
                  max={100}
                  {...register('desglose_extranjero_pct')}
                  placeholder="40"
                />
              </div>
            </div>

            {/* Certificado IMCINE placeholder */}
            <div className="space-y-1.5">
              <Label>Certificado IMCINE de coproduccion</Label>
              <p className="text-xs text-muted-foreground">
                Sube el certificado en la pantalla de Documentos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
