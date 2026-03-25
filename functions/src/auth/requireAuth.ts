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
 * Validates that the caller owns the specified project.
 * Must be called AFTER requireAuth.
 * Throws HttpsError('permission-denied') if not the owner.
 * Returns the project data for downstream use.
 */
export async function requireProjectAccess(
  uid: string,
  projectId: string,
): Promise<FirebaseFirestore.DocumentData> {
  const db = getFirestore();
  const projectDoc = await db.doc(`projects/${projectId}`).get();

  if (!projectDoc.exists) {
    throw new HttpsError('not-found', 'Proyecto no encontrado.');
  }

  const data = projectDoc.data()!;

  // Owner check (per D-15). In Phase 10, only owner has access.
  // Phase 11 will extend this to check collaborators array.
  if (data.ownerId !== uid) {
    throw new HttpsError('permission-denied', 'No tienes acceso a este proyecto.');
  }

  return data;
}
