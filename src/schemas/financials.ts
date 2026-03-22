import { z } from 'zod'
import { TIPOS_APORTANTE } from '@/lib/constants'

export const terceroSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(TIPOS_APORTANTE),
  monto_centavos: z.number().int().positive(),
  efectivo_o_especie: z.enum(['efectivo', 'especie']),
})

export type Tercero = z.infer<typeof terceroSchema>

export const financialsSchema = z.object({
  aportacion_erpi_efectivo_centavos: z.number().int().nonnegative(),
  aportacion_erpi_especie_centavos: z.number().int().nonnegative(),
  terceros: z.array(terceroSchema),
  monto_eficine_centavos: z.number().int().nonnegative(),
  tiene_gestor: z.boolean().default(false),
  gestor_nombre: z.string().optional(),
  gestor_monto_centavos: z.number().int().nonnegative().optional(),
})

export type Financials = z.infer<typeof financialsSchema>
