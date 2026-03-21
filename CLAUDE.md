# CARPETIFY

## What This Is

Carpetify is a React + Firebase web app that takes a feature film screenplay and generates a complete EFICINE Article 189 submission dossier ("carpeta") for the Mexican government film tax incentive program. Users upload a screenplay, enter project data, and the app generates ~30 documents in Spanish using AI, validates them against EFICINE's rules, and exports a ready-to-upload package.

**Target user:** Mexican film producers submitting to IMCINE via the SHCP portal (estimulosfiscales.hacienda.gob.mx).

**Stack:** React + Tailwind + shadcn/ui, Firebase (Auth, Firestore, Storage, Functions), Anthropic API (Claude) for document generation, PDF parsing + generation.

---

## Critical Rules (Always Apply)

1. **LANGUAGE:** The entire user-facing app is in Mexican Spanish. ALL generated documents are in Spanish. Read `directives/politica_idioma.md` before building any UI component or AI prompt integration. English is ONLY for code infrastructure (component names, function names, git).

2. **TERMINOLOGY:** EFICINE/IMCINE terms are NEVER translated. "ERPI", "presupuesto desglosado", "flujo de efectivo", "esquema financiero", "cesión de derechos", "ruta crítica" — these stay in Spanish even in code comments that reference them. See the protected terms list in `directives/politica_idioma.md`.

3. **AMOUNTS:** Always `$X,XXX,XXX MXN` — comma thousands separator, no decimals, peso sign, MXN suffix.

4. **DATES:** Always Spanish format: "15 de julio de 2026" or "Agosto 2026".

---

## Where Things Live

| Need | Read This |
|------|-----------|
| Full app architecture, workflow, document map, EFICINE rules | `directives/app_spec.md` |
| Language policy, UI text rules, protected terms, prose guidelines | `directives/politica_idioma.md` |
| Current build phase and progress | `directives/phase_tracker.md` |
| Data model schemas (Firestore structure) | `schemas/*.json` |
| AI generation prompts (Spanish, for runtime) | `prompts/*.md` |
| Scoring rubric (how EFICINE evaluates projects) | `references/scoring_rubric.md` |
| Cross-module validation rules (13 checks) | `references/validation_rules.md` |

---

## Build Phases

### Phase 1 — Scaffold + Data Model + Intake Wizard
Read: `directives/app_spec.md` (sections: Data Model, Key UX Principles, Phase 1 Intake screens)
Read: `schemas/modulo_a.json`, `schemas/modulo_b.json` (for form field structure)
Read: `directives/politica_idioma.md` (for all UI text)
Build: React project, Firebase config, Firestore schema, 5-screen intake wizard (Spanish UI), basic auth.

### Phase 2 — Screenplay Parser
Read: `directives/app_spec.md` (section: Screenplay Analysis Engine)
Read: `prompts/analisis_guion.md` (the prompt that parses screenplays)
Build: PDF upload + text extraction, Claude API integration for screenplay analysis, parsed data stored in Firestore.

### Phase 3 — Validation Engine
Read: `references/validation_rules.md` (all 13 cross-module rules)
Read: `schemas/*.json` (for field-level validation)
Build: Real-time validation on intake forms, traffic light dashboard, blocker vs warning classification.

### Phase 4 — AI Document Generation
Read: `prompts/*.md` (ALL prompt files, in execution order per `prompts/README.md`)
Read: `directives/politica_idioma.md` (language guardrails appended to every prompt)
Read: `references/scoring_rubric.md` (for self-scoring engine)
Build: Document generation pipeline — screenplay analysis → line producer docs → financial docs → legal docs → combined docs. Each doc stored in Firestore, viewable in UI.

### Phase 5 — Export Manager
Read: `directives/app_spec.md` (section: Output Package, File Naming Convention)
Read: `schemas/export_manager.json` (file rules, naming, size limits)
Build: PDF generation from stored documents, file naming sanitization, ZIP compilation, completeness checklist.

---

## How to Work

1. Before starting any phase, read the files listed under that phase.
2. Don't read everything at once — load what's needed for the current phase.
3. After completing each phase, update `directives/phase_tracker.md` with what was built and any decisions made.
4. All UI text hardcoded in Spanish — use a locales file or constants, never English placeholders.
5. Test each phase before moving to the next.
6. When building AI generation (Phase 4), the prompts in `prompts/` are the EXACT system prompts to use. Don't rewrite them — inject project data into the `{{variable}}` placeholders.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Carpetify**

Carpetify is an internal web tool for Lemon Studios that takes a feature film screenplay (PDF) and project metadata, then systematically generates a complete EFICINE Article 189 submission dossier ("carpeta") — the ~30-document package required by IMCINE for the Mexican film tax incentive program. The user uploads a screenplay, enters project data through a guided wizard, and the app generates documents using AI, validates them against EFICINE rules, and exports a ready-to-upload package.

Target user: A single producer at Lemon Studios submitting up to 3 projects per EFICINE registration period via the SHCP portal (estimulosfiscales.hacienda.gob.mx).

**Core Value:** Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents — eliminating the cross-document inconsistencies that get applications rejected.

### Constraints

- **Language**: Entire UI and all generated documents must be in Mexican Spanish. Protected EFICINE/IMCINE terminology is never translated. See `directives/politica_idioma.md`.
- **Tech stack**: React + Tailwind + shadcn/ui, Firebase, Anthropic Claude API — already decided, not negotiable.
- **EFICINE rules**: All financial calculations, document requirements, and validation rules must match the 2026 Lineamientos exactly. This is a legal compliance tool.
- **File naming**: Output files must follow IMCINE convention — max 15 characters, no accents/ñ/commas/&/symbols.
- **File size**: All PDFs must be ≤ 40 MB per the SHCP upload system.
- **AI prompts**: Runtime prompts are pre-written in `prompts/` folder in Spanish. Use them as-is with `{{variable}}` substitution — do not rewrite.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Project Status
## Planned Stack (per `directives/app_spec.md`)
### Frontend
- **Framework:** React
- **Styling:** Tailwind CSS + shadcn/ui component library
- **Language:** TypeScript (implied by React + modern tooling)
- **UI Language:** 100% Mexican Spanish — no English in user-facing text
### Backend / Infrastructure
- **Platform:** Firebase
- **Hosting:** Firebase Hosting (implied)
### AI / Document Generation
- **Provider:** Anthropic API (Claude)
- **Prompt Architecture:** 7 sequential Spanish system prompts in `prompts/` folder
- **Execution Order:**
### PDF Processing
- **Parsing (input):** pdf-parse or pdf.js — extract screenplay text from uploaded PDFs
- **Generation (output):** @react-pdf/renderer or jsPDF — produce final submission PDFs
### Data Model (Firestore)
## Configuration Files Present
- `.env` — environment variables (exists, contents not inspected for security)
- `.gitignore` — git ignore rules
- No `package.json`, `tsconfig.json`, or build configuration exists yet
## Key Constraints
- All currency amounts: `$X,XXX,XXX MXN` format (comma thousands, no decimals, peso sign, MXN suffix)
- All dates: Spanish format (`15 de julio de 2026` or `Agosto 2026`)
- Domain model field names in Spanish (matching EFICINE/IMCINE terminology)
- Code infrastructure names in English (component names, functions, git)
- AI prompts 100% Spanish with `{{variable}}` placeholder injection
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Project Status
## Language Architecture (Three Layers)
| Layer | Language | Scope |
|-------|----------|-------|
| Code infrastructure | English | React components, Firebase functions, utility code, git, technical comments |
| Domain model | Spanish | Schema field names, enum values, data labels, validation messages, EFICINE/IMCINE terms |
| UI + Generated docs | Spanish | 100% Mexican Spanish — labels, buttons, errors, tooltips, AI prompts, PDF output |
### Protected Terminology
### Formatting Rules
- **Currency:** `$X,XXX,XXX MXN` (comma thousands, no decimals, peso sign, MXN suffix)
- **Dates:** `15 de julio de 2026` or `Agosto 2026` (never ISO, never English months)
- **Percentages:** `20%` with explicit context (`el 20% del presupuesto total`)
## Schema Conventions
### JSON Schema Files (`schemas/`)
- **Standard:** JSON Schema draft-07
- **Field naming:** Spanish, matching EFICINE document terminology
- **Descriptions:** Bilingual — technical context in English for developers, user-facing text in Spanish
- **Enums:** Spanish EFICINE terms exactly as published in Lineamientos
- **Validation:** Embedded in schema via `minimum`, `maximum`, `maxLength`, `enum`, `pattern`
- **Cross-references:** Documented via `description` fields pointing to related schemas/rules
### Schema Organization
- One file per EFICINE section (A through E) + one for export rules
- Nested objects mirror EFICINE document hierarchy (e.g., `a9_presupuesto.a9a_resumen`)
- Required fields specified at each level
- Validation rules embedded where possible, cross-module rules in `references/validation_rules.md`
## AI Prompt Conventions (`prompts/`)
- **Language:** 100% Spanish (system prompt, user data, format instructions, output)
- **Variable injection:** `{{variable}}` placeholders replaced at runtime by app code
- **Mandatory suffix:** Every prompt appends the language guardrail block from `politica_idioma.md`
- **Structure:** Each prompt follows a 7-part pattern:
- **Execution order:** Sequential — each prompt depends on outputs from prior passes
## Planned Code Conventions
### Component Naming (React)
- English PascalCase for components: `BudgetSummary`, `ScreenplayParser`, `ValidationEngine`
- English camelCase for functions: `calculatePercentage`, `validateDateRange`
### Error Handling
- User-facing errors in Spanish with context: `"El monto de EFICINE no puede exceder el 80% del costo total"`
- Validation errors classified as BLOCKER (stops export) or WARNING (flagged but exportable)
- Traffic light UI: 🟢 complete, 🟡 needs attention, 🔴 missing/blocking
### Data Flow
- Firestore as single source of truth
- Real-time validation on data entry (not just at export)
- One-click regeneration when upstream data changes
- Document versioning via timestamps in `generated/{docId}`
## Git Conventions
- **Commits:** English
- **Branch naming:** TBD (not yet established)
- **PR descriptions:** English
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Project Status
## Planned Architecture Pattern
## Application Layers
### 1. Presentation Layer (React + Tailwind + shadcn/ui)
- **Wizard Flow:** 5-screen intake process guiding users step by step
- **Dashboard:** Traffic light system (🟢🟡🔴) for document status and validation checks
- **Document Viewer:** Preview AI-generated documents before export
- **Language:** 100% Mexican Spanish UI (hardcoded, not i18n-translated)
### 2. Data Layer (Cloud Firestore)
- **Primary Collection:** `projects/{projectId}` with subcollections
- **Schema Source of Truth:** 6 JSON schema files in `schemas/`:
### 3. AI Processing Layer (Anthropic API via Cloud Functions)
- **Three AI Personas:**
- **Sequential Pipeline:** 7 prompt passes where each builds on prior outputs
- **Prompt Storage:** `prompts/*.md` files with `{{variable}}` placeholders
### 4. Validation Engine
- **13 cross-module validation rules** defined in `references/validation_rules.md`
- **Blocker vs Warning classification** — blockers prevent export, warnings are flagged
- **Real-time validation** — runs as data is entered, not just at export
- **Key checks:** Financial reconciliation, title consistency, fee cross-matching, date compliance, experience thresholds, ERPI eligibility, document completeness
### 5. Export Layer
- **PDF Generation:** From Firestore data to submission-ready PDFs
- **File Naming:** `{SECTION}{NUM}_{ABBREV}_{PROJ}` pattern, max 15 chars, ASCII only
- **ZIP Compilation:** Organized folder structure matching SHCP upload requirements
- **Output:** `carpeta_[PROJECT]/` with subdirectories `00_ERPI/`, `A_PROPUESTA/`, `B_PERSONAL/`, `C_ERPI/`, `D_COTIZ/`, `E_FINANZAS/`
## Data Flow
```
```
## Key Abstractions
### Project Modality Router
- `produccion_nuevo` — default, most complete (all A-E sections)
- `postproduccion` — filming complete, replaces screenplay with first cut
- `previamente_autorizado` — prior EFICINE approval, requires comparative budgets
- `previamente_evaluado` — prior evaluation, different doc requirements
- `coproduccion_internacional` — adds IMCINE recognition, FX conversion, territorial split
### Document Generation Pipeline
### Self-Scoring Engine
## Entry Points
- **User-facing:** React SPA (no source code yet)
- **API:** Firebase Cloud Functions (no source code yet)
- **Build phases defined in `CLAUDE.md`:** 5 phases from scaffold through export manager
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
