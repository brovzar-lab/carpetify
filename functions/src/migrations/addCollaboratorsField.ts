import { getFirestore } from 'firebase-admin/firestore';

/**
 * Migration: Add collaborators map and memberUIDs array to existing projects.
 *
 * For each project that does NOT already have a `collaborators` field:
 * - Sets `collaborators: { [ownerId]: 'productor' }` (owner is always productor)
 * - Sets `memberUIDs: [ownerId]` (denormalized array for array-contains queries)
 *
 * Idempotent: skips projects that already have `collaborators`.
 * Uses batched writes (max 500 per batch) for efficiency.
 *
 * @returns Object with migratedCount indicating how many projects were updated.
 */
export async function migrateProjectsAddCollaborators(): Promise<{ migratedCount: number }> {
  const db = getFirestore();
  const projectsRef = db.collection('projects');
  const snapshot = await projectsRef.get();

  let migratedCount = 0;
  let batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH_SIZE = 500;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip if already migrated
    if (data.collaborators) {
      continue;
    }

    // Skip orphan projects with no ownerId (defensive)
    const ownerId = data.ownerId;
    if (!ownerId) {
      console.warn(`Skipping project ${doc.id}: no ownerId field.`);
      continue;
    }

    batch.update(doc.ref, {
      collaborators: { [ownerId]: 'productor' },
      memberUIDs: [ownerId],
    });

    batchCount++;
    migratedCount++;

    // Commit batch when full
    if (batchCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit remaining writes
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Migration complete: ${migratedCount} projects updated with collaborators/memberUIDs.`);
  return { migratedCount };
}
