import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { extractScreenplayWithClaude } from './screenplay/extractWithClaude.js';
import { handleAnalyzeScreenplay } from './screenplay/analyzeHandler.js';
import { handleLineProducerPass } from './pipeline/passes/lineProducer.js';
import { handleFinanceAdvisorPass } from './pipeline/passes/financeAdvisor.js';
import { handleLegalPass } from './pipeline/passes/legal.js';
import { handleCombinedPass } from './pipeline/passes/combined.js';
import { loadProjectDataForGeneration } from './pipeline/orchestrator.js';
import { initClaudeClient } from './claude/client.js';
import { handleScoreEstimation } from './scoreHandler.js';
import type { ExtractRequest, ExtractResponse, AnalyzeRequest, AnalyzeResponse } from './screenplay/types.js';
import type { ScoreEstimationRequest } from './scoreHandler.js';

initializeApp();

// D-07: API key via Secret Manager
const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

/**
 * extractScreenplay: Callable Cloud Function.
 * Reads PDF from Firebase Storage, extracts text, parses screenplay structure.
 * Stores parsed breakdown in Firestore at projects/{projectId}/screenplay/data.
 * Per D-05: rejects PDFs over 200 pages or 15MB.
 * Per D-06: separate from analysis function -- extraction is fast and cheap.
 * Memory: 1GiB (PDF in memory). Timeout: 120s (extraction is fast).
 * Region: us-central1.
 */
export const extractScreenplay = onCall(
  {
    timeoutSeconds: 240,
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request): Promise<ExtractResponse> => {
    const { projectId, storagePath } = request.data as ExtractRequest;

    if (!projectId || !storagePath) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId y storagePath.');
    }

    try {
      // 1. Download PDF from Storage
      const bucket = getStorage().bucket();
      const file = bucket.file(storagePath);
      const [buffer] = await file.download();

      // D-05: Check file size (15MB limit)
      if (buffer.length > 15 * 1024 * 1024) {
        throw new HttpsError(
          'invalid-argument',
          'El guion excede el limite de 15 MB.',
        );
      }

      // 2. Extract screenplay structure using Claude AI (reads PDF natively)
      const apiKey = anthropicApiKey.value();
      const breakdown = await extractScreenplayWithClaude(buffer, apiKey);

      // 3. Store in Firestore
      const db = getFirestore();
      const docRef = db.doc(`projects/${projectId}/screenplay/data`);
      await docRef.set(
        {
          num_paginas: breakdown.num_paginas,
          num_escenas: breakdown.num_escenas,
          escenas: breakdown.escenas.map((s) => ({
            numero: s.numero,
            int_ext: s.int_ext,
            dia_noche: s.dia_noche,
            locacion: s.locacion,
            personajes: s.personajes,
          })),
          locaciones: breakdown.locaciones,
          personajes: breakdown.personajes,
          raw_text: breakdown.raw_text,
          desglose_int_ext: breakdown.desglose_int_ext,
          desglose_dia_noche: breakdown.desglose_dia_noche,
          screenplay_status: breakdown.num_escenas > 0 ? 'parsed' : 'uploaded',
          parsed_at: FieldValue.serverTimestamp(),
          analysis_stale: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return { success: true, breakdown };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error('extractScreenplay error:', err);
      throw new HttpsError('internal', 'Error al extraer texto del guion.');
    }
  },
);

/**
 * analyzeScreenplay: Callable Cloud Function.
 * Reads parsed screenplay data from Firestore, calls Claude API via
 * prompts/analisis_guion.md, validates response, stores analysis in Firestore.
 * Per D-06: separate from extraction -- can retry without re-extracting.
 * Per D-08: Uses claude-sonnet-4-20250514.
 * Per D-09: Stores at projects/{projectId}/screenplay/analysis as single document.
 * Per D-12: User-triggered, not automatic.
 * Timeout: 540s (9 min, max for callable). Memory: 1GiB.
 */
export const analyzeScreenplay = onCall(
  {
    timeoutSeconds: 540,
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request): Promise<AnalyzeResponse> => {
    const { projectId } = request.data as AnalyzeRequest;

    if (!projectId) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId.');
    }

    const apiKey = anthropicApiKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'ANTHROPIC_API_KEY no esta configurada.');
    }

    try {
      return await handleAnalyzeScreenplay(projectId, apiKey);
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', 'No se pudo completar el analisis del guion.');
    }
  },
);

// ---- Generation Pipeline: Pass 2 (Line Producer) ----

/**
 * runLineProducerPass: Callable Cloud Function with streaming.
 * Generates 5 documents: A7, A8a, A8b, A9a, A9b.
 * Budget is computed deterministically via computeBudget (not AI).
 * Streams real-time progress chunks to client.
 * Timeout: 300s (5 min per pass). Memory: 1GiB.
 */
export const runLineProducerPass = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request, response) => {
    const { projectId } = request.data as { projectId: string };
    if (!projectId) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId.');
    }

    initClaudeClient(anthropicApiKey.value());
    const project = await loadProjectDataForGeneration(projectId);

    const onProgress = (chunk: unknown) => {
      if (request.acceptsStreaming && response) {
        response.sendChunk(chunk);
      }
    };

    return await handleLineProducerPass(projectId, project, onProgress);
  },
);

// ---- Generation Pipeline: Pass 3 (Finance Advisor) ----

/**
 * runFinanceAdvisorPass: Callable Cloud Function with streaming.
 * Generates 3 documents: A9d, E1, E2.
 * Financial figures from deterministic computation (buildCashFlow, computeFinancialScheme).
 * Requires lineProducer pass to have run first (reads budget from documentStore).
 * Streams real-time progress chunks to client.
 * Timeout: 300s (5 min per pass). Memory: 1GiB.
 */
export const runFinanceAdvisorPass = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request, response) => {
    const { projectId } = request.data as { projectId: string };
    if (!projectId) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId.');
    }

    initClaudeClient(anthropicApiKey.value());
    const project = await loadProjectDataForGeneration(projectId);

    const onProgress = (chunk: unknown) => {
      if (request.acceptsStreaming && response) {
        response.sendChunk(chunk);
      }
    };

    return await handleFinanceAdvisorPass(projectId, project, onProgress);
  },
);

// ---- Generation Pipeline: Pass 4 (Legal) ----

/**
 * runLegalPass: Callable Cloud Function with streaming.
 * Generates 5 documents: B3-prod, B3-dir, C2b, C3a, C3b.
 * Fee amounts injected deterministically from intake team data via formatMXNLegal.
 * Requires lineProducer pass to have run first (validates budget exists).
 * Streams real-time progress chunks to client.
 * Timeout: 300s (5 min per pass). Memory: 1GiB.
 */
export const runLegalPass = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request, response) => {
    const { projectId } = request.data as { projectId: string };
    if (!projectId) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId.');
    }

    initClaudeClient(anthropicApiKey.value());
    const project = await loadProjectDataForGeneration(projectId);

    const onProgress = (chunk: unknown) => {
      if (request.acceptsStreaming && response) {
        response.sendChunk(chunk);
      }
    };

    return await handleLegalPass(projectId, project, onProgress);
  },
);

// ---- Generation Pipeline: Pass 5 (Combined -- final pass) ----

/**
 * runCombinedPass: Callable Cloud Function with streaming.
 * Generates 8 documents: A1, A2, A4, A6, A10, A11, C4, PITCH.
 * Synthesizes ALL prior pass outputs. A4 is a template (no AI).
 * PITCH targets corporate CFOs per AIGEN-11.
 * Streams real-time progress chunks to client.
 * Timeout: 600s (10 min -- 8 documents, largest pass). Memory: 1GiB.
 */
export const runCombinedPass = onCall(
  {
    timeoutSeconds: 600,
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request, response) => {
    const { projectId } = request.data as { projectId: string };
    if (!projectId) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId.');
    }

    initClaudeClient(anthropicApiKey.value());
    const project = await loadProjectDataForGeneration(projectId);

    const onProgress = (chunk: unknown) => {
      if (request.acceptsStreaming && response) {
        response.sendChunk(chunk);
      }
    };

    return await handleCombinedPass(projectId, project, onProgress);
  },
);

// ---- Score Estimation ----

/**
 * estimateScore: Callable Cloud Function.
 * Runs 5 parallel AI persona evaluations to estimate EFICINE artistic score.
 * Each persona independently scores guion (40pts), direccion (12pts), material_visual (10pts).
 * Per D-06: 5 named evaluator personas with distinct perspectives.
 * Timeout: 300s (5 parallel calls, each up to 120s, but concurrent).
 * Memory: 1GiB (same as generation functions).
 */
export const estimateScore = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
    region: 'us-central1',
    secrets: [anthropicApiKey],
  },
  async (request) => {
    const data = request.data as ScoreEstimationRequest;

    if (!data.projectId) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId.');
    }

    const apiKey = anthropicApiKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'ANTHROPIC_API_KEY no esta configurada.');
    }

    try {
      return await handleScoreEstimation(data, apiKey);
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error('estimateScore error:', err);
      throw new HttpsError('internal', 'No se pudo completar la evaluacion de puntaje.');
    }
  },
);
