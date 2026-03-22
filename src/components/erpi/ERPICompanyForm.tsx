import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { es } from '@/locales/es'

const companyFormSchema = z.object({
  razon_social: z.string(),
  rfc: z.string(),
  representante_legal: z.string(),
  domicilio_fiscal: z.string(),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

interface ERPICompanyFormProps {
  defaultValues: CompanyFormData
  onSave: (data: Partial<CompanyFormData>) => void
}

export function ERPICompanyForm({ defaultValues, onSave }: ERPICompanyFormProps) {
  const { register, watch, reset } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
  })

  // Reset form when external data loads
  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  // Watch all fields for auto-save
  useEffect(() => {
    const subscription = watch((value) => {
      onSave(value as Partial<CompanyFormData>)
    })
    return () => subscription.unsubscribe()
  }, [watch, onSave])

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
      </div>
    </section>
  )
}
