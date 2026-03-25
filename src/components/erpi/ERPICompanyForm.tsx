import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { es } from '@/locales/es'

const companyFormSchema = z.object({
  razon_social: z.string(),
  rfc: z.string(),
  representante_legal: z.string(),
  domicilio_fiscal: z.string(),
  solicitudes_periodo_actual: z.coerce.number().int().min(0).default(0),
  domicilio_fuera_zmcm: z.boolean().default(false),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

interface ERPICompanyFormProps {
  defaultValues: CompanyFormData
  onSave: (data: Partial<CompanyFormData>) => void
}

export function ERPICompanyForm({ defaultValues, onSave }: ERPICompanyFormProps) {
  const { register, watch, reset, formState: { isDirty } } = useForm<CompanyFormData>({
    defaultValues,
  })

  // Reset form when external data loads
  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  // Watch for changes and auto-save — only after user edits (isDirty)
  useEffect(() => {
    if (!isDirty) return
    const subscription = watch((value) => {
      onSave(value as Partial<CompanyFormData>)
    })
    return () => subscription.unsubscribe()
  }, [watch, onSave, isDirty])

  return (
    <section className="space-y-4">
      <h2 className="text-[20px] font-semibold leading-[1.2]">
        {es.erpi.companySection}
      </h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="razon_social" className="text-[14px] font-semibold">
            Razon social
          </Label>
          <Input
            id="razon_social"
            {...register('razon_social')}
            placeholder="Nombre legal de la empresa"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rfc" className="text-[14px] font-semibold">
            RFC
          </Label>
          <Input
            id="rfc"
            {...register('rfc')}
            placeholder="XAXX010101000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="representante_legal" className="text-[14px] font-semibold">
            Representante legal
          </Label>
          <Input
            id="representante_legal"
            {...register('representante_legal')}
            placeholder="Nombre completo del representante"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="domicilio_fiscal" className="text-[14px] font-semibold">
            Domicilio fiscal
          </Label>
          <textarea
            id="domicilio_fiscal"
            {...register('domicilio_fiscal')}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-[14px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Calle, numero, colonia, alcaldia/municipio, estado, C.P."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="solicitudes_periodo_actual" className="text-[14px] font-semibold">
            {es.erpi.solicitudes_periodo_actual}
          </Label>
          <Input
            id="solicitudes_periodo_actual"
            type="number"
            min={0}
            max={3}
            {...register('solicitudes_periodo_actual', { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="domicilio_fuera_zmcm"
            type="checkbox"
            {...register('domicilio_fuera_zmcm')}
            className="h-4 w-4"
          />
          <Label htmlFor="domicilio_fuera_zmcm" className="text-[14px] font-semibold">
            {es.erpi.domicilio_fuera_zmcm}
          </Label>
        </div>
      </div>
    </section>
  )
}
