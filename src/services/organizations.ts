import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Organization } from '@/schemas/organization'

const orgsCol = collection(db, 'organizations')

/**
 * Creates a new organization. Returns the org ID.
 */
export async function createOrganization(
  name: string,
  userId: string,
): Promise<string> {
  const ref = doc(orgsCol)
  await setDoc(ref, {
    name,
    createdBy: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * Reads an organization by ID.
 */
export async function getOrganization(
  orgId: string,
): Promise<Organization | null> {
  const ref = doc(db, 'organizations', orgId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as Organization
}

/**
 * Finds the organization a user belongs to (via members array-contains).
 * Returns the first match or null.
 */
export async function getUserOrganization(
  userId: string,
): Promise<{ id: string; data: Organization } | null> {
  const q = query(orgsCol, where('members', 'array-contains', userId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const first = snap.docs[0]
  return { id: first.id, data: first.data() as Organization }
}

/**
 * Creates or updates a user profile document at users/{userId}.
 */
export async function createUserProfile(
  userId: string,
  user: {
    displayName: string | null
    email: string | null
    photoURL: string | null
  },
  orgId: string,
): Promise<void> {
  const ref = doc(db, 'users', userId)
  await setDoc(
    ref,
    {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      organizationId: orgId,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}
