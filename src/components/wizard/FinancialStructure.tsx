import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { MXNInput } from '@/components/common/MXNInput'
import { CompliancePanel } from '@/components/common/CompliancePanel'
import { ContributorRow } from '@/components/wizard/ContributorRow'
import { useAutoSave } from '@/hooks/useAutoSave'
import {
  calculateCompliance,
  type ComplianceResult,
} from '@/hooks/useCompliance'
import { financialsSchema, type Financials, type Tercero } from '@/schemas/financials'
import type { TeamMember } from '@/schemas/team'
import { formatMXN } from '@/lib/format'
import { es } from '@/locales/es'

interface FinancialStructureProps {
  projectId: string
}

const defaultFinancials: Financials = {
  aportacion_erpi_efectivo_centavos: 0,
  aportacion_erpi_especie_centavos: 0,
  terceros: [],
  monto_eficine_centavos: 0,
  tiene_gestor: false,
}

const emptyCompliance: ComplianceResult = {
  erpiPct: 0,
  eficinePct: 0,
  federalPct: 0,
  screenwriterPct: 0,
  inkindPct: 0,
  gestorPct: 0,
  eficineMonto: 0,
  violations: [],
}

/**
 * Screen 4 (Estructura Financiera): Financial structure form with compliance panel.
 * Layout: form area (flex-1) + 280px compliance panel.
 * Queries team subcollection for in-kind totals and screenwriter fee.
 * Per INTK-07, D-14 through D-22.
 */
export function FinancialStructure({ projectId }: FinancialStructureProps) {
  const [loaded, setLoaded] = useState(false)
  const [totalBudgetCentavos, setTotalBudgetCentavos] = useState(0)
  const [eficineCentavos, setEficineCentavos] = useState(0)
  const [categoriaCinematografica, setCategoriaCinematografica] = useState('')
  const [esCoproduccion, setEsCoproduccion] = useState(false)
  const [tipoCambioFx, setTipoCambioFx] = useState<number | undefined>()

  // Team data for compliance calculation
  const [totalInkindHonorariosCentavos, setTotalInkindHonorariosCentavos] =
    useState(0)
  const [screenwriterFeeCentavos, setScreenwriterFeeCentavos] = useState(0)

  const { save } = useAutoSave(projectId, 'financials')

  const {
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Financials>({
    resolver: zodResolver(financialsSchema),
    defaultValues: defaultFinancials,
    mode: 'onTouched',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'terceros',
  })

  // Load financial data and project metadata
  useEffect(() => {
    async function loadData() {
      try {
        // Load financials
        const finRef = doc(db, `projects/${projectId}/financials`)
        const finSnap = await getDoc(finRef)
        if (finSnap.exists()) {
          const raw = finSnap.data()
          const parsed = financialsSchema.safeParse(raw)
          if (parsed.success) {
            reset(parsed.data)
          }
        }

        // Load project metadata for budget, EFICINE amount, category, co-production
        const metaRef = doc(db, `projects/${projectId}/metadata`)
        const metaSnap = await getDoc(metaRef)
        if (metaSnap.exists()) {
          const meta = metaSnap.data()
          setTotalBudgetCentavos(meta.costo_total_proyecto_centavos || 0)
          setEficineCentavos(meta.monto_solicitado_eficine_centavos || 0)
          setCategoriaCinematografica(meta.categoria_cinematografica || '')
          setEsCoproduccion(meta.es_coproduccion_internacional || false)
          setTipoCambioFx(meta.tipo_cambio_fx)
          // Set read-only EFICINE amount in form
          setValue('monto_eficine_centavos', meta.monto_solicitado_eficine_centavos || 0)
        }

        // Query team subcollection for in-kind totals and screenwriter fee
        const teamCol = collection(db, `projects/${projectId}/team`)
        const teamSnap = await getDocs(teamCol)
        let inkindTotal = 0
        let screenwriterFee = 0
        teamSnap.docs.forEach((teamDoc) => {
          const member = teamDoc.data() as Partial<TeamMember>
          inkindTotal += member.aportacion_especie_centavos || 0
          if (member.cargo === 'Guionista') {
            screenwriterFee = member.honorarios_centavos || 0
          }
        })
        setTotalInkindHonorariosCentavos(inkindTotal)
        setScreenwriterFeeCentavos(screenwriterFee)
      } catch {
        // First load, no data yet
      }
      setLoaded(true)
    }
    loadData()
  }, [projectId, reset, setValue])

  // Watch all form values for real-time compliance per PITFALL 5
  const watchedValues = watch()

  // Calculate compliance from CURRENT form values (not Firestore)
  const compliance: ComplianceResult = useMemo(() => {
    if (totalBudgetCentavos === 0) return emptyCompliance

    const thirdPartyCentavos = (watchedValues.terceros || []).reduce(
      (sum, t) => sum + (t.monto_centavos || 0),
      0,
    )

    return calculateCompliance(
      totalBudgetCentavos,
      watchedValues.aportacion_erpi_efectivo_centavos || 0,
      watchedValues.aportacion_erpi_especie_centavos || 0,
      thirdPartyCentavos,
      eficineCentavos,
      0, // otherFederalCentavos -- no field for this yet
      screenwriterFeeCentavos,
      totalInkindHonorariosCentavos,
      watchedValues.gestor_monto_centavos || 0,
    )
  }, [
    watchedValues,
    totalBudgetCentavos,
    eficineCentavos,
    screenwriterFeeCentavos,
    totalInkindHonorariosCentavos,
  ])

  // Auto-save on value changes
  useEffect(() => {
    if (!loaded) return
    const timeout = setTimeout(() => {
      save(watchedValues as unknown as Record<string, unknown>)
    }, 500)
    return () => clearTimeout(timeout)
  }, [watchedValues, save, loaded])

  // Gestor hint based on category
  const gestorHint =
    categoriaCinematografica === 'Ficcion'
      ? es.screen4.gestorHintFiction
      : es.screen4.gestorHintDocAnim

  const addContributor = useCallback(() => {
    append({
      nombre: '',
      tipo: 'Donante',
      monto_centavos: 0,
      efectivo_o_especie: 'efectivo',
    })
  }, [append])

  if (!loaded) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{es.screen4.title}</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{es.screen4.title}</h1>

      {/* Main layout: form + compliance panel */}
      <div className="flex gap-6">
        {/* Form area */}
        <div className="flex-1 space-y-6">
          {/* Section 1: Aportacion ERPI */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{es.screen4.erpiSection}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="aportacion_erpi_efectivo_centavos"
                render={({ field }) => (
                  <MXNInput
                    label={es.screen4.cashLabel}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.aportacion_erpi_efectivo_centavos?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="aportacion_erpi_especie_centavos"
                render={({ field }) => (
                  <MXNInput
                    label={es.screen4.inkindLabel}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.aportacion_erpi_especie_centavos?.message}
                  />
                )}
              />
            </div>
          </section>

          <Separator />

          {/* Section 2: Aportantes Terceros */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {es.screen4.thirdPartySection}
              </h2>
              <Button variant="outline" size="sm" onClick={addContributor}>
                {es.screen4.addContributor}
              </Button>
            </div>
            {fields.map((field, index) => (
              <Controller
                key={field.id}
                control={control}
                name={`terceros.${index}`}
                render={({ field: controllerField }) => (
                  <ContributorRow
                    value={controllerField.value}
                    onChange={controllerField.onChange}
                    onRemove={() => remove(index)}
                  />
                )}
              />
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin aportantes terceros. Haz clic en &quot;{es.screen4.addContributor}&quot; para agregar.
              </p>
            )}
          </section>

          <Separator />

          {/* Section 3: Estimulo EFICINE (read-only) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Estimulo EFICINE</h2>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">
                Monto solicitado (definido en Datos del Proyecto)
              </p>
              <p className="text-lg font-semibold">
                {formatMXN(eficineCentavos)}
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 4: In-kind Total (read-only, from team subcollection) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              Total aportaciones en especie (calculado del equipo creativo)
            </h2>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-lg font-semibold">
                {formatMXN(totalInkindHonorariosCentavos)}
              </p>
              <p className="text-xs text-muted-foreground">
                Suma de aportaciones en especie de todos los miembros del equipo
                (Pantalla 3)
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 5: Gestor de Recursos */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="tiene_gestor"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>{es.screen4.gestorToggle}</Label>
            </div>

            {watchedValues.tiene_gestor && (
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="space-y-1.5">
                  <Label>Nombre del gestor</Label>
                  <Controller
                    control={control}
                    name="gestor_nombre"
                    render={({ field }) => (
                      <Input
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Nombre del gestor de recursos"
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name="gestor_monto_centavos"
                  render={({ field }) => (
                    <MXNInput
                      label="Honorarios del gestor"
                      value={field.value || 0}
                      onChange={field.onChange}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">{gestorHint}</p>
              </div>
            )}
          </section>

          {/* Section 6: Co-production fields (conditional) per D-18, INTK-11 */}
          {esCoproduccion && (
            <>
              <Separator />
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">
                  Coproduccion Internacional
                </h2>
                <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tipo de cambio
                    </span>
                    <span className="text-sm font-semibold">
                      {tipoCambioFx
                        ? `$${tipoCambioFx.toFixed(2)} MXN/USD`
                        : 'No definido'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El tipo de cambio se define en Datos del Proyecto (Pantalla
                    1).
                  </p>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Compliance Panel -- 280px fixed right */}
        <CompliancePanel result={compliance} />
      </div>
    </div>
  )
}
