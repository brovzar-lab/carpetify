/**
 * Pre-submission review handler (Phase 15).
 *
 * Two-pass architecture per D-05:
 *   Pass 1: 5 persona critiques in parallel (concurrency cap of 3)
 *   Pass 2: Cross-document coherence check (sequential after Pass 1)
 *
 * Handler extraction pattern: pure function, no onCall wrapper.
 * Follows the same architecture as scoreHandler.ts.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { getClaudeClient } from '../claude/client.js';
import { loadProjectDataForGeneration } from '../pipeline/orchestrator.js';
import type { ProjectDataForGeneration } from '../pipeline/orchestrator.js';
import { getAllGeneratedDocuments } from '../pipeline/documentStore.js';
import type { GeneratedDocument } from '../shared/types.js';
import { DOCUMENT_REGISTRY } from '../shared/types.js';
import { createConcurrencyPool } from '../pipeline/concurrencyPool.js';
import {
  REVIEW_PERSONAS,
  type ReviewPersona,
  type ReviewFinding,
  type PersonaReviewResult,
  type CoherenceContradiction,
  type ReviewResult,
  type ReviewProgressChunk,
} from './reviewTypes.js';

// ---- Prompt loading ----

/**
 * Load a persona review prompt file from prompts/evaluadores/.
 * Reuses the exact path resolution pattern from scoreHandler.ts.
 */
function loadPersonaPrompt(promptFile: string): string {
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

// ---- Content extraction helpers ----

/**
 * Extract readable content from a GeneratedDocument.
 * Handles both prose (string) and structured (JSON) content types.
 */
function extractDocContent(doc: GeneratedDocument): string {
  const content = doc.content;
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object') {
    // For structured content, try to extract prose field first
    const obj = content as Record<string, unknown>;
    if (typeof obj.prose === 'string') return obj.prose;
    // Fall back to JSON stringification for tables/structured data
    return JSON.stringify(content, null, 2);
  }
  return '';
}

/**
 * Format centavos as MXN for the user message.
 * Backend-only — does not use frontend formatMXN.
 */
function formatCentavosAsMXN(centavos: number): string {
  const pesos = Math.round(centavos / 100);
  return `$${pesos.toLocaleString('es-MX')} MXN`;
}

// ---- User message builders ----

/**
 * Build a curated user message for a persona's review.
 * Per Pitfall 1: NOT a raw document dump. Target ~15,000-20,000 tokens.
 * Only includes documents assigned to this persona plus project context.
 */
function buildReviewUserMessage(
  persona: ReviewPersona,
  project: ProjectDataForGeneration,
  generatedDocs: GeneratedDocument[],
): string {
  const sections: string[] = [];

  // Project identity
  sections.push(`PROYECTO: ${project.metadata.titulo_proyecto}`);
  sections.push(`CATEGORIA: ${project.metadata.categoria_cinematografica}`);
  sections.push(`PRESUPUESTO TOTAL: ${formatCentavosAsMXN(project.metadata.costo_total_proyecto_centavos)}`);
  sections.push(`MONTO EFICINE SOLICITADO: ${formatCentavosAsMXN(project.metadata.monto_solicitado_eficine_centavos)}`);
  sections.push(`DURACION ESTIMADA: ${project.metadata.duracion_estimada_minutos} minutos`);
  sections.push('');

  // Documents assigned to this persona
  for (const docId of persona.documentIds) {
    const doc = generatedDocs.find((d) => d.docId === docId);
    if (doc) {
      const content = extractDocContent(doc);
      const registryEntry = DOCUMENT_REGISTRY[docId as keyof typeof DOCUMENT_REGISTRY];
      const docName = registryEntry?.docName ?? doc.docName ?? docId;
      sections.push(`--- ${docName} (${docId}) ---`);
      // Truncate to ~2000 chars per document to control token budget
      sections.push(content.length > 2000 ? content.substring(0, 2000) + '\n[... truncado]' : content);
      sections.push('');
    } else {
      sections.push(`--- ${docId} ---`);
      sections.push('(No disponible)');
      sections.push('');
    }
  }

  // Team composition summary
  sections.push('--- EQUIPO CREATIVO ---');
  for (const member of project.team) {
    const honorarios = member.honorarios_centavos
      ? ` — Honorarios: ${formatCentavosAsMXN(member.honorarios_centavos)}`
      : '';
    sections.push(`${member.cargo}: ${member.nombre_completo}${honorarios}`);
  }
  sections.push('');

  // Financial structure summary
  sections.push('--- ESTRUCTURA FINANCIERA ---');
  sections.push(`ERPI efectivo: ${formatCentavosAsMXN(project.financials.aportacion_erpi_efectivo_centavos)}`);
  sections.push(`ERPI especie: ${formatCentavosAsMXN(project.financials.aportacion_erpi_especie_centavos)}`);
  sections.push(`EFICINE: ${formatCentavosAsMXN(project.financials.monto_eficine_centavos)}`);
  if (project.financials.tiene_gestor) {
    sections.push(`Gestor: ${formatCentavosAsMXN(project.financials.gestor_monto_centavos)}`);
  }
  sections.push('');

  // Screenplay analysis context (useful for Pato's guion alignment and others)
  if (project.screenplayAnalysis?.datos_generales) {
    sections.push('--- DATOS DEL GUION ---');
    sections.push(`Sinopsis del analisis: ${project.screenplayAnalysis.datos_generales.sinopsis || '(No disponible)'}`);
    sections.push(`Numero de escenas: ${project.screenplayAnalysis.datos_generales.num_escenas}`);
    if (project.screenplayAnalysis.personajes_detalle?.length) {
      const protagonistas = project.screenplayAnalysis.personajes_detalle
        .filter((p) => p.es_protagonista)
        .map((p) => p.nombre);
      if (protagonistas.length > 0) {
        sections.push(`Protagonistas: ${protagonistas.join(', ')}`);
      }
    }
    if (project.screenplayAnalysis.complejidad_global) {
      sections.push(`Complejidad: ${project.screenplayAnalysis.complejidad_global.nivel}`);
      sections.push(`Locaciones unicas: ${project.screenplayAnalysis.locaciones_unicas?.length ?? 0}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Build the user message for the coherence check (Pass 2).
 * Includes: summarized findings from Pass 1 + key excerpts from each doc.
 */
function buildCoherenceUserMessage(
  personaResults: (PersonaReviewResult | null)[],
  generatedDocs: GeneratedDocument[],
  project: ProjectDataForGeneration,
): string {
  const sections: string[] = [];

  sections.push(`PROYECTO: ${project.metadata.titulo_proyecto}`);
  sections.push('');

  // Summarize findings from Pass 1
  sections.push('=== HALLAZGOS DE LOS EVALUADORES ===');
  for (const result of personaResults) {
    if (!result) continue;
    sections.push(`\n--- ${result.personaName} ---`);
    for (const finding of result.findings) {
      sections.push(`- [${finding.documentId}] ${finding.criterion}: ${finding.weakness}`);
    }
  }
  sections.push('');

  // Key excerpts from each reviewed document (~500 chars each)
  sections.push('=== EXTRACTOS DE DOCUMENTOS ===');
  const reviewedDocIds = new Set<string>();
  for (const persona of REVIEW_PERSONAS) {
    for (const docId of persona.documentIds) {
      reviewedDocIds.add(docId);
    }
  }

  for (const docId of reviewedDocIds) {
    const doc = generatedDocs.find((d) => d.docId === docId);
    if (doc) {
      const content = extractDocContent(doc);
      const registryEntry = DOCUMENT_REGISTRY[docId as keyof typeof DOCUMENT_REGISTRY];
      const docName = registryEntry?.docName ?? doc.docName ?? docId;
      sections.push(`\n--- ${docName} (${docId}) ---`);
      sections.push(content.length > 500 ? content.substring(0, 500) + ' [...]' : content);
    }
  }

  return sections.join('\n');
}

// ---- JSON parsing ----

interface PersonaRawFinding {
  documentId: string;
  criterion: string;
  weakness: string;
  suggestion: string;
}

interface PersonaRawResponse {
  findings: PersonaRawFinding[];
}

/**
 * Parse a persona's JSON response. Handles markdown code block wrapping.
 * Reuses the regex pattern from scoreHandler.ts.
 */
function parsePersonaResponse(text: string): PersonaRawFinding[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se encontro JSON valido en la respuesta del evaluador.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as PersonaRawResponse;

  if (!Array.isArray(parsed.findings)) {
    throw new Error('La respuesta del evaluador no contiene un arreglo de hallazgos.');
  }

  // Validate each finding has required fields
  for (const finding of parsed.findings) {
    if (!finding.documentId || !finding.criterion || !finding.weakness || !finding.suggestion) {
      throw new Error('Hallazgo incompleto: falta documentId, criterion, weakness o suggestion.');
    }
  }

  return parsed.findings;
}

interface CoherenceRawResponse {
  contradictions: Array<{
    personaId: string;
    personaName: string;
    description: string;
    documentIds: string[];
  }>;
}

/**
 * Parse the coherence check JSON response.
 */
function parseCoherenceResponse(text: string): CoherenceContradiction[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se encontro JSON valido en la respuesta de coherencia.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as CoherenceRawResponse;

  if (!Array.isArray(parsed.contradictions)) {
    return [];
  }

  // Limit to 5 contradictions max per D-09
  return parsed.contradictions.slice(0, 5).map((c) => ({
    personaId: c.personaId || '',
    personaName: c.personaName || '',
    description: c.description || '',
    documentIds: Array.isArray(c.documentIds) ? c.documentIds : [],
  }));
}

// ---- Single persona evaluation ----

/**
 * Run a single persona's critique evaluation (Pass 1).
 */
async function evaluateWithPersona(
  persona: ReviewPersona,
  project: ProjectDataForGeneration,
  generatedDocs: GeneratedDocument[],
): Promise<PersonaReviewResult> {
  const client = getClaudeClient();
  const systemPrompt = loadPersonaPrompt(persona.promptFile);
  const userMessage = buildReviewUserMessage(persona, project, generatedDocs);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`El evaluador ${persona.name} no genero respuesta de texto.`);
  }

  const rawFindings = parsePersonaResponse(textBlock.text);

  // Enrich findings with persona metadata and document names
  const findings: ReviewFinding[] = rawFindings.map((f) => {
    const registryEntry = DOCUMENT_REGISTRY[f.documentId as keyof typeof DOCUMENT_REGISTRY];
    return {
      personaId: persona.id,
      personaName: persona.name,
      documentId: f.documentId,
      documentName: registryEntry?.docName ?? f.documentId,
      role: persona.role,
      criterion: f.criterion,
      weakness: f.weakness,
      suggestion: f.suggestion,
      resolved: false,
    };
  });

  return {
    personaId: persona.id,
    personaName: persona.name,
    findings,
  };
}

// ---- Coherence check (Pass 2) ----

/**
 * Run the cross-document coherence check.
 * Takes Pass 1 findings summaries and key document excerpts.
 */
async function runCoherenceCheck(
  personaResults: (PersonaReviewResult | null)[],
  generatedDocs: GeneratedDocument[],
  project: ProjectDataForGeneration,
): Promise<CoherenceContradiction[]> {
  const client = getClaudeClient();
  const systemPrompt = loadPersonaPrompt('revision_coherencia.md');
  const userMessage = buildCoherenceUserMessage(personaResults, generatedDocs, project);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return [];
  }

  return parseCoherenceResponse(textBlock.text);
}

// ---- Readiness and score computation ----

/**
 * Determine readiness level based on total findings and contradictions.
 *
 * - 'lista': 0-3 findings AND 0 contradictions
 * - 'casi_lista': 4-6 findings OR 1 contradiction
 * - 'necesita_trabajo': 7-12 findings OR 2-3 contradictions
 * - 'no_lista': >12 findings OR >3 contradictions
 */
function computeReadiness(
  findingsCount: number,
  contradictionsCount: number,
): ReviewResult['readiness'] {
  if (contradictionsCount > 3 || findingsCount > 12) return 'no_lista';
  if (contradictionsCount >= 2 || findingsCount >= 7) return 'necesita_trabajo';
  if (contradictionsCount >= 1 || findingsCount >= 4) return 'casi_lista';
  return 'lista';
}

/**
 * Compute estimated score.
 * Start at 100, subtract 2 per finding and 3 per contradiction.
 * Clamp to 0-100.
 */
function computeEstimatedScore(
  findingsCount: number,
  contradictionsCount: number,
): number {
  const deduction = findingsCount * 2 + contradictionsCount * 3;
  return Math.max(0, Math.min(100, 100 - deduction));
}

// ---- Main handler ----

/**
 * Handle pre-submission review request.
 *
 * Two-pass architecture:
 *   Pass 1: 5 persona critiques in parallel (concurrency cap of 3)
 *   Pass 2: Cross-document coherence check
 *
 * Results persist to Firestore at projects/{projectId}/meta/pre_submission_review.
 *
 * @param projectId - The project to review
 * @param onProgress - Callback for streaming progress chunks to the client
 */
export async function handlePreSubmissionReview(
  projectId: string,
  onProgress: (chunk: ReviewProgressChunk) => void,
): Promise<ReviewResult> {
  // Step 1: Load data
  onProgress({
    type: 'progress',
    step: 'loading_data',
    message: 'Cargando datos del proyecto...',
  });

  const project = await loadProjectDataForGeneration(projectId);
  const generatedDocs = await getAllGeneratedDocuments(projectId);

  // Step 2: Pre-check per Pitfall 4 — verify essential docs exist
  const requiredDocIds = ['A1', 'A2', 'A7', 'A9a'];
  const existingDocIds = new Set<string>(generatedDocs.map((d) => d.docId));
  const missingDocs = requiredDocIds.filter((id) => !existingDocIds.has(id));
  if (missingDocs.length > 0) {
    throw new HttpsError(
      'failed-precondition',
      'Genera todos los documentos antes de solicitar la revision pre-envio.',
    );
  }

  // Step 3: Compute generatedDocsTimestamp for staleness detection (Pitfall 6)
  let maxTimestampMs = 0;
  for (const doc of generatedDocs) {
    if (doc.generatedAt) {
      const ts = typeof doc.generatedAt.toMillis === 'function'
        ? doc.generatedAt.toMillis()
        : 0;
      if (ts > maxTimestampMs) maxTimestampMs = ts;
    }
  }
  const generatedDocsTimestamp = maxTimestampMs > 0
    ? new Date(maxTimestampMs).toISOString()
    : new Date().toISOString();

  // Step 4: Pass 1 — Run 5 persona evaluations in parallel
  onProgress({
    type: 'progress',
    step: 'evaluating',
    message: 'Evaluando carpeta...',
    completedCount: 0,
    totalCount: REVIEW_PERSONAS.length,
  });

  const errors: string[] = [];
  let completedCount = 0;
  const pool = createConcurrencyPool(3);

  const personaResults = await Promise.all(
    REVIEW_PERSONAS.map((persona) =>
      pool.run(async (): Promise<PersonaReviewResult | null> => {
        try {
          const result = await evaluateWithPersona(persona, project, generatedDocs);
          completedCount++;
          onProgress({
            type: 'progress',
            step: 'persona_complete',
            personaId: persona.id,
            personaName: persona.name,
            completedCount,
            totalCount: REVIEW_PERSONAS.length,
            message: `${persona.name} completo (${completedCount}/${REVIEW_PERSONAS.length})`,
          });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Error en evaluacion de ${persona.name}:`, message);
          errors.push(`${persona.name}: ${message}`);
          completedCount++;
          onProgress({
            type: 'progress',
            step: 'persona_complete',
            personaId: persona.id,
            personaName: persona.name,
            completedCount,
            totalCount: REVIEW_PERSONAS.length,
            message: `${persona.name} fallo (${completedCount}/${REVIEW_PERSONAS.length})`,
          });
          return null;
        }
      }),
    ),
  );

  // Step 5: Pass 2 — Cross-document coherence check
  onProgress({
    type: 'progress',
    step: 'coherence',
    message: 'Verificando coherencia entre documentos...',
  });

  let coherenceContradictions: CoherenceContradiction[] = [];
  try {
    coherenceContradictions = await runCoherenceCheck(personaResults, generatedDocs, project);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error en verificacion de coherencia:', message);
    errors.push(`Coherencia: ${message}`);
  }

  // Step 6: Compute readiness and estimated score
  const allFindings: ReviewFinding[] = personaResults
    .filter((r): r is PersonaReviewResult => r !== null)
    .flatMap((r) => r.findings);

  const readiness = computeReadiness(allFindings.length, coherenceContradictions.length);
  const estimatedScore = computeEstimatedScore(allFindings.length, coherenceContradictions.length);
  const reviewedAt = new Date().toISOString();

  // Step 7: Persist to Firestore
  onProgress({
    type: 'progress',
    step: 'saving',
    message: 'Guardando resultados...',
  });

  const db = getFirestore();
  await db.doc(`projects/${projectId}/meta/pre_submission_review`).set({
    personaResults: personaResults.filter(Boolean),
    coherenceContradictions,
    readiness,
    estimatedScore,
    reviewedAt: FieldValue.serverTimestamp(),
    generatedDocsTimestamp,
    checklist: allFindings.map((f) => ({ ...f, resolved: false })),
    errors: errors.length > 0 ? errors : null,
  });

  // Step 8: Return result
  return {
    success: personaResults.some((r) => r !== null),
    personaResults,
    coherenceContradictions,
    readiness,
    estimatedScore,
    reviewedAt,
    generatedDocsTimestamp,
    errors: errors.length > 0 ? errors : undefined,
  };
}
