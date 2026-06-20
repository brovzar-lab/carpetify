import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { PDFParse } from 'pdf-parse';
import type { ScreenplayBreakdown } from './types.js';

const MAX_TEXT_CHARS = 300_000; // ~75K tokens as text — well within 200K limit

/**
 * Extract raw text from PDF using pdf-parse v2.
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<{ text: string; numPages: number }> {
  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  const result = await parser.getText();
  const numPages = result.total;
  const text = result.text;
  await parser.destroy();
  return { text, numPages };
}

/** Normalise any time-of-day string Claude might return into one of our four values. */
function normalizeDiaNoche(raw: string): 'DIA' | 'NOCHE' | 'AMANECER' | 'ATARDECER' {
  const up = raw.toUpperCase().replace(/[^A-Z]/g, '');
  if (up.includes('NOCHE') || up.includes('NIGHT')) return 'NOCHE';
  if (up.includes('AMANECER') || up.includes('DAWN') || up.includes('MORNING')) return 'AMANECER';
  if (up.includes('ATARDECER') || up.includes('DUSK') || up.includes('SUNSET')) return 'ATARDECER';
  return 'DIA'; // default
}

/** Normalise INT/EXT variants into one of our three values. */
function normalizeIntExt(raw: string): 'INT' | 'EXT' | 'INT-EXT' {
  const up = raw.toUpperCase().replace(/[^A-Z/-]/g, '');
  if (up.includes('EXT') && up.includes('INT')) return 'INT-EXT';
  if (up.includes('EXT')) return 'EXT';
  return 'INT';
}

/**
 * Extracts structured screenplay data from PDF bytes.
 * Uses pdf-parse for text extraction, then Claude for structured analysis.
 * Text-based approach uses ~80% fewer tokens than sending raw PDF.
 *
 * @param pdfBuffer   - Raw PDF bytes from Firebase Storage
 * @param apiKey      - Anthropic API key from Secret Manager
 * @returns           - Structured screenplay breakdown
 */
export async function extractScreenplayWithClaude(
  pdfBuffer: Buffer,
  apiKey: string,
): Promise<ScreenplayBreakdown> {
  const client = new Anthropic({ apiKey });

  // ── Extract text from PDF ──────────────────────────────────────────────────
  const { text: rawText, numPages } = await extractTextFromPdf(pdfBuffer);

  if (!rawText || rawText.trim().length < 100) {
    throw new Error('PDF text extraction returned insufficient text — the PDF may be image-based or corrupted');
  }

  // Truncate text if extremely long (safety valve)
  const truncatedText = rawText.length > MAX_TEXT_CHARS
    ? rawText.slice(0, MAX_TEXT_CHARS) + '\n\n[... texto truncado por longitud ...]'
    : rawText;

  console.log(`Extracted ${rawText.length} chars from ${numPages} pages (sending ${truncatedText.length} chars to Claude)`);

  // ── Output schema (NO transforms — z.toJSONSchema cannot serialize them) ──
  const SceneSchema = z.object({
    numero: z.number().int().positive().describe('Scene number, sequential from 1'),
    int_ext: z.string().describe('Interior, exterior, or both: INT | EXT | INT-EXT'),
    dia_noche: z.string().describe('Time of day: DIA | NOCHE | AMANECER | ATARDECER'),
    locacion: z.string().describe('Location name as written in the scene heading'),
    personajes: z.array(z.string()).describe('Character names who speak in this scene (ALL-CAPS)'),
  });

  const OutputSchema = z.object({
    num_paginas: z.number().int().nonnegative().describe('Total number of pages'),
    escenas: z.array(SceneSchema).describe('All scenes in document order'),
    locaciones: z
      .array(
        z.object({
          nombre: z.string(),
          tipo: z.string().describe('INT | EXT | INT-EXT'),
          frecuencia: z.number().int().positive(),
        }),
      )
      .optional()
      .default([])
      .describe('Unique locations with how many scenes occur there'),
    personajes: z
      .array(
        z.object({
          nombre: z.string().describe('Character name in ALL-CAPS'),
          num_escenas: z.number().int().positive(),
          es_protagonista: z.boolean(),
        }),
      )
      .optional()
      .default([])
      .describe('Characters sorted by scene count descending'),
    desglose_int_ext: z
      .object({
        int: z.number().int().nonnegative(),
        ext: z.number().int().nonnegative(),
        int_ext: z.number().int().nonnegative(),
      })
      .optional()
      .default({ int: 0, ext: 0, int_ext: 0 }),
    desglose_dia_noche: z
      .object({
        dia: z.number().int().nonnegative(),
        noche: z.number().int().nonnegative(),
        otro: z.number().int().nonnegative(),
      })
      .optional()
      .default({ dia: 0, noche: 0, otro: 0 }),
  });

  const jsonSchema = z.toJSONSchema(OutputSchema) as Anthropic.Messages.Tool.InputSchema;

  // ── Call Claude with extracted text (not raw PDF) ──────────────────────────
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16384,
    system: `You are a professional screenplay analyst. Extract structured data from this screenplay text.

RULES:
- Scene headings start with INT., EXT., INT./EXT., or EXT./INT. (in Spanish or English)
- For time of day: DÍA/DAY → DIA, NOCHE/NIGHT → NOCHE, AMANECER/DAWN → AMANECER, ATARDECER/DUSK → ATARDECER
- Characters are ALL-CAPS names that appear as dialogue cues (not scene headings, transitions, or title pages)
- Protagonists appear in >20% of total scenes
- Extract EVERY scene — do not skip or summarize
- Locations should be normalized (same place = same entry, add frequencies)
- The screenplay has ${numPages} pages total`,
    messages: [
      {
        role: 'user',
        content: `Here is the full screenplay text extracted from a ${numPages}-page PDF. Extract the complete breakdown.\n\n---\n\n${truncatedText}`,
      },
    ],
    tools: [
      {
        name: 'output',
        description: 'Return the complete structured screenplay breakdown',
        input_schema: jsonSchema,
      },
    ],
    tool_choice: { type: 'tool', name: 'output' },
  });

  // ── Parse tool output ────────────────────────────────────────────────────
  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return tool_use output');
  }

  const parsed = OutputSchema.parse(toolBlock.input);

  // ── Map to ScreenplayBreakdown (apply normalization post-parse) ─────────
  const breakdown: ScreenplayBreakdown = {
    num_paginas: parsed.num_paginas || numPages,
    num_escenas: parsed.escenas.length,
    escenas: parsed.escenas.map((s) => ({
      numero: s.numero,
      int_ext: normalizeIntExt(s.int_ext),
      dia_noche: normalizeDiaNoche(s.dia_noche),
      locacion: s.locacion,
      personajes: s.personajes,
      rawText: '',
    })),
    locaciones: parsed.locaciones.map((l) => ({
      nombre: l.nombre,
      tipo: normalizeIntExt(l.tipo),
      frecuencia: l.frecuencia,
    })),
    personajes: parsed.personajes as ScreenplayBreakdown['personajes'],
    desglose_int_ext: parsed.desglose_int_ext,
    desglose_dia_noche: parsed.desglose_dia_noche,
    raw_text: rawText.slice(0, 50_000), // store first 50K chars for reference
  };

  return breakdown;
}
