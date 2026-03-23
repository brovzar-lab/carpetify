// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track Firestore writes
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockGet = vi.fn();
const mockDocFn = vi.fn().mockImplementation((path: string) => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  path,
}));

// Mock firebase-admin/firestore
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    doc: mockDocFn,
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => '__SERVER_TIMESTAMP__'),
  },
}));

// Mock firebase-admin/storage
vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        download: vi.fn().mockResolvedValue([Buffer.from('fake-pdf')]),
      })),
    })),
  })),
}));

// Mock firebase-admin/app
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

// Mock firebase-functions/params for defineSecret
const mockSecretValue = vi.fn(() => 'test-api-key');
vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn(() => ({
    value: mockSecretValue,
  })),
}));

// Mock the analyzeScreenplayWithClaude function
const mockAnalyze = vi.fn();
vi.mock('@functions/screenplay/analyzeWithClaude', () => ({
  analyzeScreenplayWithClaude: mockAnalyze,
}));

// Mock firebase-functions/v2/https to capture the onCall handler
let capturedHandler: ((request: unknown) => Promise<unknown>) | null = null;
vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((_config: unknown, handler: (request: unknown) => Promise<unknown>) => {
    capturedHandler = handler;
    return handler;
  }),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

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

describe('analyzeScreenplay Cloud Function - Firestore writes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    capturedHandler = null;

    // Setup default mock responses for Firestore reads
    mockGet.mockImplementation(function (this: { path: string }) {
      // Need to handle based on the doc path
      return Promise.resolve({
        exists: true,
        data: () => ({
          raw_text: 'Full screenplay text here',
          titulo_proyecto: 'Mi Pelicula',
          categoria_cinematografica: 'Ficcion',
        }),
      });
    });

    // Setup analyzeWithClaude mock
    mockAnalyze.mockResolvedValue({
      analysis: VALID_ANALYSIS,
      raw_response: 'raw json string',
    });

    // Re-import to trigger onCall registration
    // We need to dynamically import to capture the handler
    await import('@functions/index');
  });

  it('writes analysis to projects/{projectId}/screenplay/analysis with required fields', async () => {
    expect(capturedHandler).not.toBeNull();

    await capturedHandler!({ data: { projectId: 'proj123' } });

    // Find the set() call for the analysis document
    const analysisCalls = mockSet.mock.calls.filter((_call: unknown[], _i: number) => {
      const docPath = mockDocFn.mock.calls.find(
        (c: string[]) => c[0]?.includes('screenplay/analysis'),
      );
      return docPath;
    });

    expect(mockDocFn).toHaveBeenCalledWith('projects/proj123/screenplay/analysis');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        ...VALID_ANALYSIS,
        raw_response: 'raw json string',
        analyzed_at: '__SERVER_TIMESTAMP__',
        analysis_version: 1,
      }),
    );
  });

  it('updates screenplay/data with status=analyzed, analysis_stale=false, and shooting day estimate', async () => {
    expect(capturedHandler).not.toBeNull();

    await capturedHandler!({ data: { projectId: 'proj123' } });

    expect(mockDocFn).toHaveBeenCalledWith('projects/proj123/screenplay/data');
    expect(mockUpdate).toHaveBeenCalledWith(
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

    expect(capturedHandler).not.toBeNull();

    await expect(capturedHandler!({ data: { projectId: 'proj123' } })).rejects.toThrow();

    // Should have attempted to update status to analysis_error
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        screenplay_status: 'analysis_error',
      }),
    );
  });

  it('analysis document includes analysis_version field set to 1', async () => {
    expect(capturedHandler).not.toBeNull();

    await capturedHandler!({ data: { projectId: 'proj123' } });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        analysis_version: 1,
      }),
    );
  });
});
