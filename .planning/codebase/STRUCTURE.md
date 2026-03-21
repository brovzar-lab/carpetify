# Carpetify — Directory Structure

## Project Status
**Pre-code / Specification phase.** Repository contains only specification documents — no source code, no build artifacts, no node_modules.

## Current Directory Layout

```
CARPETIFY/
├── .claude/                          # Claude Code configuration
│   ├── settings.json
│   ├── settings.local.json
│   └── get-shit-done/               # GSD workflow tooling
├── .cursor/                          # Cursor IDE config
│   └── mcp.json
├── .env                              # Environment variables (secrets — gitignored)
├── .gitignore                        # Git ignore rules
├── .planning/                        # GSD planning directory
│   └── codebase/                     # Codebase map documents (this file)
├── .tmp/                             # Temporary files
│
├── CLAUDE.md                         # Project instructions for Claude Code
│
├── directives/                       # Project specification documents
│   ├── app_spec.md                   # Full application architecture spec (~800 lines)
│   │                                   Complete document map, scoring rubric, data flow,
│   │                                   intake screens, AI pipeline, validation rules,
│   │                                   budget generation rules, legal doc rules,
│   │                                   file naming convention, output package structure
│   ├── politica_idioma.md            # Language policy + linguistic guardrails (~250 lines)
│   │                                   Three-layer language architecture, protected terms,
│   │                                   UI Spanish rules, prose guidelines, format rules
│   └── phase_tracker.md              # Build phase status tracker (all phases: NOT STARTED)
│
├── schemas/                          # Firestore data model schemas (JSON Schema draft-07)
│   ├── README.md                     # Schema map + corrections log
│   ├── modulo_a.json                 # Section A — Propuesta Cinematográfica (A1-A11)
│   ├── modulo_b.json                 # Section B — Personal Creativo (CVs, contracts)
│   ├── modulo_c.json                 # Section C — ERPI Legal (INDAUTOR, commitments)
│   ├── modulo_d.json                 # Section D — Cotizaciones (insurance, CPA)
│   ├── modulo_e.json                 # Section E — Esquema Financiero (funding structure)
│   └── export_manager.json           # File compilation rules + ERPI requirements
│
├── prompts/                          # AI generation prompts (100% Spanish, for runtime)
│   ├── README.md                     # Execution order + conventions
│   ├── analisis_guion.md             # Pass 1: Screenplay analysis
│   ├── a7_propuesta_produccion.md    # Pass 2: Production proposal
│   ├── a8_plan_rodaje_y_ruta_critica.md  # Pass 2: Shooting schedule + critical path
│   ├── a9_presupuesto.md             # Pass 2: Budget (summary + detail)
│   ├── documentos_financieros.md     # Pass 3: Cash flow, financial scheme
│   ├── documentos_legales.md         # Pass 4: Contracts, commitment letters
│   ├── documentos_combinados.md      # Pass 5: Combined docs (exec summary, synopsis, etc.)
│   ├── a1_resumen_ejecutivo.md       # Pass 5: Executive summary
│   ├── a2_sinopsis.md                # Pass 5: Synopsis
│   └── a10_propuesta_exhibicion.md   # Pass 5: Exhibition proposal
│
├── references/                       # Reference materials for validation + scoring
│   ├── scoring_rubric.md             # EFICINE scoring breakdown (100 pts + 5 bonus)
│   └── validation_rules.md           # 13 cross-module validation rules (blocker/warning)
│
├── skills/                           # Claude Code skills (large collection, not project-specific)
│   └── [~80+ skill directories]      # Various automation/tooling skills
│
├── execution/                        # (Deleted) Previously contained utils.py
└── requirements.txt                  # (Deleted) Previously existed
```

## Key Locations

| Need | Location |
|------|----------|
| Full app spec | `directives/app_spec.md` |
| Language rules | `directives/politica_idioma.md` |
| Build progress | `directives/phase_tracker.md` |
| Data model | `schemas/*.json` (6 files) |
| AI prompts | `prompts/*.md` (10 prompt files + README) |
| Validation rules | `references/validation_rules.md` |
| Scoring rubric | `references/scoring_rubric.md` |
| Project instructions | `CLAUDE.md` |

## Naming Conventions

### Specification Files
- Directives: English filenames, mixed-language content (`app_spec.md`, `politica_idioma.md`)
- Schemas: Spanish field names following EFICINE terminology (`modulo_a.json`)
- Prompts: Spanish filenames matching EFICINE document IDs (`a7_propuesta_produccion.md`)
- References: English filenames (`scoring_rubric.md`, `validation_rules.md`)

### Planned Code Conventions (from `CLAUDE.md` + `directives/politica_idioma.md`)
- **Component names:** English (`BudgetSummary`, `ScreenplayParser`, `ValidationEngine`)
- **Function names:** English (`calculatePercentage`, `validateDateRange`)
- **Firebase collections:** English (`projects`, `team_members`, `generated_docs`)
- **Schema field names:** Spanish (`titulo_proyecto`, `monto_solicitado_eficine_mxn`)
- **Enum values:** Spanish EFICINE terms (`Ficción`, `Documental`, `Animación`)
- **UI text:** Spanish hardcoded (no English placeholders)
- **Git:** English (commits, branches, PRs)

## Files Not Yet Created
No source code directories exist yet. Expected when Phase 1 begins:
- `src/` — React application source
- `public/` — Static assets
- `functions/` — Firebase Cloud Functions
- `package.json` — Dependencies
- `tsconfig.json` — TypeScript config
- `firebase.json` — Firebase project config
- `firestore.rules` — Security rules
- `locales/es.json` or equivalent — Spanish UI strings
