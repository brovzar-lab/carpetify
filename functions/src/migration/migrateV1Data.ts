import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Migrates v1.0 data to v2.0 ownership model.
 *
 * 1. Adds ownerId + orgId to all projects that lack an ownerId (v1.0 projects).
 * 2. Copies ERPI settings from singleton `erpi_settings/default` to
 *    org-scoped `organizations/{orgId}/erpi_settings/default`.
 *
 * Idempotent: safe to run multiple times. Only modifies docs that haven't
 * been migrated yet (checks for absence of ownerId / org-scoped ERPI).
 *
 * Note: Firestore batch limit is 500 operations. For v1.0 Carpetify
 * (single user, up to 3 projects per period), this is more than sufficient.
 */
export async function handleV1Migration(
  userId: string,
  orgId: string,
): Promise<{ projectsMigrated: number; erpiMigrated: boolean }> {
  const db = getFirestore();
  const batch = db.batch();

  // 1. Find all projects without an ownerId (v1.0 projects)
  const projectsSnap = await db.collection('projects').get();
  let projectsMigrated = 0;

  for (const projectDoc of projectsSnap.docs) {
    const data = projectDoc.data();
    // Only migrate if no ownerId exists (idempotent -- safe to run multiple times)
    if (!data.ownerId) {
      batch.update(projectDoc.ref, {
        ownerId: userId,
        orgId: orgId,
        migratedAt: FieldValue.serverTimestamp(),
        migratedFrom: 'v1.0',
      });
      projectsMigrated++;
    }
  }

  // 2. Migrate ERPI settings from singleton to org-scoped
  let erpiMigrated = false;
  const erpiSnap = await db.collection('erpi_settings').doc('default').get();
  if (erpiSnap.exists) {
    const erpiData = erpiSnap.data();
    // Copy to org-scoped path
    const orgErpiRef = db
      .collection('organizations')
      .doc(orgId)
      .collection('erpi_settings')
      .doc('default');

    // Only copy if org-scoped path doesn't exist yet (idempotent)
    const orgErpiSnap = await orgErpiRef.get();
    if (!orgErpiSnap.exists && erpiData) {
      batch.set(orgErpiRef, {
        ...erpiData,
        migratedAt: FieldValue.serverTimestamp(),
        migratedFrom: 'erpi_settings/default',
      });
      erpiMigrated = true;
    }
  }

  // 3. Commit all changes atomically
  await batch.commit();

  return { projectsMigrated, erpiMigrated };
}
