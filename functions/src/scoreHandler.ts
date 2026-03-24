/**
 * Cloud Function handler for AI persona artistic scoring.
 * Runs 5 parallel Claude API calls, one per evaluator persona,
 * each scoring the project's artistic categories (guion, direccion, material_visual).
 *
 * Handler extraction pattern: pure function, no onCall wrapper.
 * Dependency injection for testability (optional client param).
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { initClaudeClient, getClaudeClient } from './claude/client.js';

// ---- Types ----

export interface PersonaScoreResult {
  personaId: string;
  personaName: string;
  scores: {
    guion: number;
    direccion: number;
    material_visual: number;
  };
  rationale: {
    guion: string;
    direccion: string;
    material_visual: string;
  };
}

export interface ScoreEstimationRequest {
  projectId: string;
  /** Content of generated document A3 (guion) */
  guionContent: string;
  /** Content of generated document A4 (propuesta de direccion) */
  direccionContent: string;
  /** Content of generated document A5 (material visual) */
  materialVisualContent: string;
  /** Project title for context */
  tituloProyecto: string;
  /** Category for context */
  categoriaCinematografica: string;
}

export interface ScoreEstimationResponse {
  success: boolean;
  personaScores: (PersonaScoreResult | null)[];
  errors?: string[];
}

// ---- Persona definitions ----

interface PersonaDef {
  id: string;
  name: string;
  promptFile: string;
}

const PERSONAS: PersonaDef[] = [
  { id: 'reygadas', name: 'Reygadas', promptFile: 'reygadas.md' },
  { id: 'marcopolo', name: 'Marcopolo', promptFile: 'marcopolo.md' },
  { id: 'pato', name: 'Pato', promptFile: 'pato.md' },
  { id: 'leo', name: 'Leo', promptFile: 'leo.md' },
  { id: 'alejandro', name: 'Alejandro', promptFile: 'alejandro.md' },
];

// ---- Prompt loading ----

/**
 * Load a persona prompt file from the prompts/evaluadores/ directory.
 * Uses the bundled prompts directory (copied via predeploy script).
 */
function loadPersonaPrompt(promptFile: string): string {
  // In Cloud Functions, prompts are copied to the functions/ directory via predeploy
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try multiple paths: compiled (lib/) looks up to functions/prompts/,
  // or from src/ during development
  const paths = [
    join(__dirname, '..', 'prompts', 'evaluadores', promptFile),
    join(__dirname, '..', '..', 'prompts', 'evaluadores', promptFile),
  ];

  for (const p of paths) {
    try {
      return readFileSync(p, 'utf-8');
    } catch {
      // Try next path
    }
  }

  throw new Error(`No se encontro el archivo de prompt del evaluador: ${promptFile}`);
}

// ---- User message builder ----

function buildUserMessage(req: ScoreEstimationRequest): string {
  return [
    `TITULO DEL PROYECTO: ${req.tituloProyecto}`,
    `CATEGORIA: ${req.categoriaCinematografica}`,
    '',
    '--- DOCUMENTO A3: GUION ---',
    req.guionContent || '(No disponible)',
    '',
    '--- DOCUMENTO A4: PROPUESTA DE DIRECCION ---',
    req.direccionContent || '(No disponible)',
    '',
    '--- DOCUMENTO A5: MATERIAL VISUAL ---',
    req.materialVisualContent || '(No disponible)',
  ].join('\n');
}

// ---- JSON parsing ----

interface PersonaRawResponse {
  guion: { score: number; rationale: string };
  direccion: { score: number; rationale: string };
  material_visual: { score: number; rationale: string };
}

function parsePersonaResponse(text: string): PersonaRawResponse {
  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se encontro JSON valido en la respuesta del evaluador.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as PersonaRawResponse;

  // Validate structure
  if (
    typeof parsed.guion?.score !== 'number' ||
    typeof parsed.direccion?.score !== 'number' ||
    typeof parsed.material_visual?.score !== 'number'
  ) {
    throw new Error('Estructura de respuesta del evaluador invalida.');
  }

  // Clamp scores to valid ranges
  parsed.guion.score = Math.max(0, Math.min(40, Math.round(parsed.guion.score)));
  parsed.direccion.score = Math.max(0, Math.min(12, Math.round(parsed.direccion.score)));
  parsed.material_visual.score = Math.max(0, Math.min(10, Math.round(parsed.material_visual.score)));

  return parsed;
}

// ---- Single persona evaluation ----

async function evaluateWithPersona(
  persona: PersonaDef,
  userMessage: string,
  client: Anthropic,
): Promise<PersonaScoreResult> {
  const systemPrompt = loadPersonaPrompt(persona.promptFile);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`El evaluador ${persona.name} no genero respuesta de texto.`);
  }

  const parsed = parsePersonaResponse(textBlock.text);

  return {
    personaId: persona.id,
    personaName: persona.name,
    scores: {
      guion: parsed.guion.score,
      direccion: parsed.direccion.score,
      material_visual: parsed.material_visual.score,
    },
    rationale: {
      guion: parsed.guion.rationale || '',
      direccion: parsed.direccion.rationale || '',
      material_visual: parsed.material_visual.rationale || '',
    },
  };
}

// ---- Main handler ----

/**
 * Handle score estimation request.
 * Runs 5 parallel AI persona evaluations via Promise.all.
 *
 * @param req - Score estimation request with project document content
 * @param apiKey - Anthropic API key (from Secret Manager)
 * @param clientOverride - Optional Anthropic client for testing
 */
export async function handleScoreEstimation(
  req: ScoreEstimationRequest,
  apiKey: string,
  clientOverride?: Anthropic,
): Promise<ScoreEstimationResponse> {
  // Initialize Claude client if not overridden
  const client = clientOverride ?? (() => {
    initClaudeClient(apiKey);
    return getClaudeClient();
  })();

  const userMessage = buildUserMessage(req);
  const errors: string[] = [];

  // Run all 5 persona evaluations in parallel
  const results = await Promise.all(
    PERSONAS.map(async (persona): Promise<PersonaScoreResult | null> => {
      try {
        return await evaluateWithPersona(persona, userMessage, client);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error en evaluacion de ${persona.name}:`, message);
        errors.push(`${persona.name}: ${message}`);
        return null;
      }
    }),
  );

  return {
    success: results.some((r) => r !== null),
    personaScores: results,
    errors: errors.length > 0 ? errors : undefined,
  };
}
