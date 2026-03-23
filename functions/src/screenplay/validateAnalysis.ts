import type { AnalysisResult } from './types.js';

/**
 * Validates that Claude's JSON response contains the required fields.
 * Per D-10: validate against expected schema before storing.
 * Returns { valid, result?, error? }
 */
export function validateAnalysisResponse(
  raw: unknown,
): { valid: boolean; result?: AnalysisResult; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'La respuesta no es un objeto JSON valido.' };
  }

  const obj = raw as Record<string, unknown>;

  // Check required top-level fields
  if (!obj.complejidad_global || typeof obj.complejidad_global !== 'object') {
    return { valid: false, error: 'Falta el campo complejidad_global en la respuesta.' };
  }

  if (!obj.estimacion_jornadas || typeof obj.estimacion_jornadas !== 'object') {
    return { valid: false, error: 'Falta el campo estimacion_jornadas en la respuesta.' };
  }

  const jornadas = obj.estimacion_jornadas as Record<string, unknown>;
  if (
    typeof jornadas.baja !== 'number' ||
    typeof jornadas.media !== 'number' ||
    typeof jornadas.alta !== 'number'
  ) {
    return {
      valid: false,
      error: 'estimacion_jornadas debe contener baja, media y alta como numeros.',
    };
  }

  // Cast to AnalysisResult -- fields beyond required ones are kept as-is
  return { valid: true, result: raw as AnalysisResult };
}
