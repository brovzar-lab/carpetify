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
const E2E_MODE = import.meta.env.DEV && import.meta.env.VITE_E2E === 'true'
const E2E_PROJECT_ID = 'Z8xUrH1ify0hSuz0gd4D'
const E2E_STORAGE_KEY = 'carpetify-e2e-projects'

interface StoredProject {
  metadata: ProjectMetadata
  ownerId: string
  orgId: string
  collaborators: Record<string, string>
  memberUIDs: string[]
  createdAt: number
}

const defaultMetadata = (): ProjectMetadata => ({
  titulo_proyecto: 'Proyecto de prueba',
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
  intentos_proyecto: 0,
  director_origen_fuera_zmcm: false,
  productor_origen_fuera_zmcm: false,
  porcentaje_rodaje_fuera_zmcm: 0,
  porcentaje_personal_creativo_local: 0,
  porcentaje_personal_tecnico_local: 0,
})

function readE2EProjects(): Record<string, StoredProject> {
  return JSON.parse(localStorage.getItem(E2E_STORAGE_KEY) ?? '{}') as Record<string, StoredProject>
}

function writeE2EProjects(projects: Record<string, StoredProject>): void {
  localStorage.setItem(E2E_STORAGE_KEY, JSON.stringify(projects))
}

function ensureE2EProject(id: string, userId = 'dev-user-001'): StoredProject {
  const projects = readE2EProjects()
  projects[id] ??= {
    metadata: defaultMetadata(),
    ownerId: userId,
    orgId: 'dev-org-001',
    collaborators: { [userId]: 'productor' },
    memberUIDs: [userId],
    createdAt: Date.now(),
  }
  writeE2EProjects(projects)
  return projects[id]
}

/**
 * Creates a new project with default metadata and ownership. Returns the project ID.
 * Per D-08: all new projects get ownerId and orgId.
 */
export async function createProject(userId: string, orgId: string): Promise<string> {
  if (E2E_MODE) {
    const id = crypto.randomUUID()
    const projects = readE2EProjects()
    projects[id] = {
      metadata: defaultMetadata(),
      ownerId: userId,
      orgId,
      collaborators: { [userId]: 'productor' },
      memberUIDs: [userId],
      createdAt: Date.now(),
    }
    writeE2EProjects(projects)
    return id
  }

  const ref = doc(projectsCol)
  await setDoc(ref, {
    metadata: { ...defaultMetadata(), titulo_proyecto: '' },
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
  if (E2E_MODE) return { id, metadata: ensureE2EProject(id).metadata }

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
  if (E2E_MODE) {
    const projects = readE2EProjects()
    const project = projects[id] ?? ensureE2EProject(id)
    projects[id] = { ...project, metadata: { ...project.metadata, ...data } }
    writeE2EProjects(projects)
    return
  }

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
  if (E2E_MODE) {
    const projects = readE2EProjects()
    delete projects[id]
    writeE2EProjects(projects)
    return
  }

  const ref = doc(db, 'projects', id)
  await deleteDoc(ref)
}

/**
 * Clones a project by reading all data and creating a new document.
 * Appends " (copia)" to the title per D-10.
 * Per D-08: cloned project gets ownerId and orgId.
 */
export async function cloneProject(id: string, userId: string, orgId: string): Promise<string> {
  if (E2E_MODE) {
    const source = ensureE2EProject(id, userId)
    const newId = crypto.randomUUID()
    const projects = readE2EProjects()
    projects[newId] = {
      ...source,
      metadata: { ...source.metadata, titulo_proyecto: `${source.metadata.titulo_proyecto} (copia)` },
      ownerId: userId,
      orgId,
      collaborators: { [userId]: 'productor' },
      memberUIDs: [userId],
      createdAt: Date.now(),
    }
    writeE2EProjects(projects)
    return newId
  }

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
  if (E2E_MODE) {
    ensureE2EProject(E2E_PROJECT_ID, userId)
    return Object.entries(readE2EProjects())
      .filter(([, project]) => project.memberUIDs.includes(userId))
      .sort(([, a], [, b]) => b.createdAt - a.createdAt)
      .map(([id, project]) => ({
        id,
        metadata: project.metadata,
        createdAt: new Date(project.createdAt),
        ownerId: project.ownerId,
        collaborators: project.collaborators,
      }))
  }

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
