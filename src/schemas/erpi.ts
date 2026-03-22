import { z } from 'zod'

export const proyectoPrevioSchema = z.object({
  titulo: z.string().min(1),
  anio: z.number().int(),
  monto_recibido_centavos: z.number().int().optional(),
  exhibido: z.boolean(),
  estatus: z.enum(['exhibido', 'en_produccion', 'no_exhibido']),
})

export type ProyectoPrevio = z.infer<typeof proyectoPrevioSchema>

export const erpiSettingsSchema = z.object({
  razon_social: z.string().min(1),
  rfc: z.string().min(1),
  representante_legal: z.string().min(1),
  domicilio_fiscal: z.string().min(1),
  proyectos_previos_eficine: z.array(proyectoPrevioSchema).default([]),
})

export type ERPISettings = z.infer<typeof erpiSettingsSchema>
