// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for mock factories that reference variables
const { claudeModuleMock, claudeMock, docStoreModuleMock, savedDocs } = vi.hoisted(() => {
  const _savedDocs: Array<{
    projectId: string;
    docId: string;
    content: unknown;
    passId: string;
  }> = [];

  const _claudeMock = {
    generateProse: vi.fn().mockResolvedValue(
      'Contenido generado de prueba en espanol mexicano profesional.',
    ),
    generateStructured: vi.fn().mockResolvedValue({}),
  };

  const _storeBudgetOutputForDownstream = vi.fn().mockResolvedValue(undefined);
  const _saveGeneratedDocument = vi.fn().mockImplementation(
    (projectId: string, docId: string, content: unknown, passId: string) => {
      _savedDocs.push({ projectId, docId, content, passId });
      return Promise.resolve();
    },
  );

  return {
    claudeMock: _claudeMock,
    claudeModuleMock: () => ({
      initClaudeClient: vi.fn(),
      getClaudeClient: vi.fn(),
      generateProse: _claudeMock.generateProse,
      generateStructured: _claudeMock.generateStructured,
    }),
    docStoreModuleMock: () => ({
      saveGeneratedDocument: _saveGeneratedDocument,
      getGeneratedDocument: vi.fn().mockResolvedValue(null),
      getAllGeneratedDocuments: vi.fn().mockResolvedValue([]),
      storeBudgetOutputForDownstream: _storeBudgetOutputForDownstream,
      loadBudgetOutput: vi.fn().mockResolvedValue(null),
    }),
    savedDocs: _savedDocs,
  };
});

// Mock modules before import
vi.mock('@functions/claude/client', () => claudeModuleMock());
vi.mock('@functions/pipeline/documentStore', () => docStoreModuleMock());
vi.mock('@functions/staleness/stalenessTracker', () => ({
  markPassComplete: vi.fn().mockResolvedValue(undefined),
}));

// Mock promptLoader to avoid filesystem reads
vi.mock('@functions/pipeline/promptLoader', () => ({
  loadPrompt: vi.fn().mockReturnValue('Mocked system prompt content'),
  validatePromptVariables: vi.fn().mockReturnValue([]),
}));

// Mock concurrencyPool to run tasks immediately (no actual concurrency limiting in tests)
vi.mock('@functions/pipeline/concurrencyPool', () => ({
  createConcurrencyPool: vi.fn().mockReturnValue({
    run: <T>(fn: () => Promise<T>) => fn(),
    get pendingCount() { return 0; },
    get activeCount() { return 0; },
  }),
}));

import { handleLineProducerPass } from '@functions/pipeline/passes/lineProducer';
import { sampleProjectData, noopProgress } from './helpers/fixtures';
import type { ProjectDataForGeneration } from '@functions/pipeline/orchestrator';

describe('handleLineProducerPass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedDocs.length = 0;
    claudeMock.generateProse.mockResolvedValue(
      'Contenido generado de prueba en espanol mexicano profesional.',
    );
  });

  it('should call generateProse exactly 4 times (A7, A8a, A8b, A9a) -- not for A9b which is deterministic', async () => {
    const result = await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(result.success).toBe(true);
    // A7, A8a, A8b use generateProse; A9a also uses generateProse for the summary narrative
    // A9b is deterministic (pure budget output), no AI call
    expect(claudeMock.generateProse).toHaveBeenCalledTimes(4);
  });

  it('should store A9b with BudgetOutput content (not AI-generated)', async () => {
    await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    const a9bDoc = savedDocs.find((d) => d.docId === 'A9b');
    expect(a9bDoc).toBeDefined();
    // A9b content should be a BudgetOutput object, not a string
    expect(typeof a9bDoc!.content).toBe('object');
    expect(a9bDoc!.content).toHaveProperty('cuentas');
    expect(a9bDoc!.content).toHaveProperty('totalCentavos');
    expect(a9bDoc!.content).toHaveProperty('totalFormatted');
  });

  it('should call storeBudgetOutputForDownstream with the computed budget', async () => {
    const { storeBudgetOutputForDownstream } = await import('@functions/pipeline/documentStore');

    await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(storeBudgetOutputForDownstream).toHaveBeenCalledTimes(1);
    expect(storeBudgetOutputForDownstream).toHaveBeenCalledWith(
      'test-project-id',
      expect.objectContaining({
        cuentas: expect.any(Array),
        totalCentavos: expect.any(Number),
        totalFormatted: expect.any(String),
      }),
    );
  });

  it('should return success with all 5 completed documents', async () => {
    const result = await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(result.success).toBe(true);
    expect(result.completedDocs).toHaveLength(5);
    expect(result.completedDocs).toContain('A7');
    expect(result.completedDocs).toContain('A8a');
    expect(result.completedDocs).toContain('A8b');
    expect(result.completedDocs).toContain('A9a');
    expect(result.completedDocs).toContain('A9b');
  });

  it('should save all 5 documents via saveGeneratedDocument with correct passId "lineProducer"', async () => {
    await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(savedDocs).toHaveLength(5);
    const docIds = savedDocs.map((d) => d.docId).sort();
    expect(docIds).toEqual(['A7', 'A8a', 'A8b', 'A9a', 'A9b']);

    // All should have passId "lineProducer"
    for (const doc of savedDocs) {
      expect(doc.passId).toBe('lineProducer');
    }
  });

  it('should call onProgress for each document with both "generating" and "complete" statuses', async () => {
    const progressCalls: Array<{ docId: string; status: string }> = [];
    const trackProgress = (chunk: { type: string; docId: string; status: string }) => {
      progressCalls.push({ docId: chunk.docId, status: chunk.status });
    };

    await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      trackProgress,
    );

    // Each of 5 documents should have "generating" and "complete" progress
    const docs = ['A7', 'A8a', 'A8b', 'A9a', 'A9b'];
    for (const docId of docs) {
      const generating = progressCalls.find(
        (c) => c.docId === docId && c.status === 'generating',
      );
      const complete = progressCalls.find(
        (c) => c.docId === docId && c.status === 'complete',
      );
      expect(generating).toBeDefined();
      expect(complete).toBeDefined();
    }
  });

  it('should call markPassComplete with "lineProducer"', async () => {
    const { markPassComplete } = await import('@functions/staleness/stalenessTracker');

    await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(markPassComplete).toHaveBeenCalledWith('test-project-id', 'lineProducer');
  });

  it('should use computeBudget with project data for budget computation', async () => {
    await handleLineProducerPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    // The budget stored as A9b should have IMCINE account structure
    const a9bDoc = savedDocs.find((d) => d.docId === 'A9b');
    const budgetContent = a9bDoc!.content as { cuentas: Array<{ numeroCuenta: number }>; totalCentavos: number };

    // Should have 12 IMCINE accounts
    expect(budgetContent.cuentas).toHaveLength(12);
    // First account should be 100 (Guion y Argumento)
    expect(budgetContent.cuentas[0].numeroCuenta).toBe(100);
    // Total should be a positive number
    expect(budgetContent.totalCentavos).toBeGreaterThan(0);
  });
});
