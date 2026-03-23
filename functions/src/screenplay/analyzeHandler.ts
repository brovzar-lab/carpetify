import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { analyzeScreenplayWithClaude } from './analyzeWithClaude.js';
import type { AnalyzeResponse } from './types.js';

/** Minimal Firestore interface for dependency injection in tests. */
export interface FirestoreDb {
  doc(path: string): {
    get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
    set(data: Record<string, unknown>): Promise<unknown>;
    update(data: Record<string, unknown>): Promise<unknown>;
  };
}

/** FieldValue factory for dependency injection in tests. */
export interface FieldValueFactory {
  serverTimestamp(): unknown;
}

/**
 * Core handler logic for analyzeScreenplay Cloud Function.
 * Extracted from onCall wrapper for testability.
 *
 * Reads parsed screenplay data from Firestore, calls Claude API,
 * validates response, stores analysis in Firestore.
 *
 * @param projectId - Firestore project ID
 * @param apiKey - Anthropic API key
 * @param dbOverride - Optional Firestore DB for testing
 * @param fieldValueOverride - Optional FieldValue factory for testing
 */
export async function handleAnalyzeScreenplay(
  projectId: string,
  apiKey: string,
  dbOverride?: FirestoreDb,
  fieldValueOverride?: FieldValueFactory,
): Promise<AnalyzeResponse> {
  const db = dbOverride ?? (getFirestore() as unknown as FirestoreDb);
  const fv = fieldValueOverride ?? FieldValue;

  // 1. Read screenplay data and project metadata from Firestore
  const screenplayDoc = await db.doc(`projects/${projectId}/screenplay/data`).get();
  if (!screenplayDoc.exists) {
    throw Object.assign(new Error('No se encontraron datos del guion. Sube un guion primero.'), {
      code: 'not-found',
    });
  }

  const screenplayData = screenplayDoc.data()!;
  const rawText = screenplayData.raw_text as string;
  if (!rawText) {
    throw Object.assign(new Error('No hay texto extraido. Ejecuta la extraccion primero.'), {
      code: 'failed-precondition',
    });
  }

  // Get project metadata for prompt variables
  const projectDoc = await db.doc(`projects/${projectId}`).get();
  const projectData = projectDoc.data() || {};
  const titulo = (projectData.titulo_proyecto as string) || 'Sin titulo';
  const genero = (projectData.categoria_cinematografica as string) || 'Ficcion';

  try {
    // 2. Call Claude API
    const { analysis, raw_response } = await analyzeScreenplayWithClaude(
      rawText,
      titulo,
      genero,
      apiKey,
    );

    // 3. Store analysis in Firestore per D-09
    const analysisRef = db.doc(`projects/${projectId}/screenplay/analysis`);
    await analysisRef.set({
      ...analysis,
      raw_response,
      analyzed_at: fv.serverTimestamp(),
      analysis_version: 1,
    });

    // 4. Update screenplay document status and shooting day estimate
    const screenplayRef = db.doc(`projects/${projectId}/screenplay/data`);
    await screenplayRef.update({
      screenplay_status: 'analyzed',
      analysis_stale: false,
      dias_rodaje_estimados: analysis.estimacion_jornadas.media,
      complejidad: {
        stunts: (analysis.complejidad_global.escenas_stunts || 0) > 0,
        vfx: (analysis.complejidad_global.escenas_vfx || 0) > 0,
        agua: (analysis.complejidad_global.escenas_agua || 0) > 0,
        animales: false,
        ninos: (analysis.complejidad_global.escenas_menores || 0) > 0,
        noche_pct:
          analysis.complejidad_global.escenas_nocturnas > 0
            ? Math.round(
                (analysis.complejidad_global.escenas_nocturnas /
                  (analysis.complejidad_global.escenas_nocturnas +
                    analysis.complejidad_global.escenas_diurnas)) *
                  100,
              )
            : 0,
      },
      last_analyzed: fv.serverTimestamp(),
      updatedAt: fv.serverTimestamp(),
    });

    return { success: true, analysis };
  } catch (err) {
    console.error('analyzeScreenplay error:', err);

    // Update status to analysis_error
    try {
      await db.doc(`projects/${projectId}/screenplay/data`).update({
        screenplay_status: 'analysis_error',
        updatedAt: fv.serverTimestamp(),
      });
    } catch {
      /* best effort */
    }

    throw err;
  }
}
