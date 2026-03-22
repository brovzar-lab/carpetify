import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ProjectMetadata } from '@/schemas/project'

const projectsCol = collection(db, 'projects')

/**
 * Creates a new project with default metadata. Returns the project ID.
 */
export async function createProject(): Promise<string> {
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
    updates[`metadata.${key}`] = value
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
 */
export async function cloneProject(id: string): Promise<string> {
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}

/**
 * Lists all projects sorted by creation date (newest first).
 */
export async function listProjects(): Promise<
  Array<{ id: string; metadata: ProjectMetadata; createdAt: Date }>
> {
  const q = query(projectsCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      metadata: data.metadata as ProjectMetadata,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    }
  })
}
