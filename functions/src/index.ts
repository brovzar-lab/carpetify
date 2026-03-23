import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { extractTextFromPdf } from './screenplay/extractText.js';
import { parseScreenplayStructure } from './screenplay/parseStructure.js';
import { handleAnalyzeScreenplay } from './screenplay/analyzeHandler.js';
import type { ExtractRequest, ExtractResponse, AnalyzeRequest, AnalyzeResponse } from './screenplay/types.js';

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
    timeoutSeconds: 120,
    memory: '1GiB',
    region: 'us-central1',
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

      // 2. Extract text
      const extraction = await extractTextFromPdf(buffer);

      // D-05: Check page count (200 page limit)
      if (extraction.numPages > 200) {
        throw new HttpsError(
          'invalid-argument',
          'El guion excede el limite de 200 paginas.',
        );
      }

      // 3. Parse screenplay structure
      const breakdown = parseScreenplayStructure(extraction.text, extraction.numPages);

      // 4. Store in Firestore
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
          // Mark any existing analysis as stale per D-11 / AIGEN-09
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
