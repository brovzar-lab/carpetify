// @vitest-environment node
/**
 * Integration tests for Legal pass handler.
 * Verifies handleLegalPass generates 5 documents (B3-prod, B3-dir, C2b, C3a, C3b)
 * with fee amounts injected from intake team data, not AI-generated.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock factories so vi.mock can reference them
const { claudeMock, claudeModuleMock, docStoreMock, docStoreModuleMock } = vi.hoisted(() => {
  const generateProse = vi.fn().mockResolvedValue(
    'Contenido legal generado de prueba en espanol mexicano profesional.',
  );
  const generateStructured = vi.fn().mockResolvedValue({});

  const savedDocs: Array<{
    projectId: string;
    docId: string;
    content: unknown;
    passId: string;
    promptFile: string;
    modelUsed: string;
  }> = [];

  return {
    claudeMock: { generateProse, generateStructured },
    claudeModuleMock: () => ({
      initClaudeClient: vi.fn(),
      getClaudeClient: vi.fn(),
      generateProse,
      generateStructured,
    }),
    docStoreMock: { savedDocs },
    docStoreModuleMock: () => ({
      saveGeneratedDocument: vi.fn().mockImplementation(
        (
          projectId: string,
          docId: string,
          content: unknown,
          passId: string,
          promptFile: string,
          modelUsed: string,
        ) => {
          savedDocs.push({ projectId, docId, content, passId, promptFile, modelUsed });
          return Promise.resolve();
        },
      ),
      getGeneratedDocument: vi.fn().mockResolvedValue(null),
      getAllGeneratedDocuments: vi.fn().mockResolvedValue([]),
      storeBudgetOutputForDownstream: vi.fn().mockResolvedValue(undefined),
      loadBudgetOutput: vi.fn().mockResolvedValue({
        cuentas: [],
        totalCentavos: 800000000,
        totalFormatted: '$8,000,000 MXN',
      }),
    }),
  };
});

vi.mock('@functions/claude/client', () => claudeModuleMock());
vi.mock('@functions/pipeline/documentStore', () => docStoreModuleMock());
vi.mock('@functions/pipeline/promptLoader', () => ({
  loadPrompt: vi.fn().mockReturnValue('Mocked legal prompt with guardrail'),
}));
vi.mock('@functions/staleness/stalenessTracker', () => ({
  markPassComplete: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@functions/pipeline/concurrencyPool', () => ({
  createConcurrencyPool: () => ({
    run: <T>(fn: () => Promise<T>): Promise<T> => fn(),
    get pendingCount() { return 0; },
    get activeCount() { return 0; },
  }),
}));

import { handleLegalPass } from '@functions/pipeline/passes/legal';
import { sampleProjectData, sampleBudgetOutput, noopProgress } from './helpers/fixtures';

describe('handleLegalPass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docStoreMock.savedDocs.length = 0;
  });

  it('calls loadBudgetOutput and throws if null', async () => {
    // Override loadBudgetOutput to return null
    const { loadBudgetOutput } = await import('@functions/pipeline/documentStore');
    vi.mocked(loadBudgetOutput).mockResolvedValueOnce(null);

    await expect(
      handleLegalPass('proj-1', sampleProjectData as never, noopProgress),
    ).rejects.toThrow('Primero ejecuta el Paso 2');
  });

  it('calls generateProse exactly 5 times (one per legal doc)', async () => {
    await handleLegalPass('proj-1', sampleProjectData as never, noopProgress);

    expect(claudeMock.generateProse).toHaveBeenCalledTimes(5);
  });

  it('saves all 5 documents with passId "legal" and promptFile "documentos_legales.md"', async () => {
    await handleLegalPass('proj-1', sampleProjectData as never, noopProgress);

    expect(docStoreMock.savedDocs).toHaveLength(5);

    const docIds = docStoreMock.savedDocs.map((d) => d.docId).sort();
    expect(docIds).toEqual(['B3-dir', 'B3-prod', 'C2b', 'C3a', 'C3b']);

    // All should have passId "legal"
    for (const doc of docStoreMock.savedDocs) {
      expect(doc.passId).toBe('legal');
      expect(doc.promptFile).toBe('documentos_legales.md');
    }
  });

  it('injects formatMXNLegal fees from project.team into prompt variables', async () => {
    const { loadPrompt } = await import('@functions/pipeline/promptLoader');

    await handleLegalPass('proj-1', sampleProjectData as never, noopProgress);

    // loadPrompt should have been called 5 times
    expect(loadPrompt).toHaveBeenCalledTimes(5);

    // Check that producer contract includes honorarios from team data
    const producerCall = vi.mocked(loadPrompt).mock.calls.find(
      (call) => (call[1] as Record<string, unknown>).tipo_contrato === 'productor',
    );
    expect(producerCall).toBeDefined();
    const producerVars = producerCall![1] as Record<string, unknown>;
    // Producer honorarios: 50000000 centavos = $500,000.00
    expect(producerVars.honorarios_productor).toContain('500,000');
    expect(producerVars.nombre_contratado).toBe('Ana Lopez Hernandez');

    // Check director contract
    const directorCall = vi.mocked(loadPrompt).mock.calls.find(
      (call) => (call[1] as Record<string, unknown>).tipo_contrato === 'director',
    );
    expect(directorCall).toBeDefined();
    const directorVars = directorCall![1] as Record<string, unknown>;
    // Director honorarios: 40000000 centavos = $400,000.00
    expect(directorVars.honorarios_director).toContain('400,000');
    expect(directorVars.nombre_contratado).toBe('Carlos Ruiz Montoya');
  });

  it('injects ERPI company data (razon_social, rfc) into prompt variables', async () => {
    const { loadPrompt } = await import('@functions/pipeline/promptLoader');

    await handleLegalPass('proj-1', sampleProjectData as never, noopProgress);

    // All 5 calls should include ERPI company data
    for (const call of vi.mocked(loadPrompt).mock.calls) {
      const vars = call[1] as Record<string, unknown>;
      expect(vars.razon_social).toBe('Lemon Studios S.A. de C.V.');
      expect(vars.rfc).toBe('LST200101ABC');
      expect(vars.representante_legal).toBe('Juan Perez Martinez');
      expect(vars.domicilio_fiscal).toBe('Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, C.P. 03100');
    }
  });

  it('returns { success: true, completedDocs } with all 5 doc IDs', async () => {
    const result = await handleLegalPass('proj-1', sampleProjectData as never, noopProgress);

    expect(result.success).toBe(true);
    expect(result.completedDocs).toHaveLength(5);
    expect(result.completedDocs.sort()).toEqual(['B3-dir', 'B3-prod', 'C2b', 'C3a', 'C3b']);
  });

  it('calls onProgress for each document with generating and complete statuses', async () => {
    const progressCalls: unknown[] = [];
    const trackProgress = (chunk: unknown) => progressCalls.push(chunk);

    await handleLegalPass('proj-1', sampleProjectData as never, trackProgress);

    // 5 documents x 2 progress events (generating + complete) = 10
    expect(progressCalls.length).toBe(10);

    // Each document should have both generating and complete
    const docIds = ['B3-prod', 'B3-dir', 'C2b', 'C3a', 'C3b'];
    for (const docId of docIds) {
      const generating = progressCalls.find(
        (c: unknown) => (c as Record<string, string>).docId === docId && (c as Record<string, string>).status === 'generating',
      );
      const complete = progressCalls.find(
        (c: unknown) => (c as Record<string, string>).docId === docId && (c as Record<string, string>).status === 'complete',
      );
      expect(generating).toBeDefined();
      expect(complete).toBeDefined();
    }
  });
});
