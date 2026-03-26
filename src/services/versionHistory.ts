import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import type { DocumentVersion, CurrentDocumentVersion } from '@/types/versioning';

/**
 * Fetch all historical versions for a document, ordered by version descending.
 * Returns versions from the subcollection `projects/{projectId}/generated/{docId}/versions`.
 */
export async function getDocumentVersions(
  projectId: string,
  docId: string,
): Promise<DocumentVersion[]> {
  const versionsRef = collection(
    db,
    `projects/${projectId}/generated/${docId}/versions`,
  );
  const q = query(versionsRef, orderBy('version', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      version: data.version ?? 0,
      content: data.editedContent ?? data.content,
      editedContent: data.editedContent ?? null,
      contentType: data.contentType ?? 'prose',
      passId: data.passId ?? '',
      generatedAt: data.generatedAt?.toDate?.() ?? null,
      archivedAt: data.archivedAt?.toDate?.() ?? null,
      triggerReason: data.triggerReason ?? 'regeneration',
      triggeredBy: data.triggeredBy ?? null,
      modelUsed: data.modelUsed ?? '',
      promptFile: data.promptFile ?? '',
    };
  });
}

/**
 * Fetch the current (active) document as a version-compatible object.
 * Used alongside historical versions for display and comparison.
 */
export async function getCurrentDocumentAsVersion(
  projectId: string,
  docId: string,
): Promise<CurrentDocumentVersion | null> {
  const docRef = doc(db, `projects/${projectId}/generated/${docId}`);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    version: data.version ?? 1,
    content: data.editedContent ?? data.content,
    editedContent: data.editedContent ?? null,
    contentType: data.contentType ?? 'prose',
    passId: data.passId ?? '',
    generatedAt: data.generatedAt?.toDate?.() ?? null,
    manuallyEdited: data.manuallyEdited ?? false,
    modelUsed: data.modelUsed ?? '',
  };
}

/**
 * Call the revertDocumentVersion Cloud Function.
 * Per D-09: copies target version content forward as new version (N+1).
 */
export async function revertDocumentVersion(
  projectId: string,
  docId: string,
  targetVersion: number,
): Promise<{ success: boolean; revertedToVersion: number }> {
  const revertFn = httpsCallable<
    { projectId: string; docId: string; targetVersion: number },
    { success: boolean; revertedToVersion: number }
  >(functions, 'revertDocumentVersion');
  const result = await revertFn({ projectId, docId, targetVersion });
  return result.data;
}
