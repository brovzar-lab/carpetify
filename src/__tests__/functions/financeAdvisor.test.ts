// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for mock factories that reference variables
const {
  claudeModuleMock,
  claudeMock,
  docStoreModuleMock,
  savedDocs,
  loadBudgetOutputMock,
} = vi.hoisted(() => {
  const _savedDocs: Array<{
    projectId: string;
    docId: string;
    content: unknown;
    passId: string;
  }> = [];

  const _claudeMock = {
    generateProse: vi.fn().mockResolvedValue(
      'Contenido financiero generado de prueba en espanol mexicano.',
    ),
    generateStructured: vi.fn().mockResolvedValue({}),
  };

  // Default: returns a valid budget output (lineProducer has run)
  const _loadBudgetOutputMock = vi.fn();

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
      storeBudgetOutputForDownstream: vi.fn().mockResolvedValue(undefined),
      loadBudgetOutput: _loadBudgetOutputMock,
    }),
    savedDocs: _savedDocs,
    loadBudgetOutputMock: _loadBudgetOutputMock,
  };
});

// Mock modules before import
vi.mock('@functions/claude/client', () => claudeModuleMock());
vi.mock('@functions/pipeline/documentStore', () => docStoreModuleMock());
vi.mock('@functions/staleness/stalenessTracker', () => ({
  markPassComplete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@functions/pipeline/promptLoader', () => ({
  loadPrompt: vi.fn().mockReturnValue('Mocked financial system prompt content'),
  validatePromptVariables: vi.fn().mockReturnValue([]),
}));

vi.mock('@functions/pipeline/concurrencyPool', () => ({
  createConcurrencyPool: vi.fn().mockReturnValue({
    run: <T>(fn: () => Promise<T>) => fn(),
    get pendingCount() { return 0; },
    get activeCount() { return 0; },
  }),
}));

// Mock firebase-functions/v2/https (needed by financeAdvisor.ts for HttpsError)
vi.mock('firebase-functions/v2/https', () => {
  class MockHttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  }
  return {
    HttpsError: MockHttpsError,
    onCall: vi.fn(),
  };
});

import { handleFinanceAdvisorPass } from '@functions/pipeline/passes/financeAdvisor';
import { sampleProjectData, sampleBudgetOutput, noopProgress } from './helpers/fixtures';
import type { ProjectDataForGeneration } from '@functions/pipeline/orchestrator';

describe('handleFinanceAdvisorPass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedDocs.length = 0;
    claudeMock.generateProse.mockResolvedValue(
      'Contenido financiero generado de prueba en espanol mexicano.',
    );
    // Default: lineProducer has run, budget exists
    loadBudgetOutputMock.mockResolvedValue(sampleBudgetOutput);
  });

  it('should throw if loadBudgetOutput returns null (lineProducer not run)', async () => {
    loadBudgetOutputMock.mockResolvedValue(null);

    await expect(
      handleFinanceAdvisorPass(
        'test-project-id',
        sampleProjectData as unknown as ProjectDataForGeneration,
        noopProgress,
      ),
    ).rejects.toThrow('Primero ejecuta el Paso 2 (Line Producer)');
  });

  it('should call buildCashFlow with the loaded budget output', async () => {
    await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    // A9d should contain structured cash flow data
    const a9dDoc = savedDocs.find((d) => d.docId === 'A9d');
    expect(a9dDoc).toBeDefined();
    const a9dContent = a9dDoc!.content as { prose: string; structured: { months: string[]; rows: unknown[]; grandTotal: number } };
    expect(a9dContent.structured).toHaveProperty('months');
    expect(a9dContent.structured).toHaveProperty('rows');
    expect(a9dContent.structured).toHaveProperty('grandTotal');
    // grandTotal should be a positive number derived from budget accounts
    expect(a9dContent.structured.grandTotal).toBeGreaterThan(0);
    // Months array should have 12 entries (standard production timeline)
    expect(a9dContent.structured.months).toHaveLength(12);
  });

  it('should call computeFinancialScheme with financials and budget', async () => {
    await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    // E1 should contain structured financial scheme data
    const e1Doc = savedDocs.find((d) => d.docId === 'E1');
    expect(e1Doc).toBeDefined();
    const e1Content = e1Doc!.content as { prose: string; structured: { sources: unknown[]; total_centavos: number } };
    expect(e1Content.structured).toHaveProperty('sources');
    expect(e1Content.structured).toHaveProperty('total_centavos');
    // total_centavos should equal budget total (golden equation)
    expect(e1Content.structured.total_centavos).toBe(sampleBudgetOutput.totalCentavos);
  });

  it('should call generateProse exactly 3 times (A9d, E1, E2)', async () => {
    await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(claudeMock.generateProse).toHaveBeenCalledTimes(3);
  });

  it('should save all 3 documents via saveGeneratedDocument with passId "financeAdvisor"', async () => {
    await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(savedDocs).toHaveLength(3);
    const docIds = savedDocs.map((d) => d.docId).sort();
    expect(docIds).toEqual(['A9d', 'E1', 'E2']);

    for (const doc of savedDocs) {
      expect(doc.passId).toBe('financeAdvisor');
    }
  });

  it('should store A9d and E1 with both prose and structured data', async () => {
    await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    const a9dDoc = savedDocs.find((d) => d.docId === 'A9d');
    const e1Doc = savedDocs.find((d) => d.docId === 'E1');
    const e2Doc = savedDocs.find((d) => d.docId === 'E2');

    // A9d and E1 should have { prose, structured } shape
    expect(a9dDoc!.content).toHaveProperty('prose');
    expect(a9dDoc!.content).toHaveProperty('structured');
    expect(e1Doc!.content).toHaveProperty('prose');
    expect(e1Doc!.content).toHaveProperty('structured');

    // E2 is pure prose (string), not structured
    expect(typeof e2Doc!.content).toBe('string');
  });

  it('should call onProgress for each document with generating and complete statuses', async () => {
    const progressCalls: Array<{ docId: string; status: string }> = [];
    const trackProgress = (chunk: { type: string; docId: string; status: string }) => {
      progressCalls.push({ docId: chunk.docId, status: chunk.status });
    };

    await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      trackProgress,
    );

    const docs = ['A9d', 'E1', 'E2'];
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

  it('should call markPassComplete with "financeAdvisor"', async () => {
    const { markPassComplete } = await import('@functions/staleness/stalenessTracker');

    await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(markPassComplete).toHaveBeenCalledWith('test-project-id', 'financeAdvisor');
  });

  it('should return success with all 3 completed documents', async () => {
    const result = await handleFinanceAdvisorPass(
      'test-project-id',
      sampleProjectData as unknown as ProjectDataForGeneration,
      noopProgress,
    );

    expect(result.success).toBe(true);
    expect(result.completedDocs).toHaveLength(3);
    expect(result.completedDocs).toContain('A9d');
    expect(result.completedDocs).toContain('E1');
    expect(result.completedDocs).toContain('E2');
  });
});
