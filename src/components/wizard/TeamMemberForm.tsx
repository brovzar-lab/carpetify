import { useEffect, useRef, useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, ChevronRight, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
import { HyperlinkVerifier } from '@/components/validation/HyperlinkVerifier'
import { es } from '@/locales/es'
import { CARGOS_EQUIPO } from '@/lib/constants'

const filmographyEntryFormSchema = z.object({
  titulo: z.string().min(1, 'Ingresa el titulo de la obra'),
  anio: z.coerce
    .number({ error: 'Ingresa un ano valido' })
    .int()
    .min(1900)
    .max(2030),
  cargo_en_obra: z.string().min(1, 'Ingresa el cargo'),
  formato: z.string().optional(),
  exhibicion: z.string().optional(),
  enlace: z.string().url('Ingresa una URL valida').optional().or(z.literal('')),
})

const teamMemberFormSchema = z
  .object({
    nombre_completo: z.string().min(1, 'El nombre es obligatorio'),
    cargo: z.enum([...CARGOS_EQUIPO], {
      error: 'Selecciona un cargo',
    }),
    nacionalidad: z.string().min(1, 'Ingresa la nacionalidad'),
    honorarios_centavos: z.number().int().nonnegative(),
    aportacion_especie_centavos: z.number().int().nonnegative(),
    es_socio_erpi: z.boolean().optional(),
    filmografia: z.array(filmographyEntryFormSchema),
  })
  .refine(
    (data) =>
      data.aportacion_especie_centavos <= data.honorarios_centavos * 0.5,
    {
      message:
        'La aportación en especie no puede exceder el 50% de los honorarios',
      path: ['aportacion_especie_centavos'],
    },
  )

export type TeamMemberFormData = z.infer<typeof teamMemberFormSchema>

interface TeamMemberFormProps {
  index: number
  defaultValues?: Partial<TeamMemberFormData>
  onSave: (data: TeamMemberFormData) => void
  onRemove: () => void
}

/**
 * Collapsible form for a single team member.
 * Header shows name + role (or "Nuevo miembro" if empty).
 * Includes filmography entries with dynamic add/remove.
 */
export function TeamMemberForm({
  index,
  defaultValues,
  onSave,
  onRemove,
}: TeamMemberFormProps) {
  const [searchParams] = useSearchParams()
  const highlightField = searchParams.get('highlight')
  const highlightMember = searchParams.get('member')
  const isTargetMember = highlightMember === String(index)
  const [highlightActive, setHighlightActive] = useState(false)
  const memberRef = useRef<HTMLDivElement | null>(null)
  const highlightFieldRef = useRef<HTMLDivElement | null>(null)

  // Auto-expand and highlight if this member is targeted by "Ir al campo"
  useEffect(() => {
    if (isTargetMember && highlightField) {
      setHighlightActive(true)
      setExpanded(true)
      // Scroll into view after expanding
      const timer = setTimeout(() => {
        const target = highlightFieldRef.current || memberRef.current
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      const fadeTimer = setTimeout(() => setHighlightActive(false), 3000)
      return () => {
        clearTimeout(timer)
        clearTimeout(fadeTimer)
      }
    }
  }, [isTargetMember, highlightField])

  const [expanded, setExpanded] = useState(!defaultValues?.nombre_completo)

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(teamMemberFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      nombre_completo: '',
      cargo: undefined,
      nacionalidad: '',
      honorarios_centavos: 0,
      aportacion_especie_centavos: 0,
      es_socio_erpi: false,
      filmografia: [],
      ...defaultValues,
    },
  })

  const {
    fields: filmographyFields,
    append: appendFilmography,
    remove: removeFilmography,
  } = useFieldArray({
    control,
    name: 'filmografia',
  })

  const nombre = watch('nombre_completo')
  const cargo = watch('cargo')
  const formValues = watch()

  // Auto-save on form changes
  useEffect(() => {
    if (nombre) {
      onSave(formValues)
    }
  }, [JSON.stringify(formValues)]) // eslint-disable-line react-hooks/exhaustive-deps

  const headerLabel =
    nombre && cargo ? `${nombre} — ${cargo}` : nombre || 'Nuevo miembro'

  return (
    <div
      ref={memberRef}
      className={`rounded-md border bg-card transition-all duration-300 ${
        isTargetMember && highlightActive ? 'ring-2 ring-primary/50' : ''
      }`}
    >
      {/* Collapsible header */}
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{headerLabel}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </button>

      {expanded && (
        <div className="space-y-4 border-t px-4 pb-4 pt-4">
          {/* 1. Cargo */}
          <div className="space-y-1.5">
            <Label>Cargo</Label>
            <Controller
              name="cargo"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGOS_EQUIPO.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cargo && (
              <p className="text-sm text-destructive">
                {errors.cargo.message}
              </p>
            )}
          </div>

          {/* 2. Nombre completo */}
          <div className="space-y-1.5">
            <Label htmlFor={`nombre-${index}`}>Nombre completo</Label>
            <Input
              id={`nombre-${index}`}
              {...register('nombre_completo')}
              placeholder="Nombre del miembro del equipo"
            />
            {errors.nombre_completo && (
              <p className="text-sm text-destructive">
                {errors.nombre_completo.message}
              </p>
            )}
          </div>

          {/* 3. Nacionalidad */}
          <div className="space-y-1.5">
            <Label htmlFor={`nacionalidad-${index}`}>Nacionalidad</Label>
            <Input
              id={`nacionalidad-${index}`}
              {...register('nacionalidad')}
              placeholder="Mexicana"
            />
            {errors.nacionalidad && (
              <p className="text-sm text-destructive">
                {errors.nacionalidad.message}
              </p>
            )}
          </div>

          {/* 4. Honorarios */}
          <Controller
            name="honorarios_centavos"
            control={control}
            render={({ field }) => (
              <MXNInput
                label={es.screen3.feeLabel}
                value={field.value}
                onChange={field.onChange}
                error={errors.honorarios_centavos?.message}
              />
            )}
          />

          {/* 5. Aportacion en especie */}
          <Controller
            name="aportacion_especie_centavos"
            control={control}
            render={({ field }) => (
              <MXNInput
                label={es.screen3.inkindLabel}
                value={field.value}
                onChange={field.onChange}
                error={errors.aportacion_especie_centavos?.message}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            {es.screen3.inkindHint}
          </p>

          {/* 6. Es socio ERPI (only for Productor) */}
          {cargo === 'Productor' && (
            <div className="flex items-center justify-between">
              <Label htmlFor={`socio-erpi-${index}`}>
                Es socio ERPI
              </Label>
              <Controller
                name="es_socio_erpi"
                control={control}
                render={({ field }) => (
                  <Switch
                    id={`socio-erpi-${index}`}
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          <Separator />

          {/* 7. Filmografia */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              {es.screen3.filmographySection}
            </h3>

            {filmographyFields.map((fld, fIdx) => (
              <div
                key={fld.id}
                className="space-y-3 rounded-md border p-3 bg-muted/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Obra {fIdx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilmography(fIdx)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Titulo</Label>
                    <Input
                      {...register(`filmografia.${fIdx}.titulo`)}
                      placeholder="Titulo de la obra"
                      className="h-8 text-sm"
                    />
                    {errors.filmografia?.[fIdx]?.titulo && (
                      <p className="text-xs text-destructive">
                        {errors.filmografia[fIdx]?.titulo?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ano</Label>
                    <Input
                      type="number"
                      {...register(`filmografia.${fIdx}.anio`)}
                      placeholder="2024"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Cargo en la obra</Label>
                  <Input
                    {...register(`filmografia.${fIdx}.cargo_en_obra`)}
                    placeholder="Director, Productor, etc."
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Formato</Label>
                    <Input
                      {...register(`filmografia.${fIdx}.formato`)}
                      placeholder="Largometraje"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Exhibicion</Label>
                    <Input
                      {...register(`filmografia.${fIdx}.exhibicion`)}
                      placeholder="Festival, salas, VOD"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div
                  className="space-y-1"
                  ref={
                    isTargetMember && highlightField === 'enlace'
                      ? highlightFieldRef
                      : undefined
                  }
                >
                  <Label className="text-xs">Enlace (URL)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      {...register(`filmografia.${fIdx}.enlace`)}
                      placeholder="https://..."
                      className="h-8 text-sm flex-1"
                    />
                    <HyperlinkVerifier
                      url={watch(`filmografia.${fIdx}.enlace`) || ''}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendFilmography({
                  titulo: '',
                  anio: new Date().getFullYear(),
                  cargo_en_obra: '',
                  formato: '',
                  exhibicion: '',
                  enlace: '',
                })
              }
              className="w-full"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {es.screen3.addFilmographyEntry}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
