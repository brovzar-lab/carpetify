/**
 * Anthropic Claude API client wrapper.
 * Provides two generation modes:
 *   - generateProse: for text documents (A7, A2, contracts, etc.)
 *   - generateStructured: for structured JSON (budget tables, cash flow, etc.)
 *
 * Singleton pattern: call initClaudeClient(apiKey) once at function startup,
 * then use getClaudeClient() or the helper functions.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

/** Default model: Sonnet for cost efficiency; upgrade to Opus if quality insufficient */
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250514';
const DEFAULT_MAX_TOKENS = 8192;

let clientInstance: Anthropic | null = null;

/**
 * Initialize the singleton Claude client with an API key.
 * Call once during Cloud Function cold start (key from Secret Manager).
 */
export function initClaudeClient(apiKey: string): void {
  clientInstance = new Anthropic({ apiKey });
}

/**
 * Get the initialized Claude client instance.
 * @throws Error if initClaudeClient has not been called
 */
export function getClaudeClient(): Anthropic {
  if (!clientInstance) {
    throw new Error('Claude client not initialized. Call initClaudeClient(apiKey) first.');
  }
  return clientInstance;
}

/**
 * Generate prose content (A7, A2, A10, contracts, etc.).
 * Returns the text content from Claude's response.
 *
 * @param systemPrompt - Full system prompt with variables injected and guardrail appended
 * @param userMessage - User message with project-specific data
 * @param maxTokens - Maximum response tokens (default 8192)
 * @returns Generated prose string
 */
export async function generateProse(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = DEFAULT_MAX_TOKENS,
): Promise<string> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Extract text content from response
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude response contained no text content');
  }

  return textBlock.text;
}

/**
 * Generate structured JSON output using Zod schema validation.
 * Uses tool_use to guarantee valid JSON matching the schema.
 *
 * @param systemPrompt - Full system prompt with variables injected and guardrail appended
 * @param userMessage - User message with project-specific data
 * @param schema - Zod schema defining the expected output structure
 * @param maxTokens - Maximum response tokens (default 8192)
 * @returns Parsed and validated object matching the schema
 */
export async function generateStructured<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>,
  maxTokens: number = DEFAULT_MAX_TOKENS,
): Promise<T> {
  const client = getClaudeClient();
  // Zod v4 has built-in JSON Schema conversion
  const jsonSchema = z.toJSONSchema(schema);

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    tools: [
      {
        name: 'output',
        description: 'Output the structured result',
        input_schema: jsonSchema as Anthropic.Messages.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: 'output' },
  });

  // Extract tool_use block
  const toolBlock = response.content.find((block) => block.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude response contained no tool_use output');
  }

  // Validate against schema
  const parsed = schema.parse(toolBlock.input);
  return parsed;
}
