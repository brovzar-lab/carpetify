import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ProjectMetadata } from '@/schemas/project'

const projectsCol = collection(db, 'projects')

/**
 * Creates a new project with default metadata and ownership. Returns the project ID.
 * Per D-08: all new projects get ownerId and orgId.
 */
export async function createProject(userId: string, orgId: string): Promise<string> {
  const ref = doc(projectsCol)
  await setDoc(ref, {
    metadata: {
      titulo_proyecto: '',
      categoria_cinematografica: 'Ficcion',
      categoria_director: 'Opera Prima',
      duracion_estimada_minutos: 90,
      formato_filmacion: '',
      relacion_aspecto: '',
      idiomas: ['Espanol'],
      costo_total_proyecto_centavos: 0,
      monto_solicitado_eficine_centavos: 0,
      periodo_registro: '2026-P1',
      es_coproduccion_internacional: false,
    },
    ownerId: userId,
    orgId: orgId,
    collaborators: { [userId]: 'productor' },
    memberUIDs: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * Reads a project's metadata by ID.
 */
export async function getProject(
  id: string,
): Promise<{ id: string; metadata: ProjectMetadata } | null> {
  const ref = doc(db, 'projects', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return { id: snap.id, metadata: data.metadata as ProjectMetadata }
}

/**
 * Partially updates project metadata.
 */
export async function updateProjectMetadata(
  id: string,
  data: Partial<ProjectMetadata>,
): Promise<void> {
  const ref = doc(db, 'projects', id)
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() }
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates[`metadata.${key}`] = value
    }
  }
  await updateDoc(ref, updates)
}

/**
 * Permanently deletes a project.
 */
export async function deleteProject(id: string): Promise<void> {
  const ref = doc(db, 'projects', id)
  await deleteDoc(ref)
}

/**
 * Clones a project by reading all data and creating a new document.
 * Appends " (copia)" to the title per D-10.
 * Per D-08: cloned project gets ownerId and orgId.
 */
export async function cloneProject(id: string, userId: string, orgId: string): Promise<string> {
  const ref = doc(db, 'projects', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Proyecto no encontrado')

  const data = snap.data()
  const newRef = doc(projectsCol)
  await setDoc(newRef, {
    ...data,
    metadata: {
      ...data.metadata,
      titulo_proyecto: `${data.metadata.titulo_proyecto} (copia)`,
    },
    ownerId: userId,
    orgId: orgId,
    collaborators: { [userId]: 'productor' },
    memberUIDs: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}

/**
 * Lists projects where the current user is a member (owner or collaborator).
 * Uses array-contains on memberUIDs for efficient querying.
 * Returns ownerId and collaborators so the dashboard can show role info.
 */
export async function listProjects(userId: string): Promise<
  Array<{
    id: string
    metadata: ProjectMetadata
    createdAt: Date
    ownerId: string
    collaborators: Record<string, string>
  }>
> {
  const q = query(
    projectsCol,
    where('memberUIDs', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      metadata: data.metadata as ProjectMetadata,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      ownerId: data.ownerId as string,
      collaborators: (data.collaborators ?? {}) as Record<string, string>,
    }
  })
}
