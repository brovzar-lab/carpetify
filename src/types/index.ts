// Re-export all types from schemas
export type { ProjectMetadata } from '@/schemas/project'
export type { TeamMember, FilmographyEntry } from '@/schemas/team'
export type { Financials, Tercero } from '@/schemas/financials'
export type { Screenplay, Escena } from '@/schemas/screenplay'
export type { UploadedDocument } from '@/schemas/documents'
export type { ERPISettings, ProyectoPrevio } from '@/schemas/erpi'

/**
 * Full project type combining metadata with Firestore document fields.
 */
export interface Project {
  id: string
  metadata: import('@/schemas/project').ProjectMetadata
  createdAt: Date
  updatedAt: Date
}
