/**
 * Mock factory for Claude client used by handler integration tests.
 * Wave 0 test infrastructure -- Plans 02 and 03 use these mocks
 * to verify pass logic without actual API calls.
 */

import { vi } from 'vitest';

export interface MockClaudeClient {
  generateProse: ReturnType<typeof vi.fn>;
  generateStructured: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Claude client that returns deterministic responses.
 * Used by handler integration tests to verify pass logic without actual API calls.
 *
 * Usage in handler tests:
 *   const { mock, getModuleMock } = createMockClaudeClient();
 *   mock.generateProse.mockResolvedValue("Generated prose content...");
 *   // ... test handler invocation
 */
export function createMockClaudeClient(): {
  mock: MockClaudeClient;
  getModuleMock: () => Record<string, unknown>;
} {
  const mock: MockClaudeClient = {
    generateProse: vi.fn().mockResolvedValue(
      'Contenido generado de prueba en espanol mexicano profesional.',
    ),
    generateStructured: vi.fn().mockResolvedValue({}),
  };

  // Returns the module mock shape to use with vi.mock("../../claude/client.js", ...)
  const getModuleMock = () => ({
    initClaudeClient: vi.fn(),
    getClaudeClient: vi.fn(),
    generateProse: mock.generateProse,
    generateStructured: mock.generateStructured,
  });

  return { mock, getModuleMock };
}

/**
 * Creates a mock document store that captures all saveGeneratedDocument calls.
 * Used to verify handlers store correct documents with correct metadata.
 */
export function createMockDocumentStore() {
  const savedDocs: Array<{
    projectId: string;
    docId: string;
    content: unknown;
    passId: string;
  }> = [];

  return {
    savedDocs,
    getModuleMock: () => ({
      saveGeneratedDocument: vi.fn().mockImplementation(
        (
          projectId: string,
          docId: string,
          content: unknown,
          passId: string,
        ) => {
          savedDocs.push({ projectId, docId, content, passId });
          return Promise.resolve();
        },
      ),
      getGeneratedDocument: vi.fn().mockResolvedValue(null),
      getAllGeneratedDocuments: vi.fn().mockResolvedValue([]),
      storeBudgetOutputForDownstream: vi.fn().mockResolvedValue(undefined),
      loadBudgetOutput: vi.fn().mockResolvedValue(null),
    }),
  };
}
