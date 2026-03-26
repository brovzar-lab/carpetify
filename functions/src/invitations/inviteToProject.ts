import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const VALID_INVITE_ROLES = ['line_producer', 'abogado', 'director'] as const;

/**
 * Handles the inviteToProject callable.
 * Creates an invitation document for the given email + role.
 * Only productor can invite (enforced by caller in index.ts via requireRole).
 *
 * Per D-06: In-app invitation by email with role selection.
 * Per D-09: Email normalized to lowercase to prevent mismatch.
 * Per D-10: Invitations expire after 7 days.
 * Per D-17: Logs to security_events for audit trail.
 */
export async function handleInviteToProject(
  uid: string,
  data: {
    projectId: string;
    inviteeEmail: string;
    role: string;
  },
  callerRole: string,
  projectData: FirebaseFirestore.DocumentData,
): Promise<{ success: true; invitationId: string }> {
  const { projectId, inviteeEmail, role } = data;

  // Validate role is one of the allowed invite roles (NOT productor)
  if (!VALID_INVITE_ROLES.includes(role as typeof VALID_INVITE_ROLES[number])) {
    throw new HttpsError('invalid-argument', 'Rol no valido.');
  }

  // Normalize email (Pitfall 3: email case sensitivity)
  const normalizedEmail = inviteeEmail.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new HttpsError('invalid-argument', 'Correo electronico no valido.');
  }

  const db = getFirestore();

  // Check if invitee is already a member
  // Query users collection to find if that email belongs to an existing user
  const usersSnap = await db
    .collection('users')
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!usersSnap.empty) {
    const existingUser = usersSnap.docs[0];
    const existingUid = existingUser.id;

    // Check if already a collaborator or the owner
    if (
      existingUid === projectData.ownerId ||
      (projectData.collaborators && existingUid in projectData.collaborators)
    ) {
      throw new HttpsError(
        'already-exists',
        'Este usuario ya es miembro del proyecto.',
      );
    }
  }

  // Check for existing pending invitation
  const pendingSnap = await db
    .collection('invitations')
    .where('projectId', '==', projectId)
    .where('inviteeEmail', '==', normalizedEmail)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    throw new HttpsError(
      'already-exists',
      'Ya existe una invitacion pendiente para este correo.',
    );
  }

  // Create invitation document with 7-day expiry (D-10)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitationRef = await db.collection('invitations').add({
    projectId,
    projectTitle: projectData.metadata?.titulo_proyecto || '',
    inviteeEmail: normalizedEmail,
    role,
    status: 'pending',
    invitedBy: uid,
    inviterName: projectData.metadata?.productor_nombre || '',
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    respondedAt: null,
  });

  // Log to security_events (D-17)
  await db.collection('security_events').add({
    action: 'invite_sent',
    userId: uid,
    projectId,
    targetEmail: normalizedEmail,
    role,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { success: true, invitationId: invitationRef.id };
}
