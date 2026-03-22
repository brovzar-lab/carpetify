import { z } from 'zod'
import { CARGOS_EQUIPO } from '@/lib/constants'

export const filmographyEntrySchema = z.object({
  titulo: z.string().min(1),
  anio: z.number().int().min(1900).max(2030),
  cargo_en_obra: z.string().min(1),
  formato: z.string().optional(),
  exhibicion: z.string().optional(),
  enlace: z.string().url().optional(),
})

export type FilmographyEntry = z.infer<typeof filmographyEntrySchema>

const baseTeamMemberSchema = z.object({
  nombre_completo: z.string().min(1),
  cargo: z.enum(CARGOS_EQUIPO),
  nacionalidad: z.string(),
  filmografia: z.array(filmographyEntrySchema),
  formacion: z.string().optional(),
  premios: z.array(z.string()).optional(),
  enlaces: z.array(z.string()).optional(),
  honorarios_centavos: z.number().int().nonnegative(),
  aportacion_especie_centavos: z.number().int().nonnegative(),
  es_mujer: z.boolean().optional(),
  es_indigena_afromexicano: z.boolean().optional(),
  es_socio_erpi: z.boolean().optional(),
})

/**
 * Team member schema with in-kind constraint.
 * aportacion_especie_centavos must be <= honorarios_centavos
 * (per D-20: in-kind is a portion of the fee, not additional).
 */
export const teamMemberSchema = baseTeamMemberSchema.refine(
  (data) => data.aportacion_especie_centavos <= data.honorarios_centavos,
  {
    message:
      'La aportacion en especie no puede exceder los honorarios totales',
    path: ['aportacion_especie_centavos'],
  },
)

export type TeamMember = z.infer<typeof teamMemberSchema>
