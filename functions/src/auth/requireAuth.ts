import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Validates that the caller is authenticated.
 * Throws HttpsError('unauthenticated') if no valid auth token.
 * Returns the caller's UID.
 */
export function requireAuth(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Autenticacion requerida.');
  }
  return uid;
}

/**
 * Validates that the caller is a member of the specified project.
 * Checks both ownership (ownerId) and collaborators map.
 * Must be called AFTER requireAuth.
 *
 * Returns the user's role and the project data for downstream use:
 * - If uid === ownerId, role is 'productor'
 * - If uid is in collaborators map, role is the value from the map
 * - Otherwise throws HttpsError('permission-denied')
 */
export async function requireProjectAccess(
  uid: string,
  projectId: string,
): Promise<{ role: string; projectData: FirebaseFirestore.DocumentData }> {
  const db = getFirestore();
  const projectDoc = await db.doc(`projects/${projectId}`).get();

  if (!projectDoc.exists) {
    throw new HttpsError('not-found', 'Proyecto no encontrado.');
  }

  const data = projectDoc.data()!;

  // Owner is always 'productor'
  if (data.ownerId === uid) {
    return { role: 'productor', projectData: data };
  }

  // Check collaborators map for membership
  if (data.collaborators && uid in data.collaborators) {
    return { role: data.collaborators[uid], projectData: data };
  }

  throw new HttpsError('permission-denied', 'No tienes acceso a este proyecto.');
}

/**
 * Validates that the caller's role is in the allowed roles list.
 * Throws HttpsError('permission-denied') if the role is not allowed.
 * For use in Cloud Functions that need role-restricted access beyond basic membership.
 *
 * @param role - The user's role from requireProjectAccess
 * @param allowedRoles - List of roles permitted for this action
 */
export function requireRole(role: string, allowedRoles: string[]): void {
  if (!allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'No tienes permiso para realizar esta accion.');
  }
}
