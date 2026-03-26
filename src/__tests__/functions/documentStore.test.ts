// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Version snapshot tests for saveGeneratedDocument (AIGEN-V2-03).
 *
 * Verifies that saveGeneratedDocument:
 * 1. Snapshots previous version to versions subcollection before overwrite
 * 2. Includes all required DocumentVersion fields in the snapshot
 * 3. Prunes oldest version when 10 exist (D-04)
 * 4. Uses batched write for prune + archive atomicity (D-04)
 * 5. Handles first-time save with no existing document
 * 6. Snapshots editedContent when present, falling back to content
 */

// ---- Mock setup ----

const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatch = vi.fn(() => ({
  set: mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));

const mockDocGet = vi.fn();
const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockVersionDocRef = { id: 'version-doc-ref' };
const mockVersionsDoc = vi.fn(() => mockVersionDocRef);
const mockOrderByGet = vi.fn();
const mockOrderBy = vi.fn(() => ({ get: mockOrderByGet }));
const mockVersionsCollection = vi.fn(() => ({
  doc: mockVersionsDoc,
  orderBy: mockOrderBy,
}));

const mockDocRef = {
  get: mockDocGet,
  set: mockDocSet,
  collection: mockVersionsCollection,
};

// Chain: db.collection('projects').doc(projectId).collection('generated').doc(docId)
const mockGeneratedDoc = vi.fn(() => mockDocRef);
const mockGeneratedCollection = vi.fn(() => ({ doc: mockGeneratedDoc }));
const mockProjectDoc = vi.fn(() => ({ collection: mockGeneratedCollection }));
const mockProjectsCollection = vi.fn(() => ({ doc: mockProjectDoc }));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: mockProjectsCollection,
    batch: mockBatch,
  })),
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
}));

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApp: vi.fn(),
}));

// Mock budgetComputer since documentStore.ts imports BudgetOutput type from it
vi.mock('@functions/financial/budgetComputer', () => ({}));

describe('saveGeneratedDocument - version snapshots (AIGEN-V2-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock implementations
    mockDocSet.mockResolvedValue(undefined);
    mockBatchCommit.mockResolvedValue(undefined);
  });

  it('should snapshot previous version to versions subcollection before overwrite', async () => {
    // Configure existing doc at version 2
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        content: 'old content',
        editedContent: null,
        version: 2,
        contentType: 'prose',
        passId: 'lineProducer',
        generatedAt: null,
        modelUsed: 'claude',
        promptFile: 'a7.md',
      }),
    });

    // Under 10 versions -- no prune needed
    mockOrderByGet.mockResolvedValue({ size: 2, docs: [] });

    const { saveGeneratedDocument } = await import('@functions/pipeline/documentStore');

    await saveGeneratedDocument(
      'proj-1', 'A7' as never, 'new content', 'lineProducer' as never,
      'a7.md', 'claude-haiku', 'user-1', 'regeneration',
    );

    // Verify version snapshot was written via batch
    expect(mockBatchSet).toHaveBeenCalledWith(
      mockVersionDocRef,
      expect.objectContaining({ content: 'old content', version: 2 }),
    );

    // Verify batch was committed (archive step)
    expect(mockBatchCommit).toHaveBeenCalled();

    // Verify new version was written AFTER batch (docRef.set)
    expect(mockDocSet).toHaveBeenCalled();
  });

  it('should include all required fields in version entry', async () => {
    // Configure existing doc with all fields
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        content: 'original content',
        editedContent: null,
        contentType: 'prose',
        version: 3,
        passId: 'lineProducer',
        generatedAt: null,
        modelUsed: 'claude-haiku-4-5',
        promptFile: 'a7_propuesta_produccion.md',
      }),
    });

    mockOrderByGet.mockResolvedValue({ size: 0, docs: [] });

    const { saveGeneratedDocument } = await import('@functions/pipeline/documentStore');

    await saveGeneratedDocument(
      'proj-1', 'A7' as never, 'new content', 'lineProducer' as never,
      'a7.md', 'claude-haiku', 'user-1', 'regeneration',
    );

    // Capture the version doc data (second argument to mockBatchSet)
    expect(mockBatchSet).toHaveBeenCalledTimes(1);
    const versionDocData = mockBatchSet.mock.calls[0][1];

    // Assert all 11 DocumentVersion fields are present
    expect(versionDocData).toHaveProperty('content');
    expect(versionDocData).toHaveProperty('editedContent');
    expect(versionDocData).toHaveProperty('contentType');
    expect(versionDocData).toHaveProperty('version');
    expect(versionDocData).toHaveProperty('passId');
    expect(versionDocData).toHaveProperty('generatedAt');
    expect(versionDocData).toHaveProperty('archivedAt');
    expect(versionDocData).toHaveProperty('triggerReason');
    expect(versionDocData).toHaveProperty('triggeredBy');
    expect(versionDocData).toHaveProperty('modelUsed');
    expect(versionDocData).toHaveProperty('promptFile');

    // Verify specific field values
    expect(versionDocData.content).toBe('original content');
    expect(versionDocData.editedContent).toBe(null);
    expect(versionDocData.contentType).toBe('prose');
    expect(versionDocData.version).toBe(3);
    expect(versionDocData.passId).toBe('lineProducer');
    expect(versionDocData.archivedAt).toBe('SERVER_TS');
    expect(versionDocData.triggerReason).toBe('regeneration');
    expect(versionDocData.triggeredBy).toBe('user-1');
  });

  it('should delete oldest version when 10 versions exist (prune logic per D-04)', async () => {
    // Configure existing doc
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        content: 'current content',
        editedContent: null,
        version: 11,
        contentType: 'prose',
        passId: 'lineProducer',
        generatedAt: null,
        modelUsed: 'claude',
        promptFile: 'a7.md',
      }),
    });

    // 10 versions exist -- oldest must be pruned
    const oldestRef = { id: 'oldest-version-ref' };
    mockOrderByGet.mockResolvedValue({
      size: 10,
      docs: [
        { ref: oldestRef },
        { ref: { id: 'v2' } },
        { ref: { id: 'v3' } },
        { ref: { id: 'v4' } },
        { ref: { id: 'v5' } },
        { ref: { id: 'v6' } },
        { ref: { id: 'v7' } },
        { ref: { id: 'v8' } },
        { ref: { id: 'v9' } },
        { ref: { id: 'v10' } },
      ],
    });

    const { saveGeneratedDocument } = await import('@functions/pipeline/documentStore');

    await saveGeneratedDocument(
      'proj-1', 'A7' as never, 'new content', 'lineProducer' as never,
      'a7.md', 'claude-haiku', 'user-1', 'regeneration',
    );

    // Verify oldest version was deleted
    expect(mockBatchDelete).toHaveBeenCalledWith(oldestRef);

    // Verify archive still happened
    expect(mockBatchSet).toHaveBeenCalled();

    // Verify batch was committed (both operations in same batch)
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it('should use batched write for archive + prune atomicity (per D-04)', async () => {
    // Configure existing doc
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        content: 'current content',
        editedContent: null,
        version: 11,
        contentType: 'prose',
        passId: 'lineProducer',
        generatedAt: null,
        modelUsed: 'claude',
        promptFile: 'a7.md',
      }),
    });

    // 10 versions -- triggers prune
    const oldestRef = { id: 'oldest' };
    mockOrderByGet.mockResolvedValue({
      size: 10,
      docs: [
        { ref: oldestRef },
        ...Array.from({ length: 9 }, (_, i) => ({ ref: { id: `v${i + 2}` } })),
      ],
    });

    const { saveGeneratedDocument } = await import('@functions/pipeline/documentStore');

    await saveGeneratedDocument(
      'proj-1', 'A7' as never, 'new content', 'lineProducer' as never,
      'a7.md', 'claude-haiku', 'user-1', 'regeneration',
    );

    // Exactly one batch created
    expect(mockBatch).toHaveBeenCalledTimes(1);

    // Exactly one delete (oldest version)
    expect(mockBatchDelete).toHaveBeenCalledTimes(1);

    // Exactly one set (archive current version)
    expect(mockBatchSet).toHaveBeenCalledTimes(1);

    // Exactly one commit (atomic: both delete and set in same batch)
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('should handle first-time save with no existing document (no snapshot needed)', async () => {
    // No existing document
    mockDocGet.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    const { saveGeneratedDocument } = await import('@functions/pipeline/documentStore');

    await saveGeneratedDocument(
      'proj-1', 'A7' as never, 'first content', 'lineProducer' as never,
      'a7.md', 'claude-haiku', 'user-1', 'pipeline_run',
    );

    // No snapshot should be archived (nothing to archive)
    expect(mockBatchSet).not.toHaveBeenCalled();

    // No batch commit needed
    expect(mockBatchCommit).not.toHaveBeenCalled();

    // Versions subcollection should not be accessed
    expect(mockVersionsCollection).not.toHaveBeenCalled();

    // New document should be written with version 1
    expect(mockDocSet).toHaveBeenCalledWith(
      expect.objectContaining({ version: 1 }),
    );
  });

  it('should snapshot editedContent when present, falling back to content', async () => {
    // Configure existing doc with editedContent present
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        content: 'original AI content',
        editedContent: 'manually edited text',
        contentType: 'prose',
        version: 5,
        passId: 'lineProducer',
        generatedAt: null,
        modelUsed: 'claude',
        promptFile: 'a7.md',
      }),
    });

    mockOrderByGet.mockResolvedValue({ size: 0, docs: [] });

    const { saveGeneratedDocument } = await import('@functions/pipeline/documentStore');

    await saveGeneratedDocument(
      'proj-1', 'A7' as never, 'new AI content', 'lineProducer' as never,
      'a7.md', 'claude-haiku', 'user-1', 'regeneration',
    );

    // Capture the version doc data from mockBatchSet
    const versionDocData = mockBatchSet.mock.calls[0][1];

    // Per line 68 of documentStore.ts: editedContent ?? content
    // When editedContent exists, content field in snapshot = editedContent
    expect(versionDocData.content).toBe('manually edited text');

    // editedContent preserved for fidelity
    expect(versionDocData.editedContent).toBe('manually edited text');
  });
});
