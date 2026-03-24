# Requirements: Carpetify

**Defined:** 2026-03-21
**Core Value:** Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents.

## v1 Requirements

### Intake & Data Management

- [x] **INTK-01**: User can create a new project with title, genre, category, duration, format, aspect ratio, languages, budget, EFICINE request amount, and ERPI information
- [x] **INTK-02**: User selects target EFICINE registration period (Period 1: Jan 30–Feb 13 or Period 2: Jul 1–Jul 15) per project, driving date validation
- [x] **INTK-03**: User can manage up to 3 projects simultaneously, with isolated data per project and a project selector
- [x] **INTK-04**: User can upload screenplay PDF and view parsed breakdown (scenes, locations, characters, INT/EXT/DAY/NIGHT)
- [x] **INTK-05**: User can correct/override parsed screenplay data when extraction is inaccurate
- [x] **INTK-06**: User can enter creative team data per role (producer, director, screenwriter, DP, art director, editor) — name, nationality, filmography, fee, in-kind contribution
- [x] **INTK-07**: User can enter financial structure — ERPI contribution (cash + in-kind), third-party contributors (name, type, amount), EFICINE request
- [x] **INTK-08**: User can upload documents the app cannot generate (acta constitutiva, poder notarial, IDs, constancia fiscal, INDAUTOR certs, bank statements, insurance quote, CPA quote, signed contracts, co-production recognition)
- [x] **INTK-09**: User can track upload status per document and see which required uploads are missing
- [x] **INTK-10**: Entire intake wizard UI is in Mexican Spanish with no English visible — labels, buttons, placeholders, errors, tooltips
- [x] **INTK-11**: International co-production flag per project — when enabled, adds required fields: FX conversion rate + date, territorial spend split (national vs foreign), IMCINE co-production recognition certificate upload, pertinence justification in propuesta de producción. Affects budget, flujo, esquema financiero, and contracts

### Screenplay Processing

- [x] **SCRN-01**: App extracts text from uploaded screenplay PDF preserving structure (scene headers, character names, dialogue)
- [x] **SCRN-02**: App parses extracted text to identify scene count, page count, locations list, character list, and INT/EXT/DAY/NIGHT breakdown
- [x] **SCRN-03**: App sends parsed screenplay data to Claude API (via Cloud Function) using the Spanish prompt from `prompts/analisis_guion.md` for deep analysis
- [x] **SCRN-04**: App stores screenplay analysis results in Firestore as structured data (not PDF), accessible to downstream generation passes

### AI Document Generation

- [x] **AIGEN-01**: Line Producer pass generates: propuesta de producción (A7), plan de rodaje (A8a), ruta crítica (A8b), presupuesto resumen (A9a), presupuesto desglose (A9b) — using prompt from `prompts/`
- [x] **AIGEN-02**: Finance Advisor pass generates: flujo de efectivo (A9d/FORMATO 3), esquema financiero (E1/FORMATO 9), carta aportación exclusiva (E2/FORMATO 10) — using budget from Line Producer pass
- [x] **AIGEN-03**: Legal pass generates: cesión de derechos contract (C2b), producer contract (B3), director contract (B3), carta buenas prácticas (C3a/FORMATO 6), carta PICS (C3b/FORMATO 7) — using fees from budget
- [x] **AIGEN-04**: Combined pass generates: resumen ejecutivo (A1/FORMATO 1), sinopsis (A2), solidez equipo creativo (A6/FORMATO 2), propuesta exhibición (A10), ficha técnica (C4/FORMATO 8), bonus points assessment (A11)
- [x] **AIGEN-05**: All AI prompts are loaded from `prompts/` folder in Spanish with `{{variable}}` substitution — prompts are never rewritten or inlined in English
- [x] **AIGEN-06**: All monetary values in generated documents are injected deterministically from computed data — AI never calculates or invents financial numbers
- [x] **AIGEN-07**: Budget generation uses Mexican film industry market rates (crew rates, equipment, catering, insurance benchmarks) per IMCINE standard account structure (100–1200)
- [x] **AIGEN-08**: Generated documents are stored in Firestore as structured data, viewable in the UI, and available for downstream passes and validation
- [x] **AIGEN-09**: Changing upstream data (intake fields, screenplay reparse, or prior-pass outputs) marks affected downstream documents as stale
- [x] **AIGEN-10**: User can trigger one-click regeneration of stale documents — the app re-runs affected pipeline passes with updated data
- [x] **AIGEN-11**: Pitch para contribuyentes document generation — uses `prompts/documentos_combinados.md` to generate a 1-2 page sales document targeting corporate CFOs who would donate ISR via the EFICINE mechanism. Not evaluated by IMCINE but operationally critical for securing funding

### Validation & Compliance

- [x] **VALD-01**: Financial reconciliation — budget total == cash flow total == esquema financiero total, with per-account and per-source cross-checks (blocker)
- [x] **VALD-02**: Title consistency — project title is character-identical across all generated and uploaded documents (blocker)
- [x] **VALD-03**: Fee cross-matching — producer, director, and screenwriter fees match across contracts, budget line items, and cash flow (blocker)
- [x] **VALD-04**: Date compliance — all supporting documents have issue dates within 3 months of the target registration period close date (blocker)
- [x] **VALD-05**: EFICINE compliance — ERPI ≥ 20%, EFICINE ≤ 80% and ≤ $25M MXN, federal sources ≤ 80%, screenwriter ≥ 3%, in-kind ≤ 10%, per-person in-kind ≤ 50% of fee, gestor cap (blocker)
- [x] **VALD-06**: Document completeness — every required document in Sections A–E is generated or uploaded; missing any = flagged as blocker
- [x] **VALD-07**: Experience thresholds — producer has ≥ 1 exhibited feature (fiction/doc) or ≥ 3 shorts (animation); director has ≥ 1 feature or ≥ 2 shorts (blocker)
- [x] **VALD-08**: ERPI eligibility — fewer than 2 unexhibited prior EFICINE projects, ≤ 3 submissions this period, ≤ 3 total attempts for this project (blocker)
- [x] **VALD-09**: File format compliance — all output PDFs ≤ 40 MB, filenames ≤ 15 chars, no accents/ñ/commas/&/symbols (blocker)
- [x] **VALD-10**: Prohibited expenditure scan — flag any EFICINE-sourced funds allocated to prohibited categories in the cash flow (blocker)
- [x] **VALD-11**: Ruta crítica ↔ cash flow sync — timeline stages align with spending periods (warning)
- [x] **VALD-12**: Hyperlink accessibility — verify filmmaker portfolio and material visual links are publicly accessible (warning)
- [x] **VALD-13**: Bonus points eligibility — detect applicable bonus category (+5 pts) and flag required documentation (warning)
- [ ] **VALD-14**: Real-time validation — compliance checks run as data is entered, not just at export time
- [x] **VALD-15**: Score estimation — estimate project's EFICINE score against the rubric (100 pts + 5 bonus) with actionable improvement suggestions
- [ ] **VALD-16**: Traffic light dashboard — per-document and per-rule status (🟢 complete, 🟡 needs attention, 🔴 missing/blocking) as primary navigation surface
- [x] **VALD-17**: Document expiration alert system — proactive warnings when uploaded documents (insurance quote, CPA quote, bank statements, third-party support letters, in-kind quotes) approach 3-month expiration relative to target registration close date. Show days remaining, flag red when <14 days

### Export

- [ ] **EXPRT-01**: App generates PDFs from stored document data using IMCINE file naming convention (max 15 chars, ASCII only)
- [ ] **EXPRT-02**: App compiles complete carpeta as ZIP with organized folder structure: 00_ERPI/, A_PROPUESTA/, B_PERSONAL/, C_ERPI/, D_COTIZ/, E_FINANZAS/
- [ ] **EXPRT-03**: Export includes validation report, score estimate, and submission upload guide
- [ ] **EXPRT-04**: Export only proceeds when all blocker validations pass — warnings are flagged but don't block
- [ ] **EXPRT-05**: Generated documents conform to IMCINE's official FORMATO structures (FORMATO 1–11). Validation checks that output matches required table/field structure, not just content

### Language & Formatting

- [x] **LANG-01**: All generated documents use Mexican Spanish with IMCINE/EFICINE terminology never translated (protected terms per `politica_idioma.md`)
- [x] **LANG-02**: Monetary amounts formatted as $X,XXX,XXX MXN throughout — comma thousands separator, no decimals, peso sign, MXN suffix
- [x] **LANG-03**: Dates formatted in Spanish: "15 de julio de 2026" or "Agosto 2026"
- [x] **LANG-04**: Generated prose uses formal but non-bureaucratic Mexican Spanish — precise, concrete, cinematographic vocabulary per politica_idioma.md guidelines
- [ ] **LANG-05**: Pre-export language check — scan for anglicisms, verify format consistency, confirm title identity across all documents

## v2 Requirements

### Collaboration & Access

- **COLLAB-01**: Multiple team members can contribute to different sections (producer, line producer, lawyer)
- **COLLAB-02**: Role-based access control for different contributors
- **AUTH-01**: Firebase Auth with Google login for Lemon Studios team

### Co-Production Engine

- **COPROD-01**: Full international co-production rules engine (territorial budget split, exchange rates, IMCINE recognition)
- **COPROD-02**: Multi-currency support with exchange rate tracking

### Enhanced AI

- **AIGEN-V2-01**: AI-powered pre-submission review simulating evaluator perspective
- **AIGEN-V2-02**: Document version comparison and diff view

### Additional Modalities

- **MODAL-01**: EFICINE Postproduccion modality — different document requirements, different scoring rubric (65 pts for filmed material vs 40 for screenplay), different FORMATO structures
- **MODAL-02**: Previously-authorized project modality — projects that were previously approved but need to resubmit updated documentation (different requirements per enrutador_modalidad in export_manager.json)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication | Internal tool for single user at Lemon Studios — auth adds friction with no value |
| Mobile responsive UI | 30-document dossier assembly requires desktop screen; mobile is unusable |
| SaaS features (billing, onboarding) | Not a product for sale; internal competitive advantage tool |
| Screenplay writing/editing | Tool consumes screenplays, doesn't create them; separate tools exist (Final Draft, etc.) |
| EFICINE Postproduccion | Different program, different rules, different rubric — would double validation logic |
| Direct SHCP portal integration | No API; scraping government tax portal is legally risky and fragile |
| AI screenplay quality critique | Tool ensures compliance, not creative judgment on the screenplay itself |
| Automatic INDAUTOR registration | Requires author credentials and in-person/portal interaction |
| E-signature integration | Mexican legal validity requires wet signatures or FIEL; DocuSign may not satisfy IMCINE |
| Historical analytics/reporting | Tool generates carpetas, not dashboards across submission years |
| Document translation | All docs are in Spanish, evaluators read Spanish — translation adds no value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTK-01 | Phase 1 | Complete |
| INTK-02 | Phase 1 | Complete |
| INTK-03 | Phase 1 | Complete |
| INTK-04 | Phase 1 | Complete |
| INTK-05 | Phase 1 | Complete |
| INTK-06 | Phase 1 | Complete |
| INTK-07 | Phase 1 | Complete |
| INTK-08 | Phase 1 | Complete |
| INTK-09 | Phase 1 | Complete |
| INTK-10 | Phase 1 | Complete |
| INTK-11 | Phase 1 | Complete |
| SCRN-01 | Phase 2 | Complete |
| SCRN-02 | Phase 2 | Complete |
| SCRN-03 | Phase 2 | Complete |
| SCRN-04 | Phase 2 | Complete |
| AIGEN-01 | Phase 3 | Complete |
| AIGEN-02 | Phase 3 | Complete |
| AIGEN-03 | Phase 3 | Complete |
| AIGEN-04 | Phase 3 | Complete |
| AIGEN-05 | Phase 3 | Complete |
| AIGEN-06 | Phase 3 | Complete |
| AIGEN-07 | Phase 3 | Complete |
| AIGEN-08 | Phase 3 | Complete |
| AIGEN-09 | Phase 3 | Complete |
| AIGEN-10 | Phase 3 | Complete |
| AIGEN-11 | Phase 3 | Complete |
| VALD-01 | Phase 4 | Complete |
| VALD-02 | Phase 4 | Complete |
| VALD-03 | Phase 4 | Complete |
| VALD-04 | Phase 4 | Complete |
| VALD-05 | Phase 4 | Complete |
| VALD-06 | Phase 4 | Complete |
| VALD-07 | Phase 4 | Complete |
| VALD-08 | Phase 4 | Complete |
| VALD-09 | Phase 4 | Complete |
| VALD-10 | Phase 4 | Complete |
| VALD-11 | Phase 4 | Complete |
| VALD-12 | Phase 4 | Complete |
| VALD-13 | Phase 4 | Complete |
| VALD-14 | Phase 4 | Pending |
| VALD-15 | Phase 4 | Complete |
| VALD-16 | Phase 4 | Pending |
| VALD-17 | Phase 4 | Complete |
| EXPRT-01 | Phase 5 | Pending |
| EXPRT-02 | Phase 5 | Pending |
| EXPRT-03 | Phase 5 | Pending |
| EXPRT-04 | Phase 5 | Pending |
| EXPRT-05 | Phase 5 | Pending |
| LANG-01 | Phase 3 | Complete |
| LANG-02 | Phase 1 | Complete |
| LANG-03 | Phase 1 | Complete |
| LANG-04 | Phase 3 | Complete |
| LANG-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
