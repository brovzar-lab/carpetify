# Phase 5: Export Manager - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

PDF generation from Firestore data, IMCINE file naming sanitization, pre-export language check (anglicisms, format consistency, title identity), ZIP compilation with organized folder structure, export gating via Phase 4 validation, and internal reference documents (validation report, score estimate, upload guide). Produces a ready-to-upload package for the SHCP portal.

</domain>

<decisions>
## Implementation Decisions

### PDF Generation
- **D-01:** Utilitarian/clean PDF styling — simple typography, no branding, no decorative elements. IMCINE explicitly recommends "sin portadas decorativas." Content sells the project, not PDF design.
- **D-02:** Proper tables with borders, alternating row colors, and clear column headers for table-heavy documents (presupuesto A9a/A9b, flujo de efectivo A9d, ficha técnica C4). Evaluators cross-reference accounts across documents — visual table structure makes their job easier and scores higher on "claridad."
- **D-03:** Standard Mexican legal document format for contracts (B3, C2b) — numbered clauses, formal headings, highlighted fee amount in a yellow colored box as IMCINE suggests ("se sugiere resaltar en un recuadro de color"). Yellow is standard in Mexican legal practice, reads well in print and screen. No user color choice.
- **D-04:** User-uploaded documents are renamed to IMCINE convention + validated (file size ≤40MB + valid PDF check) before including in the ZIP. Original content untouched. Catches oversized scans and invalid files before submission-night.

### Pre-Export Language Check (LANG-05)
- **D-05:** Dedicated AI pass focused on three things: (1) scanning generated prose for anglicisms that slipped through Claude's generation, (2) verifying all amounts follow `$X,XXX,XXX MXN` format consistently, (3) confirming dates are in Spanish format throughout. This is linguistic QA on actual text, not a duplicate of Phase 4 data validation.
- **D-06:** Runs automatically as part of the export process, before PDF generation. Producer clicks "Exportar carpeta" → language check runs first → findings surface → producer fixes or dismisses → PDFs generate.
- **D-07:** Findings presented as an inline checklist between clicking "Export" and generating PDFs: "✓ Sin anglicismos detectados", "⚠ 2 formatos de montos inconsistentes en Presupuesto Desglose", "✓ Título idéntico en 18/18 documentos". Warnings are dismissable. Blockers (title mismatch) are not dismissable.
- **D-08:** Two-tier anglicism severity: **flagged** (likely problematic — "shooting", "cast", "performance" — yellow warning with suggested replacement) and **noted** (industry-accepted terms — "catering", "DCP", "storyboard" — gray info indicator "Término técnico aceptado"). Prevents false positives from making the producer ignore real issues.

### Export Extras
- **D-09:** Concise one-page validation summary PDF — blockers resolved (✓), active warnings with recommendations, document completeness checklist (18/18 generados, 12/12 subidos), financial reconciliation confirmation ("Presupuesto = Flujo = Esquema: $XX,XXX,XXX MXN ✓"). Producer prints this as a confidence checklist while uploading to the SHCP portal.
- **D-10:** Full score breakdown as a separate PDF — 5-persona artistic scores, viability scores, bonus detection, top improvement suggestions. Marked clearly: "DOCUMENTO INTERNO — NO INCLUIR EN LA CARPETA EFICINE." Producer can share with director or co-producer for a final gut check before submitting.
- **D-11:** Step-by-step submission upload guide PDF mapping each file to its SHCP portal field: "Paso 1: Sube A1_RE_UNL.pdf en el campo 'Resumen ejecutivo (FORMATO 1)'" for all ~30 slots. Eliminates the "which file goes where?" panic at 11pm on deadline day. Include portal field descriptions since the producer uses it once a year.
- **D-12:** Internal documents in a separate `_INTERNO/` folder at the ZIP root. Full structure: `carpeta_PROYECTO/00_ERPI/`, `A_PROPUESTA/`, `B_PERSONAL/`, `C_ERPI/`, `D_COTIZ/`, `E_FINANZAS/`, `_INTERNO/validacion.pdf`, `_INTERNO/estimacion_puntaje.pdf`, `_INTERNO/guia_carga.pdf`. Underscore prefix sorts last. Everything outside `_INTERNO/` goes to IMCINE, everything inside is producer-only.

### Export UX & Download Flow
- **D-13:** Prominent "Exportar carpeta" button on the validation dashboard with state reflecting readiness: disabled + red when blockers exist ("3 bloqueadores impiden la exportación"), enabled + yellow when only warnings remain ("2 advertencias — exportar de todos modos"), enabled + green when clean ("Carpeta lista para exportar").
- **D-14:** If producer clicks export with blockers, show a modal listing every blocker with "Ir al campo" links — not just "you have blockers." Last safety net with the same fix-path navigation from Phase 4. Once all blockers are fixed, button enables.
- **D-15:** Step-by-step progress view showing each stage with real progress: "Verificación de idioma... ✓" → "Generando PDFs... (12/20)" → "Compilando ZIP..." → "Listo — Descargar". Unlike Phase 3 generation (single API call, no intermediate state), the export process has genuinely distinct measurable stages.
- **D-16:** Auto-download the ZIP when compilation completes + persistent "Descargar de nuevo" link on the dashboard. ZIP downloads automatically — no extra click after watching 20 PDFs generate. Link stays indefinitely for re-downloads. Shows filename and size: "carpeta_UNLOVED_2026-03-23.zip (28.4 MB) — Descargar de nuevo". Filename includes project abbreviation + export date.

### Claude's Discretion
- PDF generation library choice (@react-pdf/renderer vs jsPDF vs Puppeteer)
- PDF template design for each document type (prose, table, legal, mixed)
- How to implement the yellow fee highlight box in PDF rendering
- ZIP compilation approach (client-side vs Cloud Function)
- Language check prompt engineering (anglicism dictionary, format regex patterns)
- Upload guide content (SHCP portal field mapping — may need manual research)
- How to handle very large ZIPs (many uploaded documents could approach browser download limits)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Export rules (primary reference)
- `schemas/export_manager.json` — File naming rules (`{SECCION}{NUM}_{ABREV}_{PROY}`, max 15 chars, ASCII), folder structure, file size limits (40MB), compilation checklist, modality routing, "sin portadas decorativas" requirement

### Language policy
- `directives/politica_idioma.md` — Protected terminology, anglicism rules, amount/date formatting standards. LANG-05 language check scans against these rules.

### Validation rules
- `references/validation_rules.md` — Rule 9 (file format compliance) directly affects export. All blocker rules gate the export.

### Application architecture
- `directives/app_spec.md` §"Output Package, File Naming Convention" — IMCINE folder structure and naming examples

### Prior phase decisions
- `.planning/phases/01-scaffold-intake-wizard/01-CONTEXT.md` — D-04: project cards show readiness score. INTK-02: target period selection drives document expiration dates.
- `.planning/phases/03-ai-doc-generation/03-CONTEXT.md` — D-05/D-06: document viewer with read-only preview + edit mode. D-07: propuesta dirección exported as Word (re-uploaded as completed PDF for export). D-08: docs organized by EFICINE section.
- `.planning/phases/04-validation-dashboard/04-CONTEXT.md` — D-01/D-02: validation dashboard layout. D-03: "Ir al campo" navigation (reused in export blocker modal). D-05-D-10: score estimation with 5 personas (exported as internal PDF). D-15-D-18: document expiration alerts (strict blockers at export).

### Research
- `.planning/research/STACK.md` — Technology choices, library versions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 4 validation engine provides the blocker/warning status that gates export
- Phase 4 score estimation (5 personas + viability) provides data for the internal score PDF
- Phase 3 document storage in `generated/{docId}` — export reads these to generate PDFs
- Phase 1 uploaded documents in Firebase Storage — export copies these to the ZIP
- "Ir al campo" navigation pattern from Phase 4 (D-03) — reused in the export blocker modal

### Established Patterns
- EFICINE section organization (A-E) from Phase 3 D-08 — maps directly to export folder structure
- Traffic light status indicators — reused for export button state (red/yellow/green)
- Real-time Firestore listeners — export button state updates as blockers are resolved
- Cloud Function pattern from Phase 2 — may extend for server-side PDF generation or ZIP compilation

### Integration Points
- Phase 4 validation results → export gating (blockers block, warnings flag)
- Phase 4 document expiration → strict blockers at export time (D-17)
- Phase 3 generated documents (Firestore) → PDF rendering input
- Phase 1 uploaded documents (Firebase Storage) → copied to ZIP with renamed filenames
- Phase 3 structured budget data → feeds financial reconciliation confirmation in validation report
- SHCP portal field mapping → drives the submission upload guide content
- Export date + project abbreviation → drives ZIP filename

</code_context>

<specifics>
## Specific Ideas

- The submission upload guide is the unsung hero of this phase. The SHCP portal is a confusing government website the producer uses once or twice a year. A step-by-step "upload file X to field Y" guide eliminates the single most stressful moment in the entire EFICINE process — the actual submission.
- The yellow highlighted fee box in contracts is not optional in practice. Every winning EFICINE project highlights the fee amount. IMCINE evaluators look for it when cross-checking fees against the budget. Missing it signals "this producer hasn't done this before."
- The `_INTERNO/` folder separation is critical. A panicked producer at midnight might accidentally upload the score estimate to IMCINE. Clear separation prevents this.
- The export button's three-state design (red/yellow/green) gives the producer a single glance summary of their entire project's readiness without opening the dashboard.

</specifics>

<deferred>
## Deferred Ideas

- SHCP portal screenshots in the upload guide — requires manual research and portal access, may change between periods. Text descriptions for v1, screenshots for v2 if portal is stable.
- Direct SHCP portal integration — out of scope (no API, scraping is legally risky per REQUIREMENTS.md)
- Multi-format export (Word + PDF) for documents that need external signatures — v2 if producers request it
- Export history/versioning — track which version was exported when, for audit trail. v2 feature.

</deferred>

---

*Phase: 05-export-manager*
*Context gathered: 2026-03-23*
