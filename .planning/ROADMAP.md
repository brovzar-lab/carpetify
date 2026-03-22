# Roadmap: Carpetify

## Overview

Carpetify transforms a screenplay and project metadata into a complete EFICINE Article 189 submission dossier. The build follows a strict data-dependency chain: intake data feeds the screenplay parser, parsed data feeds AI generation, generated documents feed validation, and validated documents feed export. Each phase delivers a complete, verifiable capability that the next phase consumes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold + Intake Wizard** - React/Firebase project with 5-screen Spanish intake wizard and multi-project support (completed 2026-03-22)
- [ ] **Phase 2: Screenplay Processing** - PDF upload, text extraction, Claude analysis, and manual correction UI
- [ ] **Phase 3: AI Document Generation Pipeline** - 4-pass document generation with prompt injection, staleness tracking, and one-click regeneration
- [ ] **Phase 4: Validation Engine + Dashboard** - 17 compliance rules, traffic light dashboard, score estimation, and real-time validation
- [ ] **Phase 5: Export Manager** - PDF generation, IMCINE naming, pre-export language check, ZIP packaging

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
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

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
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

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
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + Intake Wizard | 4/4 | Complete   | 2026-03-22 |
| 2. Screenplay Processing | 0/2 | Not started | - |
| 3. AI Document Generation Pipeline | 0/3 | Not started | - |
| 4. Validation Engine + Dashboard | 0/3 | Not started | - |
| 5. Export Manager | 0/2 | Not started | - |
