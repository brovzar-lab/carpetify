# Carpetify — External Integrations

## Project Status
No integrations are implemented yet. This documents the planned integration architecture per `directives/app_spec.md`.

## Primary Integrations

### 1. Anthropic API (Claude) — AI Document Generation
- **Purpose:** Generate ~20 EFICINE submission documents from screenplay analysis + project data
- **Integration Type:** API calls via Firebase Cloud Functions
- **Data Flow:** Screenplay data + project metadata → Spanish system prompt (from `prompts/*.md`) + injected variables → Claude → structured Spanish document output → Firestore
- **Prompts:** 7 sequential passes, each building on prior outputs:
  - Pass 1: Screenplay analysis (scene breakdown, locations, characters, complexity)
  - Pass 2: Line producer docs (production proposal, shooting schedule, budget)
  - Pass 3: Financial docs (cash flow, financial scheme, contribution letter)
  - Pass 4: Legal docs (contract templates, commitment letters)
  - Pass 5: Combined docs (executive summary, synopsis, team sheet, exhibition proposal, technical data sheet)
  - Pass 6: Cross-validation
- **Language Constraint:** All prompts and outputs in Mexican Spanish with EFICINE terminology

### 2. Firebase Authentication
- **Purpose:** Producer user accounts
- **Auth Methods:** TBD (likely email/password at minimum)
- **User Type:** Mexican film producers submitting to EFICINE

### 3. Cloud Firestore
- **Purpose:** Primary data store for all project data
- **Collections:** `projects/{projectId}` with subcollections for team, financials, documents, generated docs, validation
- **Schema:** Defined in `schemas/modulo_a.json` through `schemas/export_manager.json` (6 schema files)

### 4. Firebase Storage
- **Purpose:** File storage for:
  - Uploaded screenplay PDFs
  - User-provided legal documents (contracts, IDs, bank statements, INDAUTOR certs)
  - AI-generated PDF documents
  - Final export ZIP packages

### 5. PDF Parsing (pdf-parse / pdf.js)
- **Purpose:** Extract text from uploaded screenplay PDFs
- **Output:** Scene count, page count, locations, characters, INT/EXT/DAY/NIGHT breakdown
- **Constraint:** Must handle professional screenplay format (Courier 12pt, standard margins)

### 6. PDF Generation (@react-pdf/renderer / jsPDF)
- **Purpose:** Generate final submission-ready PDFs from Firestore data
- **Constraints:**
  - Max 40 MB per file
  - File names max 15 characters, pattern `^[A-Za-z0-9_]+$`
  - No decorative cover pages
  - Spanish content throughout
  - Autograph or digital signatures supported

## External Systems (No Direct API Integration)

### SHCP Portal (estimulosfiscales.hacienda.gob.mx)
- **Relationship:** Manual upload target — the app generates the carpeta, user uploads it manually
- **No API:** The SHCP system has no public API; registration requires e.firma (electronic signature)
- **Registration Periods 2026:** Jan 30–Feb 13 (Period 1), Jul 1–Jul 15 (Period 2)

### IMCINE
- **Relationship:** Regulatory body that evaluates submissions
- **No direct integration** — the app follows IMCINE's Lineamientos and scoring rubric

### INDAUTOR (Copyright Office)
- **Relationship:** Users must register screenplays and rights transfer contracts at INDAUTOR independently
- **App responsibility:** Validate that INDAUTOR certificate data matches project data

### SAT (Tax Authority)
- **Relationship:** Provides Constancia de Situación Fiscal directly to the Comité
- **User provides:** e.firma for system registration, Constancia for ERPI general requirements

## Cross-Module Validation (13 Rules)
The app implements 13 cross-module validation rules (defined in `references/validation_rules.md`) that enforce consistency across all integrations:
1. Financial reconciliation (budget = cash flow = financial scheme)
2. Title consistency across all documents
3. Fee cross-matching (contracts = budget = cash flow)
4. Date compliance (all docs < 3 months old)
5. Experience thresholds (producer/director minimums)
6. ERPI eligibility checks
7. Prohibited expenditure detection
8. Document completeness verification
9. File format compliance (PDF, ≤40MB, ≤15 char names)
10. Hyperlink accessibility
11. Ruta crítica ↔ cash flow sync
12. Co-production special rules
13. Bonus points eligibility
