import { z } from 'zod'

export const escenaSchema = z.object({
  numero: z.number().int(),
  int_ext: z.enum(['INT', 'EXT', 'INT-EXT']),
  dia_noche: z.enum(['DIA', 'NOCHE', 'AMANECER', 'ATARDECER']),
  locacion: z.string(),
  personajes: z.array(z.string()),
  complejidad: z.string().optional(),
})

export type Escena = z.infer<typeof escenaSchema>

export const screenplaySchema = z.object({
  num_paginas: z.number().int().optional(),
  num_escenas: z.number().int().optional(),
  escenas: z.array(escenaSchema).default([]),
  locaciones: z
    .array(
      z.object({
        nombre: z.string(),
        tipo: z.string(),
        frecuencia: z.number().int(),
      }),
    )
    .default([]),
  personajes: z
    .array(
      z.object({
        nombre: z.string(),
        num_escenas: z.number().int(),
        es_protagonista: z.boolean(),
      }),
    )
    .default([]),
  complejidad: z
    .object({
      stunts: z.boolean().optional(),
      vfx: z.boolean().optional(),
      agua: z.boolean().optional(),
      animales: z.boolean().optional(),
      ninos: z.boolean().optional(),
      noche_pct: z.number().optional(),
    })
    .optional(),
  dias_rodaje_estimados: z.number().int().optional(),
  uploaded_file_path: z.string().optional(),
  screenplay_status: z
    .enum(['pending', 'uploaded', 'parsed', 'error'])
    .default('pending'),
})

export type Screenplay = z.infer<typeof screenplaySchema>
