import { httpsCallable } from 'firebase/functions'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore'
import { db, functions } from '@/lib/firebase'
import type { ProjectRole } from '@/lib/permissions'

/**
 * A pending invitation the current user can accept or decline.
 */
export interface PendingInvitation {
  id: string
  projectId: string
  projectTitle: string
  role: string
  inviterName: string
  createdAt: Date
  expiresAt: Date
}

/**
 * A team member on a project (resolved from collaborators map).
 */
export interface TeamMember {
  uid: string
  role: ProjectRole
  email: string
  displayName: string
}

/**
 * A pending invitation for a specific project (shown in project settings).
 */
export interface ProjectInvitation {
  id: string
  inviteeEmail: string
  role: string
  inviterName: string
  createdAt: Date
  expiresAt: Date
  status: string
}

/**
 * Fetches pending invitations for the given email address.
 * Filters out expired invitations client-side.
 */
export async function getPendingInvitations(
  email: string,
): Promise<PendingInvitation[]> {
  const normalizedEmail = email.toLowerCase().trim()
  const invitationsCol = collection(db, 'invitations')
  const q = query(
    invitationsCol,
    where('inviteeEmail', '==', normalizedEmail),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  )

  const snap = await getDocs(q)
  const now = new Date()

  return snap.docs
    .map((doc) => {
      const data = doc.data()
      const expiresAt = data.expiresAt?.toDate?.() ?? new Date(data.expiresAt)
      return {
        id: doc.id,
        projectId: data.projectId as string,
        projectTitle: data.projectTitle as string,
        role: data.role as string,
        inviterName: data.inviterName as string,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        expiresAt,
      }
    })
    .filter((inv) => inv.expiresAt > now)
}

/**
 * Sends an invitation to a team member via Cloud Function.
 */
export async function inviteToProject(
  projectId: string,
  inviteeEmail: string,
  role: string,
): Promise<{ success: boolean; invitationId: string }> {
  const fn = httpsCallable<
    { projectId: string; inviteeEmail: string; role: string },
    { success: boolean; invitationId: string }
  >(functions, 'inviteToProject')
  const result = await fn({ projectId, inviteeEmail, role })
  return result.data
}

/**
 * Accepts a pending invitation via Cloud Function.
 * Returns the projectId so the UI can navigate to it.
 */
export async function acceptInvitation(
  invitationId: string,
): Promise<{ success: boolean; projectId: string }> {
  const fn = httpsCallable<
    { invitationId: string },
    { success: boolean; projectId: string }
  >(functions, 'acceptInvitation')
  const result = await fn({ invitationId })
  return result.data
}

/**
 * Declines a pending invitation via Cloud Function.
 */
export async function declineInvitation(
  invitationId: string,
): Promise<{ success: boolean }> {
  const fn = httpsCallable<{ invitationId: string }, { success: boolean }>(
    functions,
    'declineInvitation',
  )
  const result = await fn({ invitationId })
  return result.data
}

/**
 * Revokes a collaborator's access to a project via Cloud Function.
 */
export async function revokeAccess(
  projectId: string,
  targetUserId: string,
): Promise<{ success: boolean }> {
  const fn = httpsCallable<
    { projectId: string; targetUserId: string },
    { success: boolean }
  >(functions, 'revokeProjectAccess')
  const result = await fn({ projectId, targetUserId })
  return result.data
}

/**
 * Resolves team member details from the collaborators map and ownerId.
 * Queries the users collection to get displayName and email for each UID.
 * Owner is always listed first with role 'productor'.
 */
export async function getProjectTeamMembers(
  collaborators: Record<string, string>,
  ownerId: string,
): Promise<TeamMember[]> {
  const uids = Object.keys(collaborators)
  if (uids.length === 0) return []

  // Query users for each UID (batch in chunks of 10 for Firestore 'in' limit)
  const members: TeamMember[] = []
  const usersCol = collection(db, 'users')

  for (let i = 0; i < uids.length; i += 10) {
    const chunk = uids.slice(i, i + 10)
    const q = query(usersCol, where('__name__', 'in', chunk))
    const snap = await getDocs(q)

    for (const userDoc of snap.docs) {
      const userData = userDoc.data()
      members.push({
        uid: userDoc.id,
        role: collaborators[userDoc.id] as ProjectRole,
        email: (userData.email as string) || '',
        displayName: (userData.displayName as string) || (userData.email as string) || '',
      })
    }
  }

  // Add any UIDs that weren't found in users collection (e.g., pending migration)
  for (const uid of uids) {
    if (!members.find((m) => m.uid === uid)) {
      members.push({
        uid,
        role: collaborators[uid] as ProjectRole,
        email: '',
        displayName: uid === ownerId ? 'Propietario' : 'Usuario',
      })
    }
  }

  // Sort: owner first, then alphabetically by displayName
  members.sort((a, b) => {
    if (a.uid === ownerId) return -1
    if (b.uid === ownerId) return 1
    return a.displayName.localeCompare(b.displayName)
  })

  return members
}

/**
 * Fetches pending invitations for a specific project.
 * Used in project settings to show pending invites.
 */
export async function getProjectInvitations(
  projectId: string,
): Promise<ProjectInvitation[]> {
  const invitationsCol = collection(db, 'invitations')
  const q = query(
    invitationsCol,
    where('projectId', '==', projectId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  )

  const snap = await getDocs(q)
  return snap.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      inviteeEmail: data.inviteeEmail as string,
      role: data.role as string,
      inviterName: data.inviterName as string,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      expiresAt: data.expiresAt?.toDate?.() ?? new Date(data.expiresAt),
      status: data.status as string,
    }
  })
}
