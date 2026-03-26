/**
 * Shared types for the AI document generation pipeline.
 * Defines all 21 generated documents, 4 generation passes,
 * and the generation state model.
 */

import type { Timestamp } from 'firebase-admin/firestore';

// ---- Pass identifiers ----

/** The 4 generation passes in execution order */
export type PassId = 'lineProducer' | 'financeAdvisor' | 'legal' | 'combined';

// ---- Document identifiers ----

/**
 * All 21 generated document identifiers.
 * Naming follows EFICINE section numbering (A1-A11, B3, C2b-C4, E1-E2, PITCH).
 */
export type DocumentId =
  | 'A1'
  | 'A2'
  | 'A4'
  | 'A6'
  | 'A7'
  | 'A8a'
  | 'A8b'
  | 'A9a'
  | 'A9b'
  | 'A9d'
  | 'A10'
  | 'A11'
  | 'B3-prod'
  | 'B3-dir'
  | 'C2b'
  | 'C3a'
  | 'C3b'
  | 'C4'
  | 'E1'
  | 'E2'
  | 'PITCH';

// ---- Generated document (Firestore: projects/{id}/generated/{docId}) ----

export interface GeneratedDocument {
  docId: DocumentId;
  /** Spanish display name, e.g. "Propuesta de Produccion" */
  docName: string;
  /** EFICINE section: A, B, C, E, or EXTRA */
  section: string;
  passId: PassId;
  /** Structured JSON for tables, string for prose */
  content: unknown;
  contentType: 'prose' | 'structured' | 'table';
  generatedAt: Timestamp;
  /** Hash of inputs used to detect staleness */
  inputHash: string;
  modelUsed: string;
  promptFile: string;
  version: number;
  manuallyEdited: boolean;
  editedContent?: string;
}

// ---- Version trigger reasons ----

export type VersionTriggerReason = 'regeneration' | 'manual_revert' | 'pipeline_run';

// ---- Document version snapshot (Firestore: projects/{id}/generated/{docId}/versions/{versionNumber}) ----

/** Version snapshot stored in projects/{projectId}/generated/{docId}/versions/{versionNumber} */
export interface DocumentVersion {
  /** Full content snapshot (editedContent ?? content at time of archival) */
  content: unknown;
  /** Manual edits snapshot if they existed */
  editedContent: string | null;
  /** Content type: 'prose' | 'structured' | 'table' */
  contentType: 'prose' | 'structured' | 'table';
  /** Version number (matches subcollection doc ID) */
  version: number;
  /** Pass that produced this version */
  passId: PassId;
  /** When this version was originally generated */
  generatedAt: Timestamp | null;
  /** Server timestamp when snapshot was taken */
  archivedAt: Timestamp;
  /** Why this version was created: regeneration, manual_revert, or pipeline_run */
  triggerReason: VersionTriggerReason;
  /** userId of who triggered the change (null for legacy/system) */
  triggeredBy: string | null;
  /** AI model used for this version */
  modelUsed: string;
  /** Prompt file used for this version */
  promptFile: string;
}

// ---- Generation state (Firestore: projects/{id}/meta/generation_state) ----

export interface PassState {
  generatedAt: Timestamp | null;
  status: 'pending' | 'generating' | 'complete' | 'error' | 'stale';
}

export interface GenerationState {
  passes: Record<PassId, PassState>;
  lastPipelineRun: Timestamp | null;
  pipelineStatus: 'idle' | 'running' | 'complete' | 'partial' | 'error';
  failedAtPass: PassId | null;
}

// ---- Document registry ----

export interface DocumentRegistryEntry {
  docName: string;
  section: string;
  passId: PassId;
  contentType: 'prose' | 'structured' | 'table';
  promptFile: string;
}

/**
 * Static registry mapping all 21 documents with metadata.
 * Pass assignments:
 *   lineProducer: A7, A8a, A8b, A9a, A9b
 *   financeAdvisor: A9d, E1, E2
 *   legal: B3-prod, B3-dir, C2b, C3a, C3b
 *   combined: A1, A2, A4, A6, A10, A11, C4, PITCH
 */
export const DOCUMENT_REGISTRY: Record<DocumentId, DocumentRegistryEntry> = {
  // ---- Line Producer pass ----
  A7: {
    docName: 'Propuesta de Produccion',
    section: 'A',
    passId: 'lineProducer',
    contentType: 'prose',
    promptFile: 'a7_propuesta_produccion.md',
  },
  A8a: {
    docName: 'Plan de Rodaje',
    section: 'A',
    passId: 'lineProducer',
    contentType: 'table',
    promptFile: 'a8_plan_rodaje_y_ruta_critica.md',
  },
  A8b: {
    docName: 'Ruta Critica',
    section: 'A',
    passId: 'lineProducer',
    contentType: 'table',
    promptFile: 'a8_plan_rodaje_y_ruta_critica.md',
  },
  A9a: {
    docName: 'Presupuesto Resumen',
    section: 'A',
    passId: 'lineProducer',
    contentType: 'structured',
    promptFile: 'a9_presupuesto.md',
  },
  A9b: {
    docName: 'Presupuesto Desglosado',
    section: 'A',
    passId: 'lineProducer',
    contentType: 'structured',
    promptFile: 'a9_presupuesto.md',
  },

  // ---- Finance Advisor pass ----
  A9d: {
    docName: 'Flujo de Efectivo',
    section: 'A',
    passId: 'financeAdvisor',
    contentType: 'table',
    promptFile: 'documentos_financieros.md',
  },
  E1: {
    docName: 'Esquema Financiero (FORMATO 9)',
    section: 'E',
    passId: 'financeAdvisor',
    contentType: 'structured',
    promptFile: 'documentos_financieros.md',
  },
  E2: {
    docName: 'Carta de Aportacion Exclusiva (FORMATO 10)',
    section: 'E',
    passId: 'financeAdvisor',
    contentType: 'prose',
    promptFile: 'documentos_financieros.md',
  },

  // ---- Legal pass ----
  'B3-prod': {
    docName: 'Contrato Productor',
    section: 'B',
    passId: 'legal',
    contentType: 'prose',
    promptFile: 'documentos_legales.md',
  },
  'B3-dir': {
    docName: 'Contrato Director',
    section: 'B',
    passId: 'legal',
    contentType: 'prose',
    promptFile: 'documentos_legales.md',
  },
  C2b: {
    docName: 'Cesion de Derechos de Guion',
    section: 'C',
    passId: 'legal',
    contentType: 'prose',
    promptFile: 'documentos_legales.md',
  },
  C3a: {
    docName: 'Carta Compromiso Buenas Practicas (FORMATO 6)',
    section: 'C',
    passId: 'legal',
    contentType: 'prose',
    promptFile: 'documentos_legales.md',
  },
  C3b: {
    docName: 'Carta Compromiso PICS (FORMATO 7)',
    section: 'C',
    passId: 'legal',
    contentType: 'prose',
    promptFile: 'documentos_legales.md',
  },

  // ---- Combined pass ----
  A1: {
    docName: 'Resumen Ejecutivo (FORMATO 1)',
    section: 'A',
    passId: 'combined',
    contentType: 'prose',
    promptFile: 'a1_resumen_ejecutivo.md',
  },
  A2: {
    docName: 'Sinopsis',
    section: 'A',
    passId: 'combined',
    contentType: 'prose',
    promptFile: 'a2_sinopsis.md',
  },
  A4: {
    docName: 'Propuesta Creativa de Direccion (Plantilla)',
    section: 'A',
    passId: 'combined',
    contentType: 'prose',
    promptFile: 'documentos_combinados.md',
  },
  A6: {
    docName: 'Solidez del Equipo Creativo (FORMATO 2)',
    section: 'A',
    passId: 'combined',
    contentType: 'prose',
    promptFile: 'documentos_combinados.md',
  },
  A10: {
    docName: 'Propuesta de Exhibicion y Distribucion',
    section: 'A',
    passId: 'combined',
    contentType: 'prose',
    promptFile: 'a10_propuesta_exhibicion.md',
  },
  A11: {
    docName: 'Propuesta de Formacion de Publico',
    section: 'A',
    passId: 'combined',
    contentType: 'prose',
    promptFile: 'documentos_combinados.md',
  },
  C4: {
    docName: 'Ficha Tecnica (FORMATO 8)',
    section: 'C',
    passId: 'combined',
    contentType: 'structured',
    promptFile: 'documentos_combinados.md',
  },
  PITCH: {
    docName: 'Pitch para Contribuyentes',
    section: 'EXTRA',
    passId: 'combined',
    contentType: 'prose',
    promptFile: 'documentos_combinados.md',
  },
};
