/**
 * Cloud Function to revert a generated document to a previous version.
 * Per D-09: Copy-forward pattern -- old content becomes a NEW version (N+1).
 * Per D-10 (OVERRIDDEN): Soft cascade -- returns list of potentially affected
 *   downstream documents as a WARNING, does NOT force regeneration or mark stale.
 * Per D-12: No staleness cascade log entry (D-10 override).
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { requireAuth, requireProjectAccess } from '../auth/requireAuth.js';
import { saveGeneratedDocument } from '../pipeline/documentStore.js';
import type { DocumentId, PassId } from '../shared/types.js';
import { DOCUMENT_REGISTRY } from '../shared/types.js';
import { PASS_DEPENDENCIES } from '../staleness/dependencyGraph.js';

/**
 * Given a docId, determine which downstream documents MAY be affected by
 * a content change. This uses the pass dependency graph: if docId belongs
 * to pass P, any pass that depends on P may produce different output.
 *
 * Returns human-readable document names (Spanish) for the warning UI.
 */
function getAffectedDownstreamDocNames(docId: DocumentId): string[] {
  const entry = DOCUMENT_REGISTRY[docId];
  if (!entry) return [];

  const sourcePassId = entry.passId;
  const affectedDocNames: string[] = [];

  // Check which passes depend on the source pass
  for (const [passId, deps] of Object.entries(PASS_DEPENDENCIES)) {
    // deps is an array of UpstreamSource | PassId strings.
    // Pass-to-pass dependencies use the passId as a source name.
    const depStrings = deps as string[];
    if (depStrings.includes(sourcePassId)) {
      // This pass depends on the source pass -- list its documents
      for (const [dId, dEntry] of Object.entries(DOCUMENT_REGISTRY)) {
        if (dEntry.passId === passId && dId !== docId) {
          affectedDocNames.push(dEntry.docName);
        }
      }
    }
  }

  // Deduplicate
  return [...new Set(affectedDocNames)];
}

export const revertDocumentVersion = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
    region: 'us-central1',
  },
  async (request) => {
    const uid = requireAuth(request);
    const { projectId, docId, targetVersion } = request.data as {
      projectId: string;
      docId: string;
      targetVersion: number;
    };

    if (!projectId || !docId || targetVersion === undefined) {
      throw new HttpsError(
        'invalid-argument',
        'Se requiere projectId, docId y targetVersion.',
      );
    }

    // Validate docId is a known document
    if (!(docId in DOCUMENT_REGISTRY)) {
      throw new HttpsError('invalid-argument', 'docId no valido.');
    }

    // Validate user has access to the project
    await requireProjectAccess(uid, projectId);

    const db = getFirestore();

    // 1. Read target version from versions subcollection
    const versionSnap = await db
      .collection('projects')
      .doc(projectId)
      .collection('generated')
      .doc(docId)
      .collection('versions')
      .doc(String(targetVersion))
      .get();

    if (!versionSnap.exists) {
      throw new HttpsError('not-found', 'Version no encontrada.');
    }

    const versionData = versionSnap.data()!;

    // 2. Save as new version via saveGeneratedDocument
    //    This automatically snapshots the current document before overwrite (Plan 01)
    //    and creates version N+1 with the old content (copy-forward per D-09)
    const registryEntry = DOCUMENT_REGISTRY[docId as DocumentId];
    await saveGeneratedDocument(
      projectId,
      docId as DocumentId,
      versionData.content,
      (versionData.passId as PassId) ?? registryEntry.passId,
      versionData.promptFile ?? registryEntry.promptFile,
      versionData.modelUsed ?? '',
      uid,              // triggeredBy
      'manual_revert',  // triggerReason
    );

    // 3. Per D-10 override: Compute affected downstream docs for WARNING display.
    //    Does NOT mark passes stale or force regeneration.
    const affectedDocuments = getAffectedDownstreamDocNames(docId as DocumentId);

    return {
      success: true,
      revertedToVersion: targetVersion,
      docId,
      affectedDocuments, // Client shows non-blocking warning with these names
    };
  },
);
