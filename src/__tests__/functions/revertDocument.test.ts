// @vitest-environment node
import { describe, it, expect } from 'vitest';

/**
 * Revert document version tests (AIGEN-V2-05).
 *
 * These are stub tests that will be implemented when Plan 03 creates
 * the revertDocumentVersion Cloud Function.
 *
 * D-09: Copy forward, not pointer. Reverting copies old version's content
 * into a NEW version (N+1) marked with triggerReason "manual_revert".
 * Version timeline is always linear and append-only.
 */

describe('revertDocumentVersion (AIGEN-V2-05)', () => {
  it('should copy target version content forward as new version N+1 (per D-09)', () => {
    // Stub: revert to version 3 when current is version 5 creates version 6
    // with content from version 3. Original v3 stays untouched in history.
    expect.fail('STUB: implement after Plan 03 creates revertDocument Cloud Function');
  });

  it('should set triggerReason to manual_revert on the new version', () => {
    // Stub: the new version entry must have triggerReason: 'manual_revert'
    // to distinguish reverts from regenerations in the version timeline
    expect.fail('STUB: implement after Plan 03 creates revertDocument Cloud Function');
  });

  it('should set triggeredBy to the authenticated user uid', () => {
    // Stub: the revert must record WHO performed it via request.auth.uid
    // for the activity log entry: "Carlos revirtio Presupuesto a version 3"
    expect.fail('STUB: implement after Plan 03 creates revertDocument Cloud Function');
  });

  it('should throw not-found error if target version does not exist', () => {
    // Stub: attempting to revert to a version number that doesn't exist
    // in the versions subcollection should throw HttpsError('not-found')
    expect.fail('STUB: implement after Plan 03 creates revertDocument Cloud Function');
  });

  it('should throw invalid-argument error if docId is not in DOCUMENT_REGISTRY', () => {
    // Stub: attempting to revert a document ID not in the 21 known documents
    // should be rejected before any Firestore reads
    expect.fail('STUB: implement after Plan 03 creates revertDocument Cloud Function');
  });

  it('should preserve the original version in history (version N not deleted)', () => {
    // Stub: D-09 requirement -- version timeline is append-only.
    // After reverting from v5 to v3, versions 1-5 must all still exist.
    // v6 is the new revert version. No versions are ever deleted by revert.
    expect.fail('STUB: implement after Plan 03 creates revertDocument Cloud Function');
  });
});
