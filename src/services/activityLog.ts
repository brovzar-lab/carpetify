import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'

/**
 * Activity log entry stored in `projects/{projectId}/activity_log` subcollection.
 * Per D-13: stores field names, not values. Per D-01: one entry per save, not per field.
 */
export interface ActivityLogEntry {
  id: string
  userId: string
  displayName: string
  photoURL: string | null
  userRole: string
  screen: string
  action:
    | 'update'
    | 'create'
    | 'delete'
    | 'generate'
    | 'invite'
    | 'accept_invite'
    | 'export'
    | 'upload'
    | 'role_change'
    | 'warning_dismissed'
  changedFields: string[]
  summary: string
  createdAt: Date
  metadata?: Record<string, string>
}

/**
 * Map of Firestore field names to Spanish display labels.
 * Per D-13: store field names, not values.
 */
export const FIELD_LABELS: Record<string, string> = {
  titulo_proyecto: 'titulo del proyecto',
  sinopsis: 'sinopsis',
  categoria_cinematografica: 'categoria cinematografica',
  duracion_estimada_minutos: 'duracion estimada',
  formato_filmacion: 'formato de filmacion',
  idioma_original: 'idioma original',
  pais_coproduccion: 'pais de coproduccion',
  numero_periodo: 'periodo EFICINE',
  anio_periodo: 'anio del periodo',
  productor_nombre: 'nombre del productor',
  productor_email: 'email del productor',
  productor_telefono: 'telefono del productor',
  erpi_razon_social: 'razon social ERPI',
  costo_total_proyecto_centavos: 'costo total',
  monto_solicitado_eficine_centavos: 'monto EFICINE',
  aportacion_erpi_centavos: 'aportacion ERPI',
  aportacion_especie_centavos: 'aportacion en especie',
  aportacion_federal_centavos: 'aportacion federal',
  honorario_guionista_centavos: 'honorario del guionista',
  honorario_director_centavos: 'honorario del director',
  honorario_productor_centavos: 'honorario del productor',
  gestor_monto_centavos: 'monto del gestor',
}

/**
 * Map of wizard screen keys to Spanish display names.
 */
export const SCREEN_LABELS: Record<string, string> = {
  datos: 'Datos del Proyecto',
  guion: 'Guion',
  equipo: 'Equipo Creativo',
  financiera: 'Estructura Financiera',
  documentos: 'Documentos',
  metadata: 'Datos del Proyecto',
}

/**
 * Build a human-readable Spanish summary for an activity entry.
 * 1 field: "Actualizo {fieldLabel} en {screenLabel}"
 * N fields: "Actualizo {N} campos en {screenLabel}"
 */
export function buildChangeSummary(
  screen: string,
  changedFields: string[],
): string {
  const screenLabel = SCREEN_LABELS[screen] || screen

  if (changedFields.length === 1) {
    const fieldLabel = FIELD_LABELS[changedFields[0]] || changedFields[0]
    return `Actualizo ${fieldLabel} en ${screenLabel}`
  }

  return `Actualizo ${changedFields.length} campos en ${screenLabel}`
}

/**
 * Write a single activity log entry to Firestore.
 * Uses serverTimestamp() for createdAt -- Firestore generates the timestamp.
 */
export async function writeActivityEntry(
  projectId: string,
  entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>,
): Promise<void> {
  const activityRef = collection(
    db,
    `projects/${projectId}/activity_log`,
  )
  await addDoc(activityRef, {
    ...entry,
    createdAt: serverTimestamp(),
  })
}

/**
 * Coalesce rapid edits within a 30-second window (Pitfall 1 from RESEARCH.md).
 *
 * 1. Query the latest entry from the same user on the same screen.
 * 2. If it exists and is < 30 seconds old, merge changedFields and update summary.
 * 3. Otherwise, create a new entry.
 *
 * This function is fire-and-forget: errors are caught and logged, never thrown.
 * Activity logging must not block the user's save.
 */
export async function coalesceOrCreate(
  projectId: string,
  newEntry: {
    userId: string
    displayName: string
    photoURL: string | null
    userRole: string
    screen: string
    action: ActivityLogEntry['action']
    changedFields: string[]
  },
  user: User,
): Promise<void> {
  try {
    const activityRef = collection(
      db,
      `projects/${projectId}/activity_log`,
    )

    // Query the latest entry from the same user on the same screen
    const q = query(
      activityRef,
      where('userId', '==', user.uid),
      where('screen', '==', newEntry.screen),
      orderBy('createdAt', 'desc'),
      limit(1),
    )

    const snap = await getDocs(q)

    if (!snap.empty) {
      const existingDoc = snap.docs[0]
      const existingData = existingDoc.data()
      const existingCreatedAt = existingData.createdAt?.toDate?.()

      // Check if the existing entry is less than 30 seconds old
      if (
        existingCreatedAt &&
        new Date().getTime() - existingCreatedAt.getTime() < 30_000
      ) {
        // Merge changedFields (union, no duplicates)
        const mergedFields = Array.from(
          new Set([
            ...(existingData.changedFields ?? []),
            ...newEntry.changedFields,
          ]),
        )
        const updatedSummary = buildChangeSummary(
          newEntry.screen,
          mergedFields,
        )

        await updateDoc(existingDoc.ref, {
          changedFields: mergedFields,
          summary: updatedSummary,
          createdAt: serverTimestamp(),
        })
        return
      }
    }

    // No match or too old -- create new entry
    const summary = buildChangeSummary(
      newEntry.screen,
      newEntry.changedFields,
    )
    await writeActivityEntry(projectId, {
      ...newEntry,
      summary,
    })
  } catch (err) {
    // Fire-and-forget: log and swallow
    console.warn('Activity log coalesceOrCreate failed:', err)
  }
}
