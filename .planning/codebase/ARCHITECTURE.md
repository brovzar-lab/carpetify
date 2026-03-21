# Carpetify — Architecture

## Project Status
**Pre-code / Specification phase.** No source code exists. Architecture is fully specified in `directives/app_spec.md` but not yet implemented.

## Planned Architecture Pattern
**Client-server with serverless backend** — React SPA + Firebase services (BaaS) + Cloud Functions for AI processing.

## Application Layers

### 1. Presentation Layer (React + Tailwind + shadcn/ui)
- **Wizard Flow:** 5-screen intake process guiding users step by step
  - Screen 1: Project Setup (title, genre, category, ERPI info, budget)
  - Screen 2: Screenplay Upload (PDF parse + confirm breakdown)
  - Screen 3: Creative Team (CVs, filmography, fees per role)
  - Screen 4: Financial Structure (sources, percentages, compliance calc)
  - Screen 5: Document Upload (legal docs user must provide)
- **Dashboard:** Traffic light system (🟢🟡🔴) for document status and validation checks
- **Document Viewer:** Preview AI-generated documents before export
- **Language:** 100% Mexican Spanish UI (hardcoded, not i18n-translated)

### 2. Data Layer (Cloud Firestore)
- **Primary Collection:** `projects/{projectId}` with subcollections
- **Schema Source of Truth:** 6 JSON schema files in `schemas/`:
  - `modulo_a.json` — Propuesta Cinematográfica (A1-A11, 62/100 artistic + 38/100 viability points)
  - `modulo_b.json` — Personal Creativo (pass/fail, CVs, contracts)
  - `modulo_c.json` — ERPI Legal (pass/fail, copyright, commitments)
  - `modulo_d.json` — Cotizaciones (pass/fail, insurance + CPA quotes)
  - `modulo_e.json` — Esquema Financiero (pass/fail, funding structure)
  - `export_manager.json` — File compilation rules + ERPI general requirements

### 3. AI Processing Layer (Anthropic API via Cloud Functions)
- **Three AI Personas:**
  - **Line Producer** — generates production docs (A7, A8a/b, A9a/b)
  - **Finance Advisor** — generates financial docs (A9d, E1, E2)
  - **Lemon Lawyer** — generates legal templates (B3, C2b, C3a/b)
  - **Combined** — generates consolidated docs (A1, A2, A6, A10, C4)
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
User Input (5 screens)
    ↓
Firestore (persistent storage)
    ↓
Screenplay PDF → PDF Parser → Scene breakdown data
    ↓
AI Pipeline (7 sequential passes via Cloud Functions)
    ↓
Generated Documents → Firestore (generated/{docId})
    ↓
Validation Engine (13 rules, real-time)
    ↓
Export Manager → PDF Generation → ZIP Package
    ↓
User downloads → Manual upload to SHCP portal
```

## Key Abstractions

### Project Modality Router
The app must determine project type at intake and route to correct requirements:
- `produccion_nuevo` — default, most complete (all A-E sections)
- `postproduccion` — filming complete, replaces screenplay with first cut
- `previamente_autorizado` — prior EFICINE approval, requires comparative budgets
- `previamente_evaluado` — prior evaluation, different doc requirements
- `coproduccion_internacional` — adds IMCINE recognition, FX conversion, territorial split

### Document Generation Pipeline
Each AI-generated document follows: load prompt → inject variables → append language guardrail → call Claude → store result → trigger downstream regeneration if dependencies change.

### Self-Scoring Engine
Estimates project score (100 pts + 5 bonus) based on rubric in `references/scoring_rubric.md`. Quality assurance tool, not a prediction. Minimum to pass: 90/100.

## Entry Points
- **User-facing:** React SPA (no source code yet)
- **API:** Firebase Cloud Functions (no source code yet)
- **Build phases defined in `CLAUDE.md`:** 5 phases from scaffold through export manager
