// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// We'll mock fs to control what prompt files and guardrail content are returned
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  return {
    ...actual,
    default: {
      ...actual,
      dirname: vi.fn().mockReturnValue('/mock/dir'),
      join: (...args: string[]) => actual.join(...args),
    },
  };
});

vi.mock('url', () => ({
  fileURLToPath: vi.fn().mockReturnValue('/mock/dir/promptLoader.ts'),
}));

const MOCK_GUARDRAIL = `
INSTRUCCION DE IDIOMA OBLIGATORIA:
- Escribe EXCLUSIVAMENTE en espanol mexicano profesional.
- Usa la terminologia oficial de IMCINE y EFICINE sin traducir.
- Los montos van en pesos mexicanos con formato: $X,XXX,XXX MXN.
`;

const MOCK_POLITICA = `# Politica de Idioma

## Some section

Content here.

## Guardarrailes

${MOCK_GUARDRAIL}
`;

describe('promptLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: mock the guardrail file read and a simple prompt
    const mockReadFileSync = vi.mocked(readFileSync);
    mockReadFileSync.mockImplementation((filepath: any, _encoding?: any) => {
      const fp = String(filepath);
      if (fp.includes('politica_idioma')) {
        return MOCK_POLITICA;
      }
      // Default prompt template
      return 'Titulo: {{titulo_proyecto}}\nGenero: {{categoria_cinematografica}}';
    });
  });

  it('should substitute {{variables}} in a prompt template', async () => {
    const { loadPrompt } = await import('@functions/pipeline/promptLoader');
    const result = loadPrompt('test_prompt.md', {
      titulo_proyecto: 'Mi Pelicula',
      categoria_cinematografica: 'ficcion',
    });
    expect(result).toContain('Mi Pelicula');
    expect(result).not.toContain('{{titulo_proyecto}}');
    expect(result).toContain('ficcion');
    expect(result).not.toContain('{{categoria_cinematografica}}');
  });

  it('should handle Handlebars conditional blocks ({{#if}} when true)', async () => {
    const mockReadFileSync = vi.mocked(readFileSync);
    mockReadFileSync.mockImplementation((filepath: any, _encoding?: any) => {
      const fp = String(filepath);
      if (fp.includes('politica_idioma')) return MOCK_POLITICA;
      return 'Pelicula: {{titulo_proyecto}}\n{{#if es_animacion}}Esta es animacion.{{/if}}';
    });

    const { loadPrompt } = await import('@functions/pipeline/promptLoader');
    const result = loadPrompt('test_prompt.md', {
      titulo_proyecto: 'Mi Pelicula',
      es_animacion: true,
    });
    expect(result).toContain('Esta es animacion.');
  });

  it('should handle Handlebars conditional blocks ({{#if}} when false)', async () => {
    const mockReadFileSync = vi.mocked(readFileSync);
    mockReadFileSync.mockImplementation((filepath: any, _encoding?: any) => {
      const fp = String(filepath);
      if (fp.includes('politica_idioma')) return MOCK_POLITICA;
      return 'Pelicula: {{titulo_proyecto}}\n{{#if es_animacion}}Esta es animacion.{{/if}}';
    });

    const { loadPrompt } = await import('@functions/pipeline/promptLoader');
    const result = loadPrompt('test_prompt.md', {
      titulo_proyecto: 'Mi Pelicula',
      es_animacion: false,
    });
    expect(result).not.toContain('Esta es animacion.');
  });

  it('should handle {{#each}} blocks for iterating over arrays', async () => {
    const mockReadFileSync = vi.mocked(readFileSync);
    mockReadFileSync.mockImplementation((filepath: any, _encoding?: any) => {
      const fp = String(filepath);
      if (fp.includes('politica_idioma')) return MOCK_POLITICA;
      return 'Fuentes:\n{{#each fuentes}}- {{this.nombre}}: ${{this.monto}} MXN\n{{/each}}';
    });

    const { loadPrompt } = await import('@functions/pipeline/promptLoader');
    const result = loadPrompt('test_prompt.md', {
      fuentes: [
        { nombre: 'ERPI', monto: '4,000,000' },
        { nombre: 'EFICINE', monto: '6,000,000' },
      ],
    });
    expect(result).toContain('ERPI');
    expect(result).toContain('EFICINE');
    expect(result).toContain('$4,000,000 MXN');
  });

  it('should ALWAYS append the language guardrail block to rendered output', async () => {
    const { loadPrompt } = await import('@functions/pipeline/promptLoader');
    const result = loadPrompt('test_prompt.md', {
      titulo_proyecto: 'Test',
      categoria_cinematografica: 'ficcion',
    });
    expect(result).toContain('INSTRUCCION DE IDIOMA OBLIGATORIA');
  });

  it('should have the guardrail at the END of the rendered output', async () => {
    const { loadPrompt } = await import('@functions/pipeline/promptLoader');
    const result = loadPrompt('test_prompt.md', {
      titulo_proyecto: 'Test',
      categoria_cinematografica: 'ficcion',
    });
    // The guardrail should appear after the template content
    const templateEndIdx = result.indexOf('ficcion');
    const guardrailIdx = result.indexOf('INSTRUCCION DE IDIOMA OBLIGATORIA');
    expect(guardrailIdx).toBeGreaterThan(templateEndIdx);
  });

  it('should return list of unresolved variables via validatePromptVariables', async () => {
    const { validatePromptVariables } = await import('@functions/pipeline/promptLoader');
    const unresolved = validatePromptVariables('test_prompt.md', {
      titulo_proyecto: 'Test',
      // missing: categoria_cinematografica
    });
    expect(unresolved).toContain('categoria_cinematografica');
  });

  it('should return empty array from validatePromptVariables when all variables resolved', async () => {
    const { validatePromptVariables } = await import('@functions/pipeline/promptLoader');
    const unresolved = validatePromptVariables('test_prompt.md', {
      titulo_proyecto: 'Test',
      categoria_cinematografica: 'ficcion',
    });
    expect(unresolved).toEqual([]);
  });
});
