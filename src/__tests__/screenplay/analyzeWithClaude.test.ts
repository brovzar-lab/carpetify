// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs.readFileSync for promptLoader
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue(
    'Prompt template: {{texto_guion}} {{titulo_proyecto}} {{categoria_cinematografica}}',
  ),
}));

// Mock path and url modules for promptLoader
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

vi.mock('url', () => ({
  fileURLToPath: vi.fn().mockReturnValue('/mock/dir/promptLoader.ts'),
}));

import { analyzeScreenplayWithClaude } from '@functions/screenplay/analyzeWithClaude';
import type { MessagesClient } from '@functions/screenplay/analyzeWithClaude';
import { validateAnalysisResponse } from '@functions/screenplay/validateAnalysis';

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
    resumen_retos: 'Escenas nocturnas y stunts complejos.',
  },
  estimacion_jornadas: {
    baja: 30,
    media: 25,
    alta: 20,
    justificacion: 'Basado en el genero y complejidad del guion.',
  },
};

function makeTextResponse(json: unknown): { content: Array<{ type: string; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(json) }],
  };
}

function createMockClient(): { client: MessagesClient; create: ReturnType<typeof vi.fn> } {
  const create = vi.fn();
  return {
    client: { create } as unknown as MessagesClient,
    create,
  };
}

describe('analyzeScreenplayWithClaude', () => {
  let mockClient: MessagesClient;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockClient();
    mockClient = mock.client;
    mockCreate = mock.create;
  });

  it('calls Anthropic messages.create with model "claude-haiku-4-5-20251001"', async () => {
    mockCreate.mockResolvedValueOnce(makeTextResponse(VALID_ANALYSIS));

    await analyzeScreenplayWithClaude('screenplay text', 'Mi Pelicula', 'Ficcion', 'test-key', mockClient);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-4-5-20251001' }),
    );
  });

  it('system prompt contains the injected texto_guion value from loadPrompt', async () => {
    mockCreate.mockResolvedValueOnce(makeTextResponse(VALID_ANALYSIS));

    await analyzeScreenplayWithClaude('Mi guion completo', 'Mi Pelicula', 'Ficcion', 'test-key', mockClient);

    // The prompt should have the screenplay text injected via loadPrompt
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('Mi guion completo');
  });

  it('strips markdown code fences from Claude response before parsing', async () => {
    const fencedResponse = {
      content: [{ type: 'text', text: '```json\n' + JSON.stringify(VALID_ANALYSIS) + '\n```' }],
    };
    mockCreate.mockResolvedValueOnce(fencedResponse);

    const result = await analyzeScreenplayWithClaude('text', 'title', 'Ficcion', 'key', mockClient);
    expect(result.analysis).toEqual(VALID_ANALYSIS);
  });

  it('throws on empty/null response from Claude', async () => {
    mockCreate.mockResolvedValueOnce({ content: [] });

    await expect(
      analyzeScreenplayWithClaude('text', 'title', 'Ficcion', 'key', mockClient),
    ).rejects.toThrow();
  });

  it('on first API failure, retries once (per D-14)', async () => {
    mockCreate
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce(makeTextResponse(VALID_ANALYSIS));

    const result = await analyzeScreenplayWithClaude('text', 'title', 'Ficcion', 'key', mockClient);
    expect(result.analysis).toEqual(VALID_ANALYSIS);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('on second consecutive failure, throws error (no more retries)', async () => {
    mockCreate
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'));

    await expect(
      analyzeScreenplayWithClaude('text', 'title', 'Ficcion', 'key', mockClient),
    ).rejects.toThrow('Second failure');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

describe('validateAnalysisResponse', () => {
  it('returns valid:true for valid JSON with required fields', () => {
    const result = validateAnalysisResponse(VALID_ANALYSIS);
    expect(result.valid).toBe(true);
    expect(result.result).toEqual(VALID_ANALYSIS);
  });

  it('returns valid:false for JSON missing complejidad_global', () => {
    const invalid = { ...VALID_ANALYSIS, complejidad_global: undefined };
    const result = validateAnalysisResponse(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('complejidad_global');
  });

  it('returns valid:false for JSON missing estimacion_jornadas', () => {
    const invalid = { ...VALID_ANALYSIS, estimacion_jornadas: undefined };
    const result = validateAnalysisResponse(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('estimacion_jornadas');
  });
});
