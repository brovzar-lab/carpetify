import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { requireAuth, requireProjectAccess, requireRole } from '../auth/requireAuth.js';

/**
 * forceBreakLock: Callable Cloud Function.
 * Allows a productor to force-remove a lock held by another user on any
 * wizard screen in a project. Uses Admin RTDB SDK to bypass security rules.
 *
 * Per D-04: Only the productor role can force-break locks.
 * Per research Pattern 7: Admin SDK remove() bypasses RTDB rules.
 *
 * Region: us-central1. Timeout: 30s. Memory: 256MiB.
 */
export const handleForceBreakLock = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    const uid = requireAuth(request);

    const { projectId, screenId } = request.data as {
      projectId: string;
      screenId: string;
    };

    if (!projectId || !screenId) {
      throw new HttpsError(
        'invalid-argument',
        'Se requiere projectId y screenId.',
      );
    }

    const { role } = await requireProjectAccess(uid, projectId);
    requireRole(role, ['productor']);

    try {
      const db = getDatabase();
      await db.ref(`locks/${projectId}/${screenId}`).remove();
      return { success: true };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error('forceBreakLock error:', err);
      throw new HttpsError('internal', 'Error al desbloquear seccion.');
    }
  },
);
