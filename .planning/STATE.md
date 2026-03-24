---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 04-03-PLAN.md
last_updated: "2026-03-24T14:52:35.384Z"
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 19
  completed_plans: 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents.
**Current focus:** Phase 04 — validation-dashboard

## Current Position

Phase: 04 (validation-dashboard) — EXECUTING
Plan: 4 of 7

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 12min | 2 tasks | 41 files |
| Phase 01 P02 | 4min | 2 tasks | 10 files |
| Phase 01 P03 | 4min | 2 tasks | 9 files |
| Phase 01 P04 | 10min | 3 tasks | 9 files |
| Phase 02 P01 | 7min | 2 tasks | 15 files |
| Phase 02 P02 | 13min | 2 tasks | 15 files |
| Phase 03 P01 | 14min | 3 tasks | 19 files |
| Phase 03 P02 | 10min | 2 tasks | 6 files |
| Phase 03 P03 | 10min | 2 tasks | 6 files |
| Phase 03 P04 | 14min | 3 tasks | 13 files |
| Phase 03 P06 | 5min | 1 tasks | 9 files |
| Phase 03 P05 | 5min | 2 tasks | 7 files |
| Phase 04 P01 | 7min | 1 tasks | 13 files |
| Phase 04 P02 | 9min | 1 tasks | 5 files |
| Phase 04 P03 | 16min | 2 tasks | 11 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 5 phases derived from data dependency chain -- each phase's output is the next phase's input
- [Roadmap]: LANG requirements split across phases (LANG-02/03 in Phase 1 for UI formatting, LANG-01/04 in Phase 3 for generated docs, LANG-05 in Phase 5 for pre-export check)
- [Roadmap]: INTK-04/05 (screenplay upload + correction UI) placed in Phase 1 with intake wizard rather than Phase 2 because the UI belongs with the wizard screens; Phase 2 handles the backend processing pipeline
- [Phase 01]: Used shadcn oklch color system merged with custom HSL status tokens for traffic light colors
- [Phase 01]: Integer centavos arithmetic for all monetary values, formatMXN only at display layer
- [Phase 01]: Gestor cap at 10M EFICINE threshold: 4% above, 5% at or below
- [Phase 01]: Custom useAutoSaveERPI hook for ERPI singleton instead of project-scoped useAutoSave
- [Phase 01]: QueryClientProvider and Toaster in main.tsx wrapping App for global access
- [Phase 01]: React Hook Form onTouched mode for progressive validation (errors after blur per D-17)
- [Phase 01]: Each TeamMemberForm has independent useForm instance enabling per-member auto-save
- [Phase 01]: react-pdf v10 with local pdfjs-dist worker for screenplay PDF display
- [Phase 01]: Compliance panel reads team subcollection for in-kind totals and screenwriter fee, uses watch() for real-time updates
- [Phase 01]: Document checklist hardcodes 13 required upload types matching EFICINE requirements
- [Phase 02]: pdf-parse v2 uses class-based API (PDFParse class + getText/getInfo), not v1 function-based API
- [Phase 02]: extractText tests use behavior verification pattern (testing normalization directly) to avoid pdfjs-dist jsdom incompatibility
- [Phase 02]: Cloud Functions deploy with predeploy cp -r prompts to bundle prompt files inside functions/ directory
- [Phase 02]: Dependency injection pattern for Cloud Function handler testability (optional db/client params) instead of module mocking across separate node_modules
- [Phase 02]: Handler extraction: onCall wrapper in index.ts delegates to pure handler in analyzeHandler.ts for DI-based unit testing
- [Phase 02]: vi.hoisted() required for mock factories referencing variables in @functions alias tests
- [Phase 03]: Zod v4 toJSONSchema for Claude structured outputs (library type incompatibility with v3-based zod-to-json-schema)
- [Phase 03]: Pure function getStalePasses for staleness detection (no Firestore, unit-testable) with separate Firestore operations
- [Phase 03]: Budget Imprevistos (account 1200) absorbs delta between computed line items and target total cost with 10% BTL floor
- [Phase 03]: Handlebars strict:false for prompt compilation allows partial variable resolution without throwing
- [Phase 03]: Used estimacion_jornadas.media for shooting days (plan said .estandar but data model uses baja/media/alta)
- [Phase 03]: Firebase onCall streaming uses (request, response) pattern where response.sendChunk handles SSE
- [Phase 03]: StreamCallback imported from lineProducer.ts as canonical source rather than duplicating type
- [Phase 03]: A4 Propuesta de Direccion is a structured template (isTemplate:true) for director to fill externally, not AI prose (D-07)
- [Phase 03]: Legal fees from intake team data via formatMXNLegal (D-15), combined pass gets 600s timeout for 8-document workload
- [Phase 03]: WizardShell has dedicated layout for generation screen (no padding wrapper) to support two-panel layout
- [Phase 03]: Frontend document registry is a static array mirroring backend DOCUMENT_REGISTRY (no cross-boundary import)
- [Phase 03]: Firebase httpsCallable().stream() for real-time progress from Cloud Functions to frontend
- [Phase 03]: Inline editable cell pattern for budget: raw number on focus, formatted MXN on blur (same as MXNInput)
- [Phase 03]: Budget auto-save writes FULL BudgetOutput (with partidas) to meta/budget_output for downstream pass compatibility
- [Phase 03]: A4 Word export uses lightweight .txt template (Claude discretion per CONTEXT.md)
- [Phase 03]: useStaleness uses pure function computeStalePasses for testable staleness logic, separate from Firestore listener
- [Phase 03]: DOC_TO_PASS static map in useStaleness for O(1) document-to-pass staleness lookup
- [Phase 04]: Pure function signatures with typed params per rule rather than full ProjectDataSnapshot for independent testability
- [Phase 04]: TeamMemberLike interface in experienceThresholds for loose coupling to schema layer
- [Phase 04]: NavigateTo type with screen, fieldId, memberIndex for precise Ir al campo deep links
- [Phase 04]: Dynamic severity for documentExpiration: warning when approaching, blocker when expired (per D-17)
- [Phase 04]: BonusCheckInput flat boolean/number interface from RESEARCH.md -- caller maps team/project data
- [Phase 04]: Hyperlink rule reads cached verification only, no HTTP requests (per D-12)
- [Phase 04]: Score signal booleans on ProjectDataSnapshot rather than deep document content analysis for deterministic viability scoring
- [Phase 04]: AI persona prompts instruct 65-70% average scoring to prevent inflation and approximate real EFICINE evaluator behavior
- [Phase 04]: Per-persona graceful failure (null result) in Cloud Function so partial results still useful if one persona times out

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: unpdf text extraction quality varies across screenplay formats -- may need pdfjs-dist fallback (test in Phase 2)
- [Research]: Cloud Functions v2 has 540-second timeout -- full AI pipeline may exceed this (validate in Phase 2/3)

## Session Continuity

Last session: 2026-03-24T14:52:35.381Z
Stopped at: Completed 04-03-PLAN.md
Resume file: None
