// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the analyzeScreenplay Firestore write contract.
 * Uses dependency injection to provide a fake Firestore db and FieldValue,
 * avoiding the need to mock firebase-admin internals.
 */

// Mock analyzeScreenplayWithClaude using the @functions alias path
// This matches how analyzeHandler resolves the import via vitest alias
// vi.hoisted ensures the mock fn is available when vi.mock factory is hoisted
const { mockAnalyze } = vi.hoisted(() => ({
  mockAnalyze: vi.fn(),
}));
vi.mock('@functions/screenplay/analyzeWithClaude', () => ({
  analyzeScreenplayWithClaude: mockAnalyze,
}));

// Mock fs, path, url for promptLoader (transitive dependency of analyzeWithClaude)
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('mock prompt'),
}));
vi.mock('url', () => ({
  fileURLToPath: vi.fn().mockReturnValue('/mock/dir/promptLoader.ts'),
}));
vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  return {
    ...actual,
    default: {
      ...actual,
      dirname: vi.fn().mockReturnValue('/mock/dir'),
      join: vi.fn().mockReturnValue('/mock/dir/prompts/analisis_guion.md'),
    },
  };
});

// We do NOT mock firebase-admin/firestore -- we use dependency injection instead
import { handleAnalyzeScreenplay } from '@functions/screenplay/analyzeHandler';
import type { FirestoreDb, FieldValueFactory } from '@functions/screenplay/analyzeHandler';

const VALID_ANALYSIS = {
  datos_generales: { num_escenas: 45 },
  desglose_escenas: [{ numero: 1 }],
  locaciones_unicas: [{ nombre: 'Casa' }],
  personajes_detalle: [{ nombre: 'Ana' }],
  complejidad_global: {
    escenas_nocturnas: 10,
    escenas_diurnas: 35,
    escenas_exteriores: 20,
    escenas_interiores: 25,
    cambios_locacion: 8,
    escenas_stunts: 2,
    escenas_vfx: 3,
    escenas_extras_numerosos: 1,
    escenas_menores: 4,
    escenas_agua: 1,
    resumen_retos: 'Escenas complejas.',
  },
  estimacion_jornadas: {
    baja: 30,
    media: 25,
    alta: 20,
    justificacion: 'Basado en complejidad.',
  },
};

function createFakeDb() {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockUpdate = vi.fn().mockResolvedValue(undefined);
  const docSpies: Map<string, { set: typeof mockSet; update: typeof mockUpdate; get: ReturnType<typeof vi.fn> }> = new Map();

  const db: FirestoreDb = {
    doc(path: string) {
      if (!docSpies.has(path)) {
        const docSet = vi.fn().mockResolvedValue(undefined);
        const docUpdate = vi.fn().mockResolvedValue(undefined);
        const docGet = vi.fn().mockImplementation(() => {
          if (path.includes('screenplay/data')) {
            return Promise.resolve({
              exists: true,
              data: () => ({
                raw_text: 'Full screenplay text here',
                screenplay_status: 'parsed',
              }),
            });
          }
          // project document
          return Promise.resolve({
            exists: true,
            data: () => ({
              titulo_proyecto: 'Mi Pelicula',
              categoria_cinematografica: 'Ficcion',
            }),
          });
        });
        docSpies.set(path, { set: docSet, update: docUpdate, get: docGet });
      }
      const spies = docSpies.get(path)!;
      return {
        get: spies.get,
        set: spies.set,
        update: spies.update,
      };
    },
  };

  return { db, docSpies };
}

const fakeFV: FieldValueFactory = {
  serverTimestamp: () => '__SERVER_TIMESTAMP__',
};

describe('analyzeScreenplay Cloud Function - Firestore writes', () => {
  let fakeDb: ReturnType<typeof createFakeDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeDb = createFakeDb();

    // Setup analyzeWithClaude mock (success case)
    mockAnalyze.mockResolvedValue({
      analysis: VALID_ANALYSIS,
      raw_response: 'raw json string',
    });
  });

  it('writes analysis to projects/{projectId}/screenplay/analysis with required fields', async () => {
    await handleAnalyzeScreenplay('proj123', 'test-api-key', fakeDb.db, fakeFV);

    const analysisDoc = fakeDb.docSpies.get('projects/proj123/screenplay/analysis');
    expect(analysisDoc).toBeDefined();
    expect(analysisDoc!.set).toHaveBeenCalledWith(
      expect.objectContaining({
        ...VALID_ANALYSIS,
        raw_response: 'raw json string',
        analyzed_at: '__SERVER_TIMESTAMP__',
        analysis_version: 1,
      }),
    );
  });

  it('updates screenplay/data with status=analyzed, analysis_stale=false, and shooting day estimate', async () => {
    await handleAnalyzeScreenplay('proj123', 'test-api-key', fakeDb.db, fakeFV);

    const screenplayDoc = fakeDb.docSpies.get('projects/proj123/screenplay/data');
    expect(screenplayDoc).toBeDefined();
    expect(screenplayDoc!.update).toHaveBeenCalledWith(
      expect.objectContaining({
        screenplay_status: 'analyzed',
        analysis_stale: false,
        dias_rodaje_estimados: 25, // media from VALID_ANALYSIS
        last_analyzed: '__SERVER_TIMESTAMP__',
      }),
    );
  });

  it('on analysis failure, sets screenplay_status to analysis_error', async () => {
    mockAnalyze.mockRejectedValue(new Error('Claude API failed'));

    await expect(
      handleAnalyzeScreenplay('proj123', 'test-api-key', fakeDb.db, fakeFV),
    ).rejects.toThrow();

    const screenplayDoc = fakeDb.docSpies.get('projects/proj123/screenplay/data');
    expect(screenplayDoc).toBeDefined();
    expect(screenplayDoc!.update).toHaveBeenCalledWith(
      expect.objectContaining({
        screenplay_status: 'analysis_error',
      }),
    );
  });

  it('analysis document includes analysis_version field set to 1', async () => {
    await handleAnalyzeScreenplay('proj123', 'test-api-key', fakeDb.db, fakeFV);

    const analysisDoc = fakeDb.docSpies.get('projects/proj123/screenplay/analysis');
    expect(analysisDoc).toBeDefined();
    expect(analysisDoc!.set).toHaveBeenCalledWith(
      expect.objectContaining({
        analysis_version: 1,
      }),
    );
  });
});
