# Carpetify — Technology Stack

## Project Status

**Pre-code / Specification phase.** No source code, build system, or runtime dependencies exist yet. The repository contains only specification documents, JSON schemas, AI prompt templates, and reference materials.

## Planned Stack (per `directives/app_spec.md`)

### Frontend
- **Framework:** React
- **Styling:** Tailwind CSS + shadcn/ui component library
- **Language:** TypeScript (implied by React + modern tooling)
- **UI Language:** 100% Mexican Spanish — no English in user-facing text

### Backend / Infrastructure
- **Platform:** Firebase
  - **Auth:** Firebase Authentication (producer login)
  - **Database:** Cloud Firestore (document-oriented, project data)
  - **Storage:** Firebase Storage (screenplay PDFs, generated documents, user uploads)
  - **Functions:** Firebase Cloud Functions (server-side processing)
- **Hosting:** Firebase Hosting (implied)

### AI / Document Generation
- **Provider:** Anthropic API (Claude)
- **Prompt Architecture:** 7 sequential Spanish system prompts in `prompts/` folder
- **Execution Order:**
  1. `analisis_guion.md` — screenplay parsing (foundation)
  2. `a7_propuesta_produccion.md` — production proposal
  3. `a8_plan_rodaje_y_ruta_critica.md` — shooting schedule + critical path
  4. `a9_presupuesto.md` — budget (summary + detail)
  5. `documentos_financieros.md` — cash flow, financial scheme, contribution letter
  6. `documentos_legales.md` — contract templates, commitment letters
  7. `documentos_combinados.md` — executive summary, synopsis, team sheet, exhibition proposal, technical data sheet, pitch

### PDF Processing
- **Parsing (input):** pdf-parse or pdf.js — extract screenplay text from uploaded PDFs
- **Generation (output):** @react-pdf/renderer or jsPDF — produce final submission PDFs

### Data Model (Firestore)
```
projects/{projectId}
├── metadata (title, genre, category, ERPI info, dates)
├── screenplay (parsed data: scenes, locations, characters, breakdown)
├── team/{memberId} (name, role, nationality, filmography, fee)
├── financials (budget, esquema, flujo, contributions)
├── documents/{docId} (uploaded files: references, URLs, status)
├── generated/{docId} (AI-generated documents: content, version, timestamp)
└── validation (check results, completeness score, flags)
```

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
