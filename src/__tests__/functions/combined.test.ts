// @vitest-environment node
/**
 * Integration tests for Combined pass handler.
 * Verifies handleCombinedPass generates 8 documents (A1, A2, A4, A6, A10, A11, C4, PITCH)
 * with A4 as a structured template and PITCH targeting corporate CFOs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock factories so vi.mock can reference them
const { claudeMock, claudeModuleMock, docStoreMock, docStoreModuleMock } = vi.hoisted(() => {
  const generateProse = vi.fn().mockResolvedValue(
    'Contenido combinado generado de prueba en espanol mexicano profesional.',
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
      getAllGeneratedDocuments: vi.fn().mockResolvedValue([
        {
          docId: 'A7',
          content: 'Propuesta de produccion generada previamente.',
          passId: 'lineProducer',
        },
        {
          docId: 'A8a',
          content: 'Plan de rodaje generado previamente.',
          passId: 'lineProducer',
        },
      ]),
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
  loadPrompt: vi.fn().mockReturnValue('Mocked combined prompt with guardrail'),
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

import { handleCombinedPass } from '@functions/pipeline/passes/combined';
import { sampleProjectData, noopProgress } from './helpers/fixtures';

describe('handleCombinedPass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docStoreMock.savedDocs.length = 0;
  });

  it('calls getAllGeneratedDocuments to load prior outputs for cross-referencing', async () => {
    const { getAllGeneratedDocuments } = await import('@functions/pipeline/documentStore');

    await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    expect(getAllGeneratedDocuments).toHaveBeenCalledWith('proj-1');
  });

  it('calls generateProse exactly 7 times (not for A4 which is a template)', async () => {
    await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    // A4 is a template -- 7 AI-generated docs: A1, A2, A6, A10, A11, C4, PITCH
    expect(claudeMock.generateProse).toHaveBeenCalledTimes(7);
  });

  it('generates A4 as a structured template with isTemplate: true (not AI prose)', async () => {
    await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    const a4Doc = docStoreMock.savedDocs.find((d) => d.docId === 'A4');
    expect(a4Doc).toBeDefined();
    expect(a4Doc!.modelUsed).toBe('template');

    const a4Content = a4Doc!.content as Record<string, unknown>;
    expect(a4Content.isTemplate).toBe(true);
    expect(a4Content.titulo_proyecto).toBe('La Ultima Frontera');
    expect(a4Content.nombre_director).toBe('Carlos Ruiz Montoya');
    expect(Array.isArray(a4Content.sections)).toBe(true);
    expect((a4Content.sections as unknown[]).length).toBeGreaterThanOrEqual(4);
  });

  it('generates PITCH with pitch_contribuyentes tipo_documento (AIGEN-11)', async () => {
    const { loadPrompt } = await import('@functions/pipeline/promptLoader');

    await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    // Find the PITCH prompt call
    const pitchCall = vi.mocked(loadPrompt).mock.calls.find(
      (call) =>
        (call[1] as Record<string, unknown>).tipo_documento === 'pitch_contribuyentes',
    );
    expect(pitchCall).toBeDefined();
    expect(pitchCall![0]).toBe('documentos_combinados.md');
  });

  it('saves all 8 documents with passId "combined"', async () => {
    await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    expect(docStoreMock.savedDocs).toHaveLength(8);

    const docIds = docStoreMock.savedDocs.map((d) => d.docId).sort();
    expect(docIds).toEqual(['A1', 'A10', 'A11', 'A2', 'A4', 'A6', 'C4', 'PITCH']);

    // All should have passId "combined"
    for (const doc of docStoreMock.savedDocs) {
      expect(doc.passId).toBe('combined');
    }
  });

  it('uses correct prompt files for each document', async () => {
    await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    // A1 uses a1_resumen_ejecutivo.md
    const a1Doc = docStoreMock.savedDocs.find((d) => d.docId === 'A1');
    expect(a1Doc!.promptFile).toBe('a1_resumen_ejecutivo.md');

    // A2 uses a2_sinopsis.md
    const a2Doc = docStoreMock.savedDocs.find((d) => d.docId === 'A2');
    expect(a2Doc!.promptFile).toBe('a2_sinopsis.md');

    // A10 uses a10_propuesta_exhibicion.md
    const a10Doc = docStoreMock.savedDocs.find((d) => d.docId === 'A10');
    expect(a10Doc!.promptFile).toBe('a10_propuesta_exhibicion.md');

    // A6, A11, C4, PITCH use documentos_combinados.md
    for (const docId of ['A6', 'A11', 'C4', 'PITCH']) {
      const doc = docStoreMock.savedDocs.find((d) => d.docId === docId);
      expect(doc!.promptFile).toBe('documentos_combinados.md');
    }

    // A4 also uses documentos_combinados.md
    const a4Doc = docStoreMock.savedDocs.find((d) => d.docId === 'A4');
    expect(a4Doc!.promptFile).toBe('documentos_combinados.md');
  });

  it('returns completedDocs with all 8 doc IDs', async () => {
    const result = await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    expect(result.success).toBe(true);
    expect(result.completedDocs).toHaveLength(8);
    expect(result.completedDocs.sort()).toEqual([
      'A1', 'A10', 'A11', 'A2', 'A4', 'A6', 'C4', 'PITCH',
    ]);
  });

  it('calls onProgress for each document with generating and complete statuses', async () => {
    const progressCalls: unknown[] = [];
    const trackProgress = (chunk: unknown) => progressCalls.push(chunk);

    await handleCombinedPass('proj-1', sampleProjectData as never, trackProgress);

    // 8 documents x 2 progress events (generating + complete) = 16
    expect(progressCalls.length).toBe(16);

    // Each document should have both generating and complete
    const docIds = ['A1', 'A2', 'A4', 'A6', 'A10', 'A11', 'C4', 'PITCH'];
    for (const docId of docIds) {
      const generating = progressCalls.find(
        (c: unknown) =>
          (c as Record<string, string>).docId === docId &&
          (c as Record<string, string>).status === 'generating',
      );
      const complete = progressCalls.find(
        (c: unknown) =>
          (c as Record<string, string>).docId === docId &&
          (c as Record<string, string>).status === 'complete',
      );
      expect(generating).toBeDefined();
      expect(complete).toBeDefined();
    }
  });

  it('calls markPassComplete with "combined" after all documents generated', async () => {
    const { markPassComplete } = await import('@functions/staleness/stalenessTracker');

    await handleCombinedPass('proj-1', sampleProjectData as never, noopProgress);

    expect(markPassComplete).toHaveBeenCalledWith('proj-1', 'combined');
  });
});
