/**
 * Type definitions for the AI pre-submission review feature (Phase 15).
 *
 * Defines 5 evaluator personas in "critique mode" (reusing Phase 4 personas),
 * review findings, coherence contradictions, progress chunks, and the overall
 * review result structure.
 *
 * Per D-05: Two-pass architecture.
 * Per D-06: Reuse 5 Phase 4 personas in critique mode.
 * Per D-07: Each persona reviews only their assigned documents.
 */

// ---- Persona definition ----

export interface ReviewPersona {
  /** Persona identifier: 'reygadas' | 'marcopolo' | 'pato' | 'leo' | 'alejandro' */
  id: string;
  /** Display name */
  name: string;
  /** Prompt file in prompts/evaluadores/ */
  promptFile: string;
  /** Which document IDs this persona reviews */
  documentIds: string[];
  /** Role tag for UI: 'director' | 'comercial' | 'escritor' | 'productor' | 'ejecutivo' */
  role: string;
}

/**
 * The 5 review personas with their exact document assignments per D-07:
 * - Reygadas (director cine de arte): A4 (propuesta direccion), A5 (material visual)
 * - Marcopolo (productor comercial): A10 (propuesta exhibicion), A9a (presupuesto resumen)
 * - Pato (escritor): A2 (sinopsis) — guion alignment is conceptual framing, not separate doc
 * - Leo (productor): A7 (propuesta produccion), A8a (plan de rodaje), A8b (ruta critica)
 * - Alejandro (director comercial): A1 (resumen ejecutivo), A6 (solidez equipo)
 */
export const REVIEW_PERSONAS: ReviewPersona[] = [
  {
    id: 'reygadas',
    name: 'Reygadas',
    promptFile: 'revision_artistico.md',
    documentIds: ['A4', 'A5'],
    role: 'director',
  },
  {
    id: 'marcopolo',
    name: 'Marcopolo',
    promptFile: 'revision_viabilidad.md',
    documentIds: ['A10', 'A9a'],
    role: 'comercial',
  },
  {
    id: 'pato',
    name: 'Pato',
    promptFile: 'revision_narrativa.md',
    documentIds: ['A2'],
    role: 'escritor',
  },
  {
    id: 'leo',
    name: 'Leo',
    promptFile: 'revision_produccion.md',
    documentIds: ['A7', 'A8a', 'A8b'],
    role: 'productor',
  },
  {
    id: 'alejandro',
    name: 'Alejandro',
    promptFile: 'revision_ejecutivo.md',
    documentIds: ['A1', 'A6'],
    role: 'ejecutivo',
  },
];

// ---- Finding types (D-08) ----

/** A single review finding: one weakness + suggestion for one document criterion */
export interface ReviewFinding {
  personaId: string;
  personaName: string;
  documentId: string;
  documentName: string;
  /** Persona's role tag for UI grouping */
  role: string;
  /** Which rubric criterion this finding relates to */
  criterion: string;
  /** What's weak in the document */
  weakness: string;
  /** Concrete improvement suggestion */
  suggestion: string;
  /** Checkbox state for the team to track progress (default false) */
  resolved: boolean;
}

// ---- Coherence contradiction (D-09) ----

/** A cross-document contradiction found in Pass 2 */
export interface CoherenceContradiction {
  /** Persona ID most relevant to this contradiction */
  personaId: string;
  /** Persona display name */
  personaName: string;
  /** Description of the contradiction in Spanish */
  description: string;
  /** Which documents are involved in the contradiction */
  documentIds: string[];
}

// ---- Persona review result ----

/** Result from a single persona's review (Pass 1) */
export interface PersonaReviewResult {
  personaId: string;
  personaName: string;
  findings: ReviewFinding[];
}

// ---- Overall review result ----

/** Complete review result with both Pass 1 and Pass 2 data */
export interface ReviewResult {
  success: boolean;
  /** One result per persona (null if that persona failed) */
  personaResults: (PersonaReviewResult | null)[];
  /** Cross-document contradictions from Pass 2 */
  coherenceContradictions: CoherenceContradiction[];
  /** Overall readiness assessment */
  readiness: 'lista' | 'casi_lista' | 'necesita_trabajo' | 'no_lista';
  /** Estimated score 0-100 */
  estimatedScore: number;
  /** ISO timestamp of when review was performed */
  reviewedAt: string;
  /** Max timestamp of generated docs for staleness detection (Pitfall 6) */
  generatedDocsTimestamp: string;
  /** Errors from failed personas */
  errors?: string[];
}

// ---- Progress chunk ----

/** Streaming progress chunk sent to the client as each step completes */
export type ReviewProgressChunk = {
  type: 'progress';
  step: 'loading_data' | 'evaluating' | 'persona_complete' | 'coherence' | 'saving';
  personaId?: string;
  personaName?: string;
  completedCount?: number;
  totalCount?: number;
  message: string;
};
