# Roadmap: Carpetify

## Overview

Carpetify transforms a screenplay and project metadata into a complete EFICINE Article 189 submission dossier. The build follows a strict data-dependency chain: intake data feeds the screenplay parser, parsed data feeds AI generation, generated documents feed validation, and validated documents feed export. Each phase delivers a complete, verifiable capability that the next phase consumes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold + Intake Wizard** - React/Firebase project with 5-screen Spanish intake wizard and multi-project support (completed 2026-03-22)
- [x] **Phase 2: Screenplay Processing** - PDF upload, text extraction, Claude analysis, and manual correction UI (completed 2026-03-23)
- [x] **Phase 3: AI Document Generation Pipeline** - 4-pass document generation with prompt injection, staleness tracking, and one-click regeneration (completed 2026-03-24)
- [x] **Phase 4: Validation Engine + Dashboard** - 17 compliance rules, traffic light dashboard, score estimation, and real-time validation (completed 2026-03-24)
- [x] **Phase 5: Export Manager** - PDF generation, IMCINE naming, pre-export language check, ZIP packaging (completed 2026-03-24)
- [x] **Phase 6: Validation Data Wiring Fix** - Fix Firestore path mismatches in useValidation, implement fee cross-match extractors, add ERPI submission tracking, regional bonus fields, and date format fix (completed 2026-03-25)
- [ ] **Phase 7: Document Completeness & Export Gate Fix** - Align REQUIRED_DOCUMENTS namespace with DocumentChecklist tipo values, wire hasExclusiveContribution from financial data
- [ ] **Phase 8: Score Estimation & Accuracy Fix** - Fix scoring role name mismatch, populate scoring signals, wire artistic score Cloud Function trigger
- [ ] **Phase 9: Validation Stub Completion** - Populate outputFiles for VALD-09 file format pre-validation, wire extractLinks for VALD-12 hyperlink accessibility

## Phase Details

### Phase 1: Scaffold + Intake Wizard
**Goal**: User can create and manage EFICINE projects, enter all required data through a guided Spanish-language wizard, and upload supporting documents
**Depends on**: Nothing (first phase)
**Requirements**: INTK-01, INTK-02, INTK-03, INTK-04, INTK-05, INTK-06, INTK-07, INTK-08, INTK-09, INTK-10, INTK-11, LANG-02, LANG-03
**Success Criteria** (what must be TRUE):
  1. User can create a new project, fill in all metadata fields, and see the data persisted across browser refreshes
  2. User can switch between up to 3 projects with fully isolated data per project
  3. User can upload a screenplay PDF and see a parsed breakdown (scenes, locations, characters, INT/EXT/DAY/NIGHT) with the ability to correct inaccuracies
  4. User can navigate all 5 wizard screens (project setup, screenplay, creative team, financials, document uploads) entirely in Mexican Spanish with no English visible
  5. All monetary amounts display as $X,XXX,XXX MXN and all dates display in Spanish format throughout the intake UI
**Plans:** 4/4 plans complete

Plans:
- [x] 01-01-PLAN.md — Scaffold Vite + React project with all dependencies, Zod schemas, format utilities, locale constants, services, hooks, and tests
- [x] 01-02-PLAN.md — Dashboard with period-grouped project cards, CRUD operations, and ERPI shared settings page
- [x] 01-03-PLAN.md — Wizard shell with sidebar, Screen 1 (Datos del Proyecto), and Screen 3 (Equipo Creativo)
- [x] 01-04-PLAN.md — Wizard Screen 2 (Guion), Screen 4 (Estructura Financiera + compliance panel), Screen 5 (Documentos), and end-to-end verification

### Phase 2: Screenplay Processing
**Goal**: App can extract structured data from a screenplay PDF and produce a Claude-powered analysis that downstream generation passes consume
**Depends on**: Phase 1
**Requirements**: SCRN-01, SCRN-02, SCRN-03, SCRN-04
**Success Criteria** (what must be TRUE):
  1. User uploads a screenplay PDF and the app extracts text preserving scene headers, character names, and dialogue structure
  2. App displays parsed scene count, page count, locations, characters, and INT/EXT/DAY/NIGHT breakdown from the extracted text
  3. App sends parsed data to Claude API via Cloud Function using the Spanish prompt from prompts/analisis_guion.md and stores structured analysis results in Firestore
  4. Screenplay analysis data is accessible as structured Firestore data (not PDF) for downstream generation passes to consume
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Cloud Functions scaffold, PDF text extraction with pdf-parse, screenplay structure parser with regex, and extractScreenplay callable Cloud Function
- [x] 02-02-PLAN.md — Claude analysis Cloud Function with prompt injection from prompts/analisis_guion.md, response validation, Firestore storage, and frontend integration with analysis CTA, results display, and error/stale states

### Phase 3: AI Document Generation Pipeline
**Goal**: App generates all ~20 AI-produced documents across 4 sequential passes, with deterministic financial injection, staleness tracking, and one-click regeneration
**Depends on**: Phase 2
**Requirements**: AIGEN-01, AIGEN-02, AIGEN-03, AIGEN-04, AIGEN-05, AIGEN-06, AIGEN-07, AIGEN-08, AIGEN-09, AIGEN-10, AIGEN-11, LANG-01, LANG-04
**Success Criteria** (what must be TRUE):
  1. User can trigger the generation pipeline and see all ~20 documents produced across 4 passes (Line Producer, Finance Advisor, Legal, Combined) with real-time progress
  2. All generated documents are in Mexican Spanish using EFICINE terminology, with monetary values injected deterministically from computed data (AI never invents financial figures)
  3. User can view any generated document in the UI and see structured content stored in Firestore
  4. When user changes upstream data (intake fields, screenplay reparse), affected downstream documents are marked as stale and user can trigger one-click regeneration
  5. Budget uses IMCINE standard account structure (100-1200) with Mexican market crew rates
**Plans:** 6/6 plans complete

Plans:
- [x] 03-01-PLAN.md — Foundation: shared types, Handlebars prompt loader, financial computation (budget, cash flow, esquema financiero), Claude client, staleness tracker
- [x] 03-02-PLAN.md — Cloud Functions for Line Producer pass (A7, A8a, A8b, A9a, A9b) and Finance Advisor pass (A9d, E1, E2)
- [x] 03-03-PLAN.md — Cloud Functions for Legal pass (B3-prod, B3-dir, C2b, C3a, C3b) and Combined pass (A1, A2, A4, A6, A10, A11, C4, PITCH)
- [x] 03-04-PLAN.md — Frontend generation screen route, document list by EFICINE section, pipeline control with streaming progress
- [x] 03-05-PLAN.md — Document viewer with edit mode, staleness detection UI with cascade, pass-level regeneration controls
- [x] 03-06-PLAN.md — Budget editor (IMCINE 100-1200 account structure), downstream warnings, A4 Word export, end-to-end verification

### Phase 4: Validation Engine + Dashboard
**Goal**: App validates all project data and generated documents against EFICINE rules, displays compliance status on a traffic light dashboard, and estimates the project's competition score
**Depends on**: Phase 3
**Requirements**: VALD-01, VALD-02, VALD-03, VALD-04, VALD-05, VALD-06, VALD-07, VALD-08, VALD-09, VALD-10, VALD-11, VALD-12, VALD-13, VALD-14, VALD-15, VALD-16, VALD-17
**Success Criteria** (what must be TRUE):
  1. Traffic light dashboard shows per-document and per-rule status (green/yellow/red) as the primary navigation surface, updating in real time as data changes
  2. All blocker validations fire correctly: financial reconciliation (budget = cash flow = esquema), title consistency, fee cross-matching, EFICINE percentage rules, document completeness, experience thresholds, ERPI eligibility, file format compliance, and prohibited expenditure scanning
  3. Warning-level validations fire correctly: ruta critica/cash flow sync, hyperlink accessibility, bonus points eligibility, and document expiration alerts with days remaining
  4. User sees a score estimate against the EFICINE rubric (100 pts + 5 bonus) with actionable improvement suggestions
  5. Validation runs in real time as data is entered in the intake wizard, not just at export time
**Plans:** 8/8 plans complete

Plans:
- [x] 04-01-PLAN.md — Validation types, constants, and 10 blocker rule functions with TDD test suite
- [x] 04-02-PLAN.md — 4 warning rule functions (ruta critica sync, hyperlink accessibility, bonus eligibility, document expiration)
- [x] 04-03-PLAN.md — Viability scoring module (deterministic, 38 pts), AI persona scoring Cloud Function (5 evaluators, 62 pts), persona prompt files, and locales
- [x] 04-04-PLAN.md — Validation engine orchestrator with D-11 tiered timing (instant 12 rules + medium 2 rules)
- [x] 04-05-PLAN.md — useValidation hook with tiered execution and Firestore financial wiring, wizard sidebar/route integration
- [x] 04-06-PLAN.md — Validation dashboard UI (two-panel layout, severity-grouped rules, score estimation panel with httpsCallable)
- [x] 04-07-PLAN.md — Integration touchpoints: project card validation badges, document expiration alerts (3 touchpoints), hyperlink verifier, "Ir al campo" field navigation, and visual verification checkpoint
- [x] 04-08-PLAN.md — Gap closure: sidebar traffic light wiring, VALD-13 bonus input from team data, VALD-11 document content extractors

### Phase 5: Export Manager
**Goal**: User can export a complete, validated carpeta as a ZIP package ready for upload to the SHCP portal
**Depends on**: Phase 4
**Requirements**: EXPRT-01, EXPRT-02, EXPRT-03, EXPRT-04, EXPRT-05, LANG-05
**Success Criteria** (what must be TRUE):
  1. App generates PDFs from stored document data with filenames following IMCINE convention (max 15 chars, ASCII only, no accents/symbols)
  2. User downloads a ZIP with organized folder structure (00_ERPI/, A_PROPUESTA/, B_PERSONAL/, C_ERPI/, D_COTIZ/, E_FINANZAS/) containing all generated and uploaded documents
  3. Export includes a validation report, score estimate, and submission upload guide
  4. Export is blocked when any blocker validation fails; warnings are flagged but do not prevent export
  5. Pre-export language check scans for anglicisms, verifies format consistency, and confirms title identity across all documents
**Plans:** 3/3 plans complete

Plans:
- [x] 05-01-PLAN.md — Export foundation: dependencies, NotoSans fonts, file naming registry (EXPORT_FILE_MAP), folder structure constants, language check utility (LANG-05), PDF font registration and shared stylesheet
- [x] 05-02-PLAN.md — 15 PDF template components (12 document templates + 3 meta-document templates) and pdfRenderer routing module for FORMATO-compliant PDF generation
- [x] 05-03-PLAN.md — Export pipeline UI: wizard integration, export screen with readiness card, language check results, progress view, ZIP compilation, auto-download, blocker modal, and end-to-end verification

### Phase 6: Validation Data Wiring Fix
**Goal**: All 14 validation rules receive correct data from Firestore, enabling accurate compliance gating, traffic light status, and export blocking
**Depends on**: Phase 4, Phase 5
**Requirements**: VALD-01, VALD-02, VALD-03, VALD-04, VALD-05, VALD-07, VALD-08, VALD-13, VALD-14, VALD-16, LANG-03
**Gap Closure**: Closes gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):
  1. useValidation reads project metadata from correct Firestore path (metadata.* subpath, not document root)
  2. useValidation subscribes to projects/{id}/financials/data for EFICINE financial fields
  3. ERPI subscription uses correct collection path (erpi_settings/default, not erpiSettings/default)
  4. Fee cross-match extracts actual fee amounts from contracts, budget, and cash flow documents
  5. ERPI submission/attempt counts are tracked and enforced (not hardcoded to 0)
  6. Regional bonus fields read from project data (not always false)
  7. DocumentChecklist uses formatDateES instead of toLocaleDateString
  8. Traffic light sidebar reflects real validation state (not false-green on empty data)
  9. canExport correctly blocks when EFICINE rules fail
**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Fix Firestore path wiring: metadata subpath, financials subscription, ERPI snake_case path, DocumentUpload periodo fix, VALD-04 date mapping
- [x] 06-02-PLAN.md — Fee cross-match extractors from budget_output, ERPI submission tracking schema/UI, regional bonus schema fields and UI inputs
- [x] 06-03-PLAN.md — Per-screen traffic light derivation from validation results, regional bonus engine wiring, full verification

### Phase 7: Document Completeness & Export Gate Fix
**Goal**: VALD-06 document completeness check correctly identifies uploaded documents, and export is no longer permanently blocked by false missing-document errors
**Depends on**: Phase 6
**Requirements**: VALD-06
**Gap Closure**: Closes critical gap from v1.0 milestone audit — production blocker
**Success Criteria** (what must be TRUE):
  1. REQUIRED_DOCUMENTS keys match the tipo values used by DocumentChecklist and storage.ts
  2. Uploaded documents (cv_productor, cotizacion_seguro, etc.) are correctly recognized as present by VALD-06
  3. hasExclusiveContribution is derived from financial data instead of hardcoded false
  4. Export proceeds when all required documents are genuinely uploaded (no false blockers)
  5. Traffic lights no longer show false-red on datos/documentos screens due to namespace mismatch
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — Align REQUIRED_DOCUMENTS keys with DocumentChecklist tipo values, add missing required upload entries, wire hasExclusiveContribution from ERPI in-kind data, update tests
- [x] 07-02-PLAN.md — Gap closure: add cv_productor upload entry to DocumentChecklist REQUIRED_UPLOADS, verify complete namespace alignment

### Phase 8: Score Estimation & Accuracy Fix
**Goal**: Viability scoring produces accurate results using correct role matching and populated scoring signals, and artistic score estimation is accessible from the UI
**Depends on**: Phase 7
**Requirements**: VALD-15
**Gap Closure**: Closes medium-priority gap from v1.0 milestone audit
**Success Criteria** (what must be TRUE):
  1. findTeamByRole matches 'Productor' and 'Director' (not 'Productor/a' and 'Director/a')
  2. Scoring signals (screenplayPagesPerDay, budgetHasImprevistos, exhibitionHasSpectatorEstimate, etc.) populated in useValidation snapshot
  3. ScoreEstimationPanel triggers the estimateScore Cloud Function for artistic scoring
  4. Dashboard ProjectCard shows completion/readiness percentage instead of hardcoded 0%
**Plans:** 2 plans

Plans:
- [ ] 08-01-PLAN.md — Fix role name mismatch in scoring.ts (Productor/Director not Productor/a/Director/a), update test fixtures, populate all scoring signals in useValidation.ts from Firestore subscriptions
- [ ] 08-02-PLAN.md — Fix estimateScore Cloud Function to self-read A3/A4/A5 content from Firestore, replace hardcoded 0% in ProjectCard with validation pass rate, fix hardcoded Spanish string in ScoreEstimationPanel

### Phase 9: Validation Stub Completion
**Goal**: VALD-09 file format compliance and VALD-12 hyperlink accessibility rules produce real results instead of permanently skipping
**Depends on**: Phase 7
**Requirements**: VALD-09, VALD-12
**Gap Closure**: Closes low-priority gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):
  1. outputFiles populated in useValidation snapshot from rendered PDF metadata
  2. VALD-09 validates filenames (≤15 chars, ASCII) and sizes (≤40MB) against IMCINE rules
  3. extractLinks() extracts team member portfolio URLs and document URLs
  4. VALD-12 checks extracted links for accessibility (warning, not blocker)
**Plans:** TBD

Plans:
- [ ] 09-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + Intake Wizard | 4/4 | Complete | 2026-03-22 |
| 2. Screenplay Processing | 2/2 | Complete | 2026-03-23 |
| 3. AI Document Generation Pipeline | 6/6 | Complete | 2026-03-24 |
| 4. Validation Engine + Dashboard | 8/8 | Complete | 2026-03-24 |
| 5. Export Manager | 3/3 | Complete | 2026-03-24 |
| 6. Validation Data Wiring Fix | 3/3 | Complete | 2026-03-25 |
| 7. Document Completeness & Export Gate Fix | 2/2 | Complete | 2026-03-25 |
| 8. Score Estimation & Accuracy Fix | 0/2 | Not started | - |
| 9. Validation Stub Completion | 0/TBD | Not started | - |
