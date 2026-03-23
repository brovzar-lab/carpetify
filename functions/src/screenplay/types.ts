/**
 * TypeScript interfaces for the screenplay processing pipeline.
 * Field names match the Zod schema in src/schemas/screenplay.ts
 * (Spanish field names per EFICINE conventions).
 */

// PDF extraction output
export interface ExtractionResult {
  text: string;          // Full extracted text with line breaks
  numPages: number;      // Total page count
  metadata: {
    title?: string;
    author?: string;
    creator?: string;    // Authoring tool (Final Draft, WriterSolo, etc.)
  };
}

// Individual parsed scene -- mirrors Escena from src/schemas/screenplay.ts
export interface ParsedScene {
  numero: number;
  int_ext: 'INT' | 'EXT' | 'INT-EXT';
  dia_noche: 'DIA' | 'NOCHE' | 'AMANECER' | 'ATARDECER';
  locacion: string;
  personajes: string[];
  rawText: string;       // Raw text content of the scene (for Claude context)
}

// Location summary
export interface LocationSummary {
  nombre: string;
  tipo: string;          // INT, EXT, or INT-EXT
  frecuencia: number;    // Number of scenes at this location
}

// Character summary
export interface CharacterSummary {
  nombre: string;
  num_escenas: number;
  es_protagonista: boolean;
}

// Full screenplay breakdown -- output of parseStructure
export interface ScreenplayBreakdown {
  num_paginas: number;
  num_escenas: number;
  escenas: ParsedScene[];
  locaciones: LocationSummary[];
  personajes: CharacterSummary[];
  desglose_int_ext: { int: number; ext: number; int_ext: number };
  desglose_dia_noche: { dia: number; noche: number; otro: number };
  raw_text: string;      // Full raw text for Claude analysis input
}

// Claude analysis result -- stored in Firestore at projects/{projectId}/screenplay/analysis
export interface AnalysisResult {
  datos_generales: Record<string, unknown>;
  desglose_escenas: Array<Record<string, unknown>>;
  locaciones_unicas: Array<Record<string, unknown>>;
  personajes_detalle: Array<Record<string, unknown>>;
  complejidad_global: {
    escenas_nocturnas: number;
    escenas_diurnas: number;
    escenas_exteriores: number;
    escenas_interiores: number;
    cambios_locacion: number;
    escenas_stunts: number;
    escenas_vfx: number;
    escenas_extras_numerosos: number;
    escenas_menores: number;
    escenas_agua: number;
    resumen_retos: string;
  };
  estimacion_jornadas: {
    baja: number;
    media: number;
    alta: number;
    justificacion: string;
  };
}

// Extraction Cloud Function request/response
export interface ExtractRequest {
  projectId: string;
  storagePath: string;   // Path in Firebase Storage where PDF was uploaded
}

export interface ExtractResponse {
  success: boolean;
  breakdown?: ScreenplayBreakdown;
  error?: string;
}

// Analysis Cloud Function request/response
export interface AnalyzeRequest {
  projectId: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
}
