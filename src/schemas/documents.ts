import { z } from 'zod'

export const uploadedDocumentSchema = z.object({
  tipo: z.string(),
  filename: z.string(),
  storagePath: z.string(),
  uploadedAt: z.date(),
  fecha_emision: z.date().optional(),
  status: z.enum(['uploaded', 'verified', 'expired']),
})

export type UploadedDocument = z.infer<typeof uploadedDocumentSchema>
