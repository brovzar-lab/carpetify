# Phase 3: AI Document Generation Pipeline - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

4-pass document generation pipeline (Line Producer → Finance → Legal → Combined) plus cross-validation, producing ~20 AI-generated documents. Includes pipeline orchestration, document viewer with editing, staleness tracking with cascade, one-click regeneration, and a structured budget editor. Deterministic financial injection ensures monetary values flow from structured data, not AI re-invention. Phase 2 provides the screenplay analysis input. Phase 4 handles validation rules.

</domain>

<decisions>
## Implementation Decisions

### Pipeline Orchestration
- **D-01:** One "Generar carpeta" button triggers the full pipeline (Passes 2-6). User can also re-run individual passes later after reviewing output. Both modes are necessary.
- **D-02:** Document list updates in real time — each document switches from "pendiente" → "generando..." → "listo" as it completes. This doubles as the document management view.
- **D-03:** Mid-pipeline failure preserves all successfully generated docs. Pipeline marked as incomplete with "Continuar desde Paso X" button. Never roll back successful work. Never force re-running passes that cost API money.
- **D-04:** Parallel generation within a pass with concurrency limit of 3 simultaneous Claude API calls. Independent docs within a pass run in parallel for speed, but capped to avoid Anthropic rate limits and Cloud Function cost spikes.

### Document Viewer & Editing
- **D-05:** Read-only preview with explicit "Editar" button that switches to editing mode. No accidental edits on legal/financial documents. Clean reading experience for review.
- **D-06:** Full text editing in edit mode with overwrite warning: "Las ediciones manuales se perderán si regeneras este documento." Visual badge/icon on any document with manual edits so user knows before hitting regenerate.
- **D-07:** Propuesta de dirección (A4) is exported as a Word doc for the director to fill externally. The director is not a Carpetify user. Export template → director fills it → re-upload completed file. No special in-app UI for director input.
- **D-08:** Documents organized by EFICINE section (Sección A, B, C, D, E) — not by generation pass. The producer thinks in IMCINE's structure, not the app's internal pipeline order.

### Staleness Tracking & Regeneration
- **D-09:** Staleness tracked per-pass with downstream cascade. If Pass 2 goes stale, Passes 3, 4, and 5 are automatically marked stale too. This matches the actual data dependency chain. Per-document tracking is a v2 optimization.
- **D-10:** Immediate staleness detection — when the user edits an upstream field, the document list instantly shows which passes are stale. Compare timestamps: `intake_updated_at > pass_generated_at`. Consistent with the real-time compliance panel from Phase 1.
- **D-11:** Regeneration at the pass level only — all documents within a pass regenerate together. Documents within a pass share context and prompt inputs; regenerating one without the others creates internal inconsistency. One Cloud Function call per pass.
- **D-12:** Manually-edited documents show staleness with a warning: "Este documento tiene ediciones manuales que se perderán si regeneras." Explicit "Regenerar de todos modos" button required. Staleness is never hidden, even for edited docs. Diff preview deferred to v2.

### Financial Data Flow
- **D-13:** After Pass 2 (Line Producer) generates the budget, the app extracts key financial figures (account totals, crew fees, grand total) and stores them as structured data in Firestore. Downstream passes receive these as deterministic `{{variables}}`. Claude never reads financial numbers from a previous document — clean separation eliminates hallucination risk.
- **D-14:** Budget has its own structured spreadsheet-like editor — not free text. Line items with auto-calculated subtotals and grand total. The budget is a financial instrument, not a prose document. This is the one screen that needs a real spreadsheet UI for financial integrity.
- **D-15:** Producer, director, and screenwriter fees flow strictly from intake (Phase 1) as single source of truth. Pass 2 receives these as locked `{{variables}}`, never overrides them. If the budget shows a different fee than intake, it's a validation error, not a generation choice.
- **D-16:** When the user edits budget line items in the structured editor, totals auto-recalculate immediately AND the app shows a warning listing which downstream documents are now inconsistent: "Subtotal Cuenta 500 actualizado. Los siguientes documentos ahora son inconsistentes: Flujo de Efectivo, Esquema Financiero." User knows exactly what needs regeneration at the moment they make the edit.

### Claude's Discretion
- Cloud Function architecture for multi-pass orchestration (queue, event-driven, or sequential calls)
- Document storage format in Firestore `generated/{docId}` (markdown, structured JSON, or hybrid)
- How to extract structured financial figures from Claude's budget response (parsing strategy)
- Word export library choice for the propuesta de dirección template
- Exact UI for the structured budget editor (component choice, interaction patterns)
- Cross-validation pass (Pass 6) implementation — what it checks and how results are surfaced

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### AI generation prompts (ALL must be read)
- `prompts/README.md` — Execution order: 6 passes, dependency chain, variable convention
- `prompts/a7_propuesta_produccion.md` — Pass 2: propuesta de producción (12/100 pts)
- `prompts/a8_plan_rodaje_y_ruta_critica.md` — Pass 2: plan de rodaje + ruta crítica (10/100 pts)
- `prompts/a9_presupuesto.md` — Pass 2: budget with IMCINE account structure (100-1200), market rates, prohibited expenditures
- `prompts/documentos_financieros.md` — Pass 3: esquema financiero (FORMATO 9), flujo de efectivo (FORMATO 3), carta aportación (FORMATO 10)
- `prompts/documentos_legales.md` — Pass 4: contracts (B3), cesión derechos (C2b), cartas compromiso (FORMATOS 6, 7)
- `prompts/documentos_combinados.md` — Pass 5: resumen ejecutivo (FORMATO 1), sinopsis (A2), propuesta dirección template (A4), solidez equipo (FORMATO 2), propuesta exhibición (A10), ficha técnica (FORMATO 8), pitch contribuyentes
- `prompts/a1_resumen_ejecutivo.md` — Pass 5: FORMATO 1 structure
- `prompts/a2_sinopsis.md` — Pass 5: sinopsis (max 3 cuartillas, reveals ending)
- `prompts/a10_propuesta_exhibicion.md` — Pass 5: exhibition strategy with market data

### Scoring rubric
- `references/scoring_rubric.md` — EFICINE evaluation criteria: 62 pts artistic + 38 pts viability. Minimum 90/100 to pass. Budget alone is 10 pts.

### Data model & validation
- `schemas/modulo_a.json` — Section A fields (most generated docs)
- `schemas/modulo_b.json` — Section B fields (contracts)
- `schemas/modulo_c.json` — Section C fields (legal, ERPI)
- `schemas/modulo_e.json` — Section E fields (financial scheme)
- `references/validation_rules.md` — Cross-module rules, especially Rules 1-3 (financial reconciliation, title consistency, fee cross-matching)

### Language policy
- `directives/politica_idioma.md` — All generated documents in Mexican Spanish. LANG-01 and LANG-04 requirements.

### Prior phase decisions
- `.planning/phases/01-scaffold-intake-wizard/01-CONTEXT.md` — D-14 to D-22: financial input UX, compliance panel, in-kind contributions. Intake data is the source of truth for fees.
- `.planning/phases/02-screenplay-processing/02-CONTEXT.md` — D-09: analysis stored as single Firestore doc at `projects/{projectId}/screenplay/analysis`. D-11: `last_analyzed` timestamp for staleness.

### Research
- `.planning/research/STACK.md` — Technology choices
- `.planning/research/PITFALLS.md` — Cloud Functions timeout concerns (540s limit for v2)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 2 Cloud Function pattern: Secret Manager for API key, Sonnet model, auto-retry once, schema validation with `raw_response` backup. Extend this pattern for all generation passes.
- Firestore structure from Phase 1: `projects/{projectId}/generated/{docId}` subcollection for storing generated documents.
- Real-time compliance panel pattern from Phase 1 (D-14, D-17) — reuse for staleness detection UI.

### Established Patterns
- Schema field names in Spanish matching EFICINE terminology
- Auto-save with debounce to Firestore (Phase 1 D-03)
- Traffic light status indicators (Phase 1 D-02)
- Two separate Cloud Functions for independent operations (Phase 2 D-06)

### Integration Points
- Screenplay analysis at `projects/{projectId}/screenplay/analysis` feeds Pass 2 prompts (`{{analisis_guion_resumen}}`, `{{locaciones}}`, `{{complejidad}}`, etc.)
- Intake data from Phase 1 wizard feeds all passes — fees, team data, financial structure, project metadata
- ERPI shared data feeds legal docs — razón social, RFC, representante legal, domicilio
- Budget structured data (extracted post-Pass 2) feeds Passes 3-5 as `{{variables}}`
- `last_analyzed` and per-pass timestamps enable staleness cascade detection
- Generated docs feed Phase 4 (Validation Engine) and Phase 5 (Export Manager)

</code_context>

<specifics>
## Specific Ideas

- The budget is the financial spine of the entire carpeta. Every number in every downstream document traces back to a budget line item. The structured editor for the budget is the most critical UI in Phase 3 — it's the one place where the user directly manipulates financial data that cascades through 15+ other documents.
- "Claude never reads financial numbers from a previous document" is the cardinal rule. Structured Firestore data → `{{variable}}` injection → Claude generates prose around deterministic numbers. This eliminates the single biggest source of EFICINE rejections: mismatched amounts across documents.
- The producer's mental model is EFICINE sections (A, B, C, D, E), not the app's generation passes. The pass structure is an implementation detail.
- The propuesta de dirección is an external document — the director is never a Carpetify user. Export as Word, get it back as a completed upload.

</specifics>

<deferred>
## Deferred Ideas

- Diff preview for manually-edited documents before regeneration — v2 feature, expensive to build (requires generating new version, diffing, displaying)
- Per-document staleness tracking (vs per-pass) — v2 optimization if per-pass cascade is too aggressive in practice
- AI-powered pre-submission review simulating evaluator perspective (AIGEN-V2-01) — v2 requirement
- Document version comparison and diff view (AIGEN-V2-02) — v2 requirement

</deferred>

---

*Phase: 03-ai-doc-generation*
*Context gathered: 2026-03-22*
