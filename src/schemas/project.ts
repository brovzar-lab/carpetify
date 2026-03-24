import { z } from 'zod'
import {
  CATEGORIAS_CINEMATOGRAFICAS,
  CATEGORIAS_DIRECTOR,
} from '@/lib/constants'

const baseProjectSchema = z.object({
  titulo_proyecto: z.string().min(1).max(100),
  categoria_cinematografica: z.enum(CATEGORIAS_CINEMATOGRAFICAS),
  categoria_director: z.enum(CATEGORIAS_DIRECTOR),
  duracion_estimada_minutos: z.number().int().min(60),
  formato_filmacion: z.string(),
  relacion_aspecto: z.string(),
  idiomas: z.array(z.string()).min(1),
  costo_total_proyecto_centavos: z.number().int().positive(),
  monto_solicitado_eficine_centavos: z
    .number()
    .int()
    .positive()
    .max(2500000000), // $25M in centavos
  periodo_registro: z.enum(['2026-P1', '2026-P2']),
  es_coproduccion_internacional: z.boolean().default(false),
  // Submission tracking
  intentos_proyecto: z.number().int().min(0).default(0),
  // Regional bonus fields (VALD-13)
  director_origen_fuera_zmcm: z.boolean().default(false),
  productor_origen_fuera_zmcm: z.boolean().default(false),
  porcentaje_rodaje_fuera_zmcm: z.number().int().min(0).max(100).default(0),
  porcentaje_personal_creativo_local: z.number().int().min(0).max(100).default(0),
  porcentaje_personal_tecnico_local: z.number().int().min(0).max(100).default(0),
  // Co-production conditional fields
  tipo_cambio_fx: z.number().positive().optional(),
  fecha_tipo_cambio: z.string().optional(),
})

/**
 * Project metadata schema with co-production conditional validation.
 * When es_coproduccion_internacional is true, tipo_cambio_fx and
 * fecha_tipo_cambio are required (per D-18/INTK-11).
 */
export const projectMetadataSchema = baseProjectSchema.refine(
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

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>
