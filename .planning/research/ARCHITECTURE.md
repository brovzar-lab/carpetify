# Architecture Patterns

**Domain:** EFICINE Article 189 submission dossier generator
**Researched:** 2026-03-21

## Recommended Architecture

### High-Level Overview

Carpetify is a pipeline application disguised as a wizard. The user fills forms, but under the hood the system is a **sequential document generation pipeline** where each stage feeds the next. The architecture must reflect this: data flows forward through well-defined stages, and changes to upstream data invalidate downstream outputs.

```
[Intake Wizard] --> [Firestore Project Doc] --> [Screenplay Parser]
                                                       |
                                                       v
                                              [AI Generation Pipeline]
                                              Pass 1: Screenplay Analysis
                                              Pass 2: Line Producer (A7, A8, A9)
                                              Pass 3: Finance (flujo, esquema, carta)
                                              Pass 4: Legal (contracts, cartas)
                                              Pass 5: Combined (A1, A2, A6, A10, C4, pitch)
                                              Pass 6: Cross-validation
                                                       |
                                                       v
                                              [Validation Engine]
                                              13 rules, blocker vs warning
                                                       |
                                                       v
                                              [Export Manager]
                                              PDF generation + ZIP packaging
```

### Component Boundaries

| Component | Responsibility | Communicates With | Firebase Surface |
|-----------|---------------|-------------------|------------------|
| **Intake Wizard** | Collect project metadata, team data, financial structure, uploaded docs | Firestore (write), Storage (file uploads) | Firestore `projects/{id}`, Storage `projects/{id}/uploads/` |
| **Screenplay Parser** | Extract scenes, locations, characters, INT/EXT/DAY/NIGHT from PDF | Storage (read PDF), Firestore (write parsed data) | Firestore `projects/{id}/screenplay` |
| **AI Generation Pipeline** | Run 6 sequential passes through Claude API, produce document content | Firestore (read all project data, write generated docs), Cloud Functions (orchestration) | Firestore `projects/{id}/generated/{docId}` |
| **Validation Engine** | Run 13 cross-module rules, classify blockers vs warnings | Firestore (read all data + generated docs, write validation results) | Firestore `projects/{id}/validation` |
| **Dashboard** | Show traffic-light status per document and per rule, score estimate | Firestore (read validation results, generated doc status) | Read-only |
| **Export Manager** | Generate PDFs from stored content, name files, compile ZIP | Firestore (read generated docs), Storage (read uploaded docs, write final ZIP) | Storage `projects/{id}/export/` |

### Data Flow

```
USER INPUT FLOW:
  Wizard Screen 1 (Project Setup)
    --> projects/{id}/metadata
  Wizard Screen 2 (Screenplay Upload)
    --> Storage: projects/{id}/uploads/guion.pdf
    --> [Screenplay Parser trigger]
    --> projects/{id}/screenplay (parsed breakdown)
  Wizard Screen 3 (Creative Team)
    --> projects/{id}/team/{memberId}
  Wizard Screen 4 (Financial Structure)
    --> projects/{id}/financials
  Wizard Screen 5 (Document Upload)
    --> Storage: projects/{id}/uploads/{docType}.pdf
    --> projects/{id}/documents/{docId} (metadata + status)

AI GENERATION FLOW (sequential, each pass reads outputs of prior passes):
  Pass 1: analisis_guion.md
    IN:  screenplay parsed data
    OUT: projects/{id}/generated/screenplay_analysis
         (scenes, locations, characters, complexity signals, shooting day estimate)

  Pass 2: Line Producer documents
    IN:  screenplay_analysis + metadata + team
    OUT: projects/{id}/generated/a7_propuesta_produccion
         projects/{id}/generated/a8_plan_rodaje
         projects/{id}/generated/a8_ruta_critica
         projects/{id}/generated/a9_presupuesto_resumen
         projects/{id}/generated/a9_presupuesto_desglose

  Pass 3: Finance documents
    IN:  Pass 2 outputs (budget) + financials from intake
    OUT: projects/{id}/generated/a9d_flujo_efectivo
         projects/{id}/generated/e1_esquema_financiero
         projects/{id}/generated/e2_carta_aportacion

  Pass 4: Legal documents
    IN:  Pass 2 outputs (budget fees) + team data + metadata
    OUT: projects/{id}/generated/b3_contratos
         projects/{id}/generated/c2b_cesion_derechos
         projects/{id}/generated/c3_cartas_compromiso

  Pass 5: Combined documents
    IN:  ALL prior pass outputs + metadata + team + screenplay
    OUT: projects/{id}/generated/a1_resumen_ejecutivo
         projects/{id}/generated/a2_sinopsis
         projects/{id}/generated/a4_propuesta_direccion (template)
         projects/{id}/generated/a6_solidez_equipo
         projects/{id}/generated/a10_propuesta_exhibicion
         projects/{id}/generated/c4_ficha_tecnica
         projects/{id}/generated/pitch_contribuyentes

  Pass 6: Cross-validation
    IN:  ALL generated documents
    OUT: projects/{id}/generated/validacion_cruzada

VALIDATION FLOW (runs after generation and on any data change):
  IN:  All of projects/{id}/** (metadata, team, financials, generated, documents)
  OUT: projects/{id}/validation/
       {rule_id: {status: pass|fail|warning, details: string, affected_docs: [...]}}

EXPORT FLOW:
  IN:  projects/{id}/generated/** + projects/{id}/uploads/**
  OUT: Storage projects/{id}/export/carpeta_{PROJ}.zip
```

## Component Deep Dives

### 1. Intake Wizard (React Client)

**Pattern:** Multi-step form wizard with local state + Firestore persistence per screen.

Use a single `ProjectContext` React context that holds the current project state. Each wizard screen reads from and writes to a specific Firestore subcollection. Use `react-hook-form` for per-screen form state with Zod validation matching the JSON schemas in `schemas/`.

**Key design decision:** Persist to Firestore on screen completion (not on every keystroke). This avoids excessive writes and gives natural save points. Show a "Guardando..." indicator on screen transitions.

**Screen dependencies:**
- Screen 1 (Project Setup): No dependencies. Creates the project document.
- Screen 2 (Screenplay Upload): Requires projectId from Screen 1. Triggers async screenplay parsing.
- Screen 3 (Creative Team): No hard dependency on Screen 2, but screenplay data enriches role suggestions.
- Screen 4 (Financial Structure): Requires basic metadata from Screen 1 for EFICINE cap validation.
- Screen 5 (Document Upload): Requires projectId. Independent of other screens.

### 2. Screenplay Parser (Cloud Function)

**Pattern:** Triggered by Storage upload event. Runs PDF text extraction, then sends to Claude for structured analysis.

```
Storage trigger (guion.pdf uploaded)
  --> Cloud Function: parseScreenplay
    --> pdf-parse: extract raw text
    --> Claude API (analisis_guion.md prompt): structured analysis
    --> Write to Firestore: projects/{id}/screenplay
    --> Update status: projects/{id}/metadata.screenplay_status = "parsed"
```

Use `pdf-parse` (npm package) for text extraction from the PDF. Do NOT use pdf.js on the client -- screenplay PDFs can be large and parsing is CPU-intensive. Run in a Cloud Function with 512MB+ memory and 120s timeout.

The Claude call for screenplay analysis is the **foundation** of the entire pipeline. Every subsequent generation pass depends on its output. Store the full structured output (scenes array, locations array, characters array, complexity signals, estimated shooting days).

### 3. AI Generation Pipeline (Cloud Functions)

**Pattern:** Sequential Cloud Function chain. Each pass is a separate Cloud Function invocation. Use a pipeline orchestrator function that calls each pass in order and tracks progress.

**Why Cloud Functions, not client-side:**
- Claude API calls for document generation are long-running (30-90 seconds each).
- Pass 2 alone has 5 document generations. Total pipeline time: 5-15 minutes.
- Cloud Functions have 540s (9 min) max timeout on v2. For the full pipeline, use a chained approach.
- Client should show progress via Firestore listeners, not hold open connections.

**Pipeline orchestrator pattern:**

```typescript
// Firestore document tracks pipeline state
projects/{id}/pipeline: {
  status: "idle" | "running" | "complete" | "error",
  currentPass: 1-6,
  currentDoc: string,
  completedDocs: string[],
  errors: {docId: string, error: string}[],
  startedAt: Timestamp,
  completedAt: Timestamp | null
}
```

The orchestrator Cloud Function:
1. Reads all project data from Firestore
2. For each pass (1-6), calls Claude with the appropriate prompt from `prompts/`
3. Substitutes `{{variables}}` in the prompt template with actual project data
4. Appends the language guardrail block from politica_idioma
5. Stores each generated document in `projects/{id}/generated/{docId}`
6. Updates pipeline status after each document (client sees real-time progress)
7. If a pass fails, marks the error and continues to the next independent document

**Critical: prompt template loading.** Store prompt templates as static assets deployed with the Cloud Functions (copy `prompts/*.md` into the functions bundle). Do NOT store them in Firestore -- they are code, not data.

**Variable substitution approach:**
```typescript
function substituteVariables(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `[MISSING: ${key}]`);
}
```

### 4. Validation Engine (Shared Library: Client + Cloud Functions)

**Pattern:** Pure functions that take project state and return validation results. Run on both client (for real-time feedback during intake) and Cloud Functions (for authoritative validation before export).

The 13 validation rules from `references/validation_rules.md` fall into two categories:

**Client-side (real-time, during intake):**
- Rule 1.2: EFICINE compliance percentages (as user enters financial data)
- Rule 1.3: Screenwriter 3% check (as fees are entered)
- Rule 1.4: In-kind contribution caps
- Rule 1.5: Gestor cap
- Rule 5: Experience thresholds (as team filmography is entered)
- Rule 6: ERPI eligibility

**Server-side (post-generation):**
- Rule 1.1: Budget/flujo/esquema reconciliation (requires generated docs)
- Rule 2: Title consistency across all generated docs
- Rule 3: Fee cross-matching across contracts/budget/flujo
- Rule 4: Date compliance
- Rule 7: Prohibited EFICINE expenditures in flujo
- Rule 8: Document completeness
- Rule 9: File format compliance

**Both (client for preview, server for authority):**
- Rule 10: Hyperlink accessibility (warning only)
- Rule 11: Ruta critica / flujo sync
- Rule 12: Co-production special rules
- Rule 13: Bonus points eligibility

**Implementation:** Create a `validation/` module with one function per rule. Each returns:
```typescript
type ValidationResult = {
  ruleId: string;
  status: "pass" | "fail" | "warning" | "not_applicable";
  severity: "blocker" | "warning";
  message: string; // In Spanish
  affectedDocs: string[];
  details?: Record<string, unknown>;
};
```

### 5. Dashboard (React Client)

**Pattern:** Real-time Firestore listener on `projects/{id}/validation` and `projects/{id}/pipeline`. Renders traffic-light grid.

The dashboard is the primary view after intake is complete. Shows:
- Pipeline progress (which pass is running, which docs are done)
- Per-document status (generated / pending / error / user-upload needed)
- Per-validation-rule status (pass / fail / warning)
- Score estimate (from scoring rubric)
- Completeness checklist (what the user still needs to provide)

Use `onSnapshot` listeners for real-time updates during generation.

### 6. Export Manager (Cloud Function)

**Pattern:** Cloud Function triggered by user action. Reads all generated content, generates PDFs, packages into ZIP.

```
User clicks "Exportar Carpeta"
  --> Cloud Function: exportCarpeta
    --> Read all generated docs from Firestore
    --> Read all uploaded docs from Storage
    --> Generate PDFs from document content (use @react-pdf/renderer or pdfkit)
    --> Apply file naming convention (max 15 chars, no accents)
    --> Organize into folder structure (A_PROPUESTA/, B_PERSONAL/, etc.)
    --> Create ZIP archive
    --> Upload ZIP to Storage
    --> Return download URL to client
```

Use `pdfkit` or `@react-pdf/renderer` server-side for PDF generation. The generated content in Firestore is structured data (JSON + text blocks); the Export Manager converts this to formatted PDFs matching EFICINE formatting expectations.

Use `archiver` (npm) for ZIP creation.

## Patterns to Follow

### Pattern 1: Firestore as Pipeline State Machine

Use Firestore documents as the shared state between all components. Each component reads what it needs and writes its output. The client uses `onSnapshot` to reactively update the UI.

**Why:** Firebase is already the chosen backend. Firestore real-time listeners eliminate the need for polling, WebSockets, or a custom pub/sub system. The pipeline state is naturally document-shaped.

```typescript
// Pipeline state document
interface PipelineState {
  status: "idle" | "running" | "complete" | "error";
  currentPass: number;
  currentDoc: string;
  progress: Record<string, "pending" | "running" | "complete" | "error">;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
}
```

### Pattern 2: Invalidation Graph for Regeneration

When user changes upstream data, downstream generated documents become stale. Track a dependency graph:

```
metadata.titulo_proyecto --> [ALL generated docs] (title consistency)
screenplay parsed data --> [Pass 1 output] --> [Pass 2 outputs] --> [Pass 3, 4, 5 outputs]
financials --> [Pass 3 outputs] --> [Pass 4 outputs (contract fees)] --> [Pass 5 outputs]
team data --> [Pass 4 outputs (contracts)] --> [Pass 5 outputs (A6 solidez, C4 ficha)]
```

**Implementation:** When any Firestore write occurs in project data, a Cloud Function checks which generated docs depend on the changed fields and marks them as `stale`. The UI shows stale docs with a yellow indicator and a "Regenerar" button.

Store staleness in the generated doc metadata:
```typescript
interface GeneratedDoc {
  docId: string;
  content: Record<string, unknown>; // Structured document content
  generatedAt: Timestamp;
  stale: boolean;
  staleReason?: string;
  dependsOn: string[]; // List of data paths this doc reads from
}
```

### Pattern 3: Prompt-as-Code

Prompts in `prompts/*.md` are treated as immutable code artifacts, not user-editable content. They are bundled with Cloud Functions at deploy time. Variable substitution happens at runtime but the prompt templates themselves are versioned in git.

### Pattern 4: Amount Formatting as a Single Utility

All MXN amounts flow through one formatter: `formatMXN(amount: number): string` returning `$X,XXX,XXX MXN`. This function is used in:
- UI display
- Variable substitution into prompts
- PDF generation
- Validation error messages

Never format amounts inline. Always use the utility.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side AI Calls
**What:** Calling Claude API directly from the React client.
**Why bad:** Exposes API key, no retry logic, browser tab close kills generation, CORS issues, 5-15 minute pipeline blocks the UI thread.
**Instead:** All Claude API calls go through Cloud Functions. Client monitors progress via Firestore listeners.

### Anti-Pattern 2: Monolithic Generation Function
**What:** One Cloud Function that runs all 6 passes sequentially.
**Why bad:** Cloud Functions v2 max timeout is 540 seconds. Full pipeline can exceed this. One failure loses all progress.
**Instead:** Chain passes as separate function invocations, or use a single function with per-document checkpointing (write each generated doc to Firestore immediately, so a restart can skip completed docs).

### Anti-Pattern 3: Storing Generated Content as PDFs in Firestore
**What:** Generating PDFs immediately and storing binary blobs.
**Why bad:** PDFs can't be partially updated, validated field-by-field, or used as input to subsequent generation passes. You need the structured data.
**Instead:** Store generated content as structured JSON in Firestore. Generate PDFs only at export time from the structured data.

### Anti-Pattern 4: Per-Field Real-Time Validation via Cloud Functions
**What:** Calling a Cloud Function every time a form field changes to validate.
**Why bad:** Extremely expensive (Firebase invocations + latency), terrible UX.
**Instead:** Client-side validation for field-level and screen-level rules (Zod schemas from `schemas/*.json`). Server-side validation only for cross-document rules post-generation.

### Anti-Pattern 5: Flat Firestore Document for Entire Project
**What:** Storing all project data in a single Firestore document.
**Why bad:** Firestore document max size is 1MB. A fully generated project with budget breakdowns, shooting schedules, and contract text will exceed this. Also, every read/write touches the entire project.
**Instead:** Use subcollections: `metadata`, `screenplay`, `team/{id}`, `financials`, `generated/{docId}`, `validation`, `documents/{docId}`.

## Firestore Data Model

```
projects/
  {projectId}/
    metadata: {                    // Screen 1 data
      titulo_proyecto: string,
      categoria_cinematografica: "Ficcion" | "Documental" | "Animacion",
      categoria_director: "Opera Prima" | "Segundo+",
      duracion_estimada: number,
      formato_filmacion: string,
      relacion_aspecto: string,
      idiomas: string[],
      costo_total_mxn: number,
      monto_eficine_mxn: number,
      erpi: { razon_social, rfc, representante_legal, domicilio_fiscal },
      periodo_registro: "2026-P1" | "2026-P2",
      createdAt: Timestamp,
      updatedAt: Timestamp,
      screenplay_status: "pending" | "uploading" | "parsing" | "parsed" | "error",
      pipeline_status: "idle" | "running" | "complete" | "error"
    }

    screenplay: {                  // Parsed screenplay data (from Pass 1)
      raw_text_hash: string,       // To detect re-uploads
      num_paginas: number,
      num_escenas: number,
      escenas: [{numero, int_ext, dia_noche, locacion, personajes, paginas, complejidad}],
      locaciones: [{nombre, tipo, frecuencia}],
      personajes: [{nombre, num_escenas, es_protagonista}],
      complejidad: {stunts, vfx, agua, animales, ninos, noche_pct, ...},
      dias_rodaje_estimados: number,
      parsedAt: Timestamp
    }

    team/
      {memberId}: {                // One per creative team member
        nombre_completo: string,
        cargo: string,
        nacionalidad: string,
        filmografia: [{titulo, anio, cargo_en_obra, formato, exhibicion}],
        formacion: string,
        premios: string[],
        enlaces: string[],
        honorarios_mxn: number,
        aportacion_especie_mxn: number
      }

    financials: {                  // Screen 4 data
      aportacion_erpi_efectivo: number,
      aportacion_erpi_especie: number,
      terceros: [{nombre, tipo, monto, efectivo_especie}],
      monto_eficine: number,
      total_calculado: number,
      pct_erpi: number,
      pct_eficine: number,
      pct_federal_total: number,
      gestor: {nombre, monto}
    }

    documents/
      {docId}: {                   // User-uploaded documents (Screen 5)
        tipo: string,              // "acta_constitutiva", "indautor", "seguro", etc.
        filename: string,
        storagePath: string,
        uploadedAt: Timestamp,
        fechaEmision: Timestamp,   // For date compliance validation
        status: "uploaded" | "verified" | "expired"
      }

    generated/
      {docId}: {                   // AI-generated documents
        docId: string,             // "a7_propuesta_produccion", "a9_presupuesto_resumen", etc.
        pass: number,              // Which pipeline pass generated this (1-6)
        content: object,           // Structured content (varies per document type)
        textContent: string,       // Plain text version for documents that are prose
        generatedAt: Timestamp,
        stale: boolean,
        staleReason: string | null,
        promptVersion: string,     // Hash of prompt template used
        modelVersion: string       // Claude model version used
      }

    validation: {                  // Validation engine results
      lastRunAt: Timestamp,
      overallStatus: "pass" | "has_blockers" | "has_warnings",
      scoreEstimate: number,
      rules: {
        [ruleId]: {
          status: "pass" | "fail" | "warning" | "not_applicable",
          severity: "blocker" | "warning",
          message: string,
          affectedDocs: string[],
          details: object
        }
      },
      completeness: {
        [sectionId]: {
          [docId]: "complete" | "generated" | "uploaded" | "missing" | "stale"
        }
      }
    }

    pipeline: {                    // Generation pipeline state
      status: "idle" | "running" | "complete" | "error",
      currentPass: number,
      currentDoc: string,
      progress: { [docId]: "pending" | "running" | "complete" | "error" },
      errors: [{docId, error, timestamp}],
      startedAt: Timestamp,
      completedAt: Timestamp
    }
```

## Suggested Build Order

The build order is dictated by **data dependencies**: each component needs the previous component's outputs to function.

### Phase 1: Scaffold + Data Model + Intake Wizard
**Builds:** React project, Firebase config, Firestore schema, 5-screen intake wizard, basic routing.
**Rationale:** Everything depends on the data model. The wizard is the entry point for all data. Without persisted project data, no other component can function.
**Dependencies:** None (this is the foundation).
**Deliverable:** User can create a project, fill all 5 screens, data persists in Firestore.

### Phase 2: Screenplay Parser
**Builds:** PDF upload to Storage, Cloud Function for PDF text extraction + Claude analysis, parsed data stored in Firestore.
**Rationale:** The screenplay analysis is the foundation for ALL AI generation (Passes 2-5 depend on Pass 1). Building this second validates the Cloud Functions + Claude API integration pattern that the rest of the pipeline will use.
**Dependencies:** Phase 1 (needs projectId and Storage bucket).
**Deliverable:** User uploads a screenplay PDF, system extracts structured data, user can review/confirm breakdown.

### Phase 3: AI Document Generation Pipeline
**Builds:** Pipeline orchestrator Cloud Function, all 6 passes of document generation, prompt template loading + variable substitution, pipeline progress tracking.
**Rationale:** This is the core value of the application. It must come before validation (which validates generated docs) and before export (which packages generated docs).
**Dependencies:** Phase 1 (project data) + Phase 2 (screenplay analysis).
**Deliverable:** User clicks "Generate", pipeline runs all passes, generated documents appear in Firestore, progress visible in UI.

### Phase 4: Validation Engine
**Builds:** All 13 validation rules, client-side validators for intake forms, server-side validators for post-generation, traffic-light dashboard, score estimate.
**Rationale:** Validation needs both user data (from Phase 1) AND generated documents (from Phase 3) to run the full rule set. Building it after generation means you can test against real outputs.
**Dependencies:** Phase 1 (user data) + Phase 3 (generated documents).
**Deliverable:** Dashboard shows per-rule and per-document status. User sees what's blocking export and what's still needed.

### Phase 5: Export Manager
**Builds:** PDF generation from structured content, file naming sanitization, folder structure assembly, ZIP compilation, download flow.
**Rationale:** This is the final step. It needs everything upstream to be working: project data, generated docs, uploaded docs, validation status.
**Dependencies:** All prior phases.
**Deliverable:** User clicks "Export", gets a downloadable ZIP with the complete carpeta organized per EFICINE conventions.

### Build Order Dependency Graph

```
Phase 1 (Scaffold + Data Model + Intake)
    |
    v
Phase 2 (Screenplay Parser)
    |
    v
Phase 3 (AI Generation Pipeline)  <-- MOST COMPLEX, highest risk
    |
    v
Phase 4 (Validation Engine)
    |
    v
Phase 5 (Export Manager)
```

**Note:** Phases 1 and 2 could partially overlap (Storage upload in Phase 1, parsing logic in Phase 2). Phases 4 and 5 could also partially overlap since client-side validation (intake form validators) could be built during Phase 3 while generation is being developed.

## Scalability Considerations

| Concern | At 1 project | At 3 projects (target) | At 10+ projects |
|---------|-------------|----------------------|-----------------|
| Firestore reads | Negligible | Negligible | Still negligible -- each project is isolated |
| Claude API cost | ~$5-15 per full pipeline run | ~$15-45 per period | Consider caching unchanged passes |
| Cloud Function duration | 5-15 min total pipeline | Same, runs per project | Concurrent execution, no issue |
| Storage | ~100MB per project (PDFs) | ~300MB | Free tier covers this |
| PDF generation | Seconds | Seconds per project | Not a concern |

This is a single-user internal tool for up to 3 projects per EFICINE period. Scalability is not a concern. Optimize for **developer velocity and correctness**, not throughput.

## Technology Choices for Architecture

| Layer | Technology | Why |
|-------|-----------|-----|
| State management | React Context + Firestore listeners | No Redux needed for a wizard app. Firestore `onSnapshot` IS the real-time state layer. |
| Form handling | react-hook-form + Zod | Schema-driven validation matching `schemas/*.json`. Best DX for multi-step forms. |
| PDF text extraction | pdf-parse (Cloud Function) | Lightweight, works server-side, handles screenplay PDFs well. |
| PDF generation | @react-pdf/renderer (Cloud Function) | React-based API for generating formatted PDFs from structured data. Familiar mental model. |
| ZIP packaging | archiver (Cloud Function) | Standard Node.js ZIP library. Mature, reliable. |
| AI integration | Anthropic SDK (@anthropic-ai/sdk) | Official SDK, used in Cloud Functions only. |
| Routing | React Router v7 | Standard. Wizard steps as routes for back/forward navigation and deep linking. |
| UI components | shadcn/ui + Tailwind | Already decided. Good component library for form-heavy apps. |

## Sources

- Project specification: `directives/app_spec.md`
- Data model schemas: `schemas/modulo_a.json` through `schemas/modulo_e.json`
- AI prompt execution order: `prompts/README.md`
- Validation rules: `references/validation_rules.md`
- Project context: `.planning/PROJECT.md`
- Confidence: HIGH -- all findings are from first-party project documentation. Architecture patterns are based on standard React + Firebase patterns verified against project requirements.
