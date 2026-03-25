import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(1).max(100),
  createdBy: z.string().min(1), // UID of creator
  createdAt: z.date().or(z.any()), // Firestore Timestamp
  members: z.array(z.string()), // Array of UIDs
})

export type Organization = z.infer<typeof organizationSchema>
