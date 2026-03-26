import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Handles the acceptInvitation callable.
 * Uses Firestore transaction to atomically:
 * 1. Validate invitation (exists, pending, email match, not expired)
 * 2. Update invitation status to 'accepted'
 * 3. Add user to project collaborators + memberUIDs
 *
 * Per D-09: Email matching safeguard prevents wrong-account acceptance.
 * Per D-10: Expired invitations are rejected.
 * Per D-17: Logs to security_events for audit trail.
 * Per Pitfall 1: collaborators/memberUIDs sync via transaction.
 */
export async function handleAcceptInvitation(
  uid: string,
  userEmail: string,
  data: { invitationId: string },
): Promise<{ success: true; projectId: string }> {
  const { invitationId } = data;

  if (!invitationId) {
    throw new HttpsError('invalid-argument', 'Se requiere invitationId.');
  }

  const db = getFirestore();
  const invitationRef = db.collection('invitations').doc(invitationId);

  const result = await db.runTransaction(async (transaction) => {
    const invitationSnap = await transaction.get(invitationRef);

    if (!invitationSnap.exists) {
      throw new HttpsError('not-found', 'Invitacion no encontrada.');
    }

    const invitation = invitationSnap.data()!;

    // Must be pending
    if (invitation.status !== 'pending') {
      throw new HttpsError(
        'failed-precondition',
        'Esta invitacion ya fue respondida.',
      );
    }

    // D-09: Email matching safeguard
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    if (invitation.inviteeEmail !== normalizedUserEmail) {
      throw new HttpsError(
        'permission-denied',
        `Esta invitacion fue enviada a ${invitation.inviteeEmail}. Inicia sesion con esa cuenta para aceptar.`,
      );
    }

    // D-10: Check expiration
    const expiresAt = invitation.expiresAt?.toDate
      ? invitation.expiresAt.toDate()
      : new Date(invitation.expiresAt);
    if (expiresAt < new Date()) {
      // Mark as expired
      transaction.update(invitationRef, {
        status: 'expired',
        respondedAt: FieldValue.serverTimestamp(),
      });
      throw new HttpsError(
        'failed-precondition',
        'Esta invitacion ha expirado. Solicita una nueva al productor.',
      );
    }

    const projectRef = db.collection('projects').doc(invitation.projectId);

    // Update invitation status
    transaction.update(invitationRef, {
      status: 'accepted',
      respondedAt: FieldValue.serverTimestamp(),
    });

    // Atomically add user to project (Pitfall 1: collaborators/memberUIDs sync)
    transaction.update(projectRef, {
      [`collaborators.${uid}`]: invitation.role,
      memberUIDs: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { projectId: invitation.projectId, role: invitation.role };
  });

  // Log to security_events (D-17) -- outside transaction for simplicity
  await db.collection('security_events').add({
    action: 'invitation_accepted',
    userId: uid,
    projectId: result.projectId,
    role: result.role,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { success: true, projectId: result.projectId };
}

/**
 * Handles the declineInvitation callable.
 * Updates invitation status to 'declined' without granting access.
 *
 * Per D-09: Email matching safeguard ensures only the invitee can decline.
 * Per D-17: Logs to security_events for audit trail.
 */
export async function handleDeclineInvitation(
  uid: string,
  userEmail: string,
  data: { invitationId: string },
): Promise<{ success: true }> {
  const { invitationId } = data;

  if (!invitationId) {
    throw new HttpsError('invalid-argument', 'Se requiere invitationId.');
  }

  const db = getFirestore();
  const invitationRef = db.collection('invitations').doc(invitationId);
  const invitationSnap = await invitationRef.get();

  if (!invitationSnap.exists) {
    throw new HttpsError('not-found', 'Invitacion no encontrada.');
  }

  const invitation = invitationSnap.data()!;

  if (invitation.status !== 'pending') {
    throw new HttpsError(
      'failed-precondition',
      'Esta invitacion ya fue respondida.',
    );
  }

  // D-09: Email matching safeguard
  const normalizedUserEmail = userEmail.toLowerCase().trim();
  if (invitation.inviteeEmail !== normalizedUserEmail) {
    throw new HttpsError(
      'permission-denied',
      'No tienes permiso para rechazar esta invitacion.',
    );
  }

  await invitationRef.update({
    status: 'declined',
    respondedAt: FieldValue.serverTimestamp(),
  });

  // Log to security_events (D-17)
  await db.collection('security_events').add({
    action: 'invitation_declined',
    userId: uid,
    projectId: invitation.projectId,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { success: true };
}
