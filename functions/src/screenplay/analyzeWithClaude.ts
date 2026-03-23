import Anthropic from '@anthropic-ai/sdk';
import { loadPrompt } from '../utils/promptLoader.js';
import { validateAnalysisResponse } from './validateAnalysis.js';
import type { AnalysisResult } from './types.js';

/** Minimal interface for the Anthropic messages client, enabling dependency injection for tests. */
export interface MessagesClient {
  create(params: {
    model: string;
    max_tokens: number;
    messages: Array<{ role: string; content: string }>;
  }): Promise<{ content: Array<{ type: string; text?: string }> }>;
}

/**
 * Calls Claude API with the screenplay analysis prompt.
 * Per D-08: Uses claude-sonnet-4-20250514 (configurable via env var).
 * Per D-14: Auto-retries once on failure.
 * Per D-10: Validates response schema; retries once if validation fails.
 * Always keeps raw_response backup for debugging.
 *
 * @param screenplayText - Full screenplay text
 * @param projectTitle - Project title
 * @param genre - Genre (Ficcion / Documental / Animacion)
 * @param apiKey - Anthropic API key
 * @param clientOverride - Optional messages client for testing
 */
export async function analyzeScreenplayWithClaude(
  screenplayText: string,
  projectTitle: string,
  genre: string,
  apiKey: string,
  clientOverride?: MessagesClient,
): Promise<{ analysis: AnalysisResult; raw_response: string }> {
  const messages = clientOverride ?? new Anthropic({ apiKey }).messages;

  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

  const systemPrompt = loadPrompt('analisis_guion.md', {
    texto_guion: screenplayText,
    titulo_proyecto: projectTitle,
    categoria_cinematografica: genre,
  });

  let lastError: Error | null = null;

  // D-14: Auto-retry once silently on failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const message = await messages.create({
        model,
        max_tokens: 8192,
        messages: [{ role: 'user', content: systemPrompt }],
      });

      // Extract text content
      const textBlock = message.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text' || !('text' in textBlock)) {
        throw new Error('Claude no devolvio contenido de texto.');
      }

      let jsonText = (textBlock as { type: 'text'; text: string }).text.trim();

      // Strip markdown code fences if present (common Claude behavior)
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText);

      // D-10: Validate response schema
      const validation = validateAnalysisResponse(parsed);
      if (!validation.valid) {
        // If validation fails on first attempt, retry
        if (attempt === 0) {
          lastError = new Error(validation.error);
          continue;
        }
        throw new Error(validation.error);
      }

      return {
        analysis: validation.result!,
        raw_response: (textBlock as { type: 'text'; text: string }).text,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0) continue; // Silent retry per D-14
    }
  }

  throw lastError || new Error('Error desconocido en el analisis.');
}
