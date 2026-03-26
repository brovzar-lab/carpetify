import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Handles the revokeProjectAccess callable.
 * Removes a collaborator from the project's collaborators map and memberUIDs array.
 * Only productor can revoke (enforced by caller in index.ts via requireRole).
 *
 * Per D-15: Removes user from collaborators + memberUIDs atomically.
 * Per D-17: Logs to security_events for audit trail.
 */
export async function handleRevokeAccess(
  uid: string,
  data: {
    projectId: string;
    targetUserId: string;
  },
  callerRole: string,
): Promise<{ success: true }> {
  const { projectId, targetUserId } = data;

  if (!projectId || !targetUserId) {
    throw new HttpsError(
      'invalid-argument',
      'Se requiere projectId y targetUserId.',
    );
  }

  // Only productor can revoke
  if (callerRole !== 'productor') {
    throw new HttpsError(
      'permission-denied',
      'Solo el productor puede quitar acceso.',
    );
  }

  const db = getFirestore();
  const projectRef = db.collection('projects').doc(projectId);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    throw new HttpsError('not-found', 'Proyecto no encontrado.');
  }

  const projectData = projectSnap.data()!;

  // Cannot revoke owner's own access
  if (targetUserId === projectData.ownerId) {
    throw new HttpsError(
      'failed-precondition',
      'No se puede revocar el acceso del propietario del proyecto.',
    );
  }

  // Verify target is actually a collaborator
  if (!projectData.collaborators || !(targetUserId in projectData.collaborators)) {
    throw new HttpsError(
      'not-found',
      'El usuario no es miembro de este proyecto.',
    );
  }

  // Atomically remove from collaborators map and memberUIDs array (D-15)
  await projectRef.update({
    [`collaborators.${targetUserId}`]: FieldValue.delete(),
    memberUIDs: FieldValue.arrayRemove(targetUserId),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Log to security_events (D-17)
  await db.collection('security_events').add({
    action: 'access_revoked',
    userId: uid,
    projectId,
    targetUserId,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { success: true };
}
