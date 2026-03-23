---
phase: 03-ai-doc-generation
plan: 03
subsystem: pipeline
tags: [cloud-functions, contracts, legal-docs, combined-docs, concurrency-pool, templates, pitch]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    provides: "Foundation layer (types, promptLoader, documentStore, concurrencyPool, formatters, mock factories)"
provides:
  - "Legal pass handler generating 5 contract/legal documents (B3-prod, B3-dir, C2b, C3a, C3b) with deterministic fee injection"
  - "Combined pass handler generating 8 executive/support documents (A1, A2, A4, A6, A10, A11, C4, PITCH) synthesizing all prior outputs"
  - "A4 director template as structured data for Word export (isTemplate pattern)"
  - "PITCH contributor pitch targeting corporate CFOs (AIGEN-11)"
  - "runLegalPass and runCombinedPass Cloud Function exports completing the 4-pass pipeline"
  - "16 integration tests across 2 test files verifying handler logic with mocked Claude"
affects: [03-04-PLAN, 03-05-PLAN, 03-06-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [StreamCallback re-export from lineProducer, extractPriorDocSummary cross-pass referencing, generateDirectorTemplate structured template pattern]

key-files:
  created:
    - functions/src/pipeline/passes/legal.ts
    - functions/src/pipeline/passes/combined.ts
    - src/__tests__/functions/legal.test.ts
    - src/__tests__/functions/combined.test.ts
  modified:
    - functions/src/index.ts
    - functions/src/pipeline/orchestrator.ts

key-decisions:
  - "StreamCallback imported from lineProducer.ts rather than duplicated -- single source of truth for progress callback type"
  - "A4 (Propuesta de Direccion) is a structured template object with isTemplate:true, not AI prose, per D-07"
  - "Legal fees injected via formatMXNLegal from intake team data (D-15), not from budget output"
  - "Combined pass uses extractPriorDocSummary to cross-reference prior generated documents with 500-char truncation"
  - "runCombinedPass gets 600s timeout (vs 300s for others) due to 8-document generation workload"

patterns-established:
  - "Structured template pattern: generateDirectorTemplate returns { isTemplate: true, sections: [...] } for Word export"
  - "Cross-pass document referencing: extractPriorDocSummary loads prior docs for context injection into combined prompts"
  - "StreamCallback import pattern: all pass handlers import from lineProducer.ts as canonical source"

requirements-completed: [AIGEN-03, AIGEN-04, AIGEN-05, AIGEN-11, LANG-01, LANG-04]

# Metrics
duration: 10min
completed: 2026-03-23
---

# Phase 03 Plan 03: Legal & Combined Passes Summary

**Legal pass with 5 contract documents using formatMXNLegal fee injection, combined pass with 8 synthesis documents including A4 director template and PITCH for corporate CFOs, completing the 4-pass generation pipeline backend**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-23T19:14:47Z
- **Completed:** 2026-03-23T19:25:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Legal pass generates 5 documents (B3-prod, B3-dir, C2b, C3a, C3b) with contract fee amounts from intake team data in legal format ($500,000.00 (quinientos mil pesos 00/100 M.N.))
- Combined pass generates 8 documents (A1, A2, A4, A6, A10, A11, C4, PITCH) synthesizing all prior pass outputs with cross-document referencing
- A4 is a structured Word-compatible template for external director completion (not AI prose)
- PITCH targets corporate CFOs per AIGEN-11 with pitch_contribuyentes document type
- All 4 generation pass Cloud Functions now exported from index.ts (6 total functions)
- 16 integration tests verifying both handlers with mocked Claude client

## Task Commits

Each task was committed atomically:

1. **Task 1: Legal pass with concurrency pool** - `e22abfea` (feat)
2. **Task 2: Combined pass with concurrency pool + Cloud Function exports** - `f2974d55` (feat)

## Files Created/Modified

- `functions/src/pipeline/passes/legal.ts` - Legal pass handler: B3-prod, B3-dir, C2b, C3a, C3b with formatMXNLegal fees
- `functions/src/pipeline/passes/combined.ts` - Combined pass handler: A1, A2, A4, A6, A10, A11, C4, PITCH with prior-output synthesis
- `functions/src/index.ts` - Added runLegalPass (300s) and runCombinedPass (600s) Cloud Function exports
- `functions/src/pipeline/orchestrator.ts` - Added filmografia optional field to TeamMember interface
- `src/__tests__/functions/legal.test.ts` - 7 integration tests for legal pass handler
- `src/__tests__/functions/combined.test.ts` - 9 integration tests for combined pass handler

## Decisions Made

1. **StreamCallback re-export**: Imported `StreamCallback` from `lineProducer.ts` rather than defining a duplicate type, keeping a single canonical source.
2. **A4 template pattern**: `generateDirectorTemplate` returns a structured JSON object with `isTemplate: true` and section placeholders. The frontend will convert this to a Word-compatible template for the director to fill in externally. No AI prose generation for this document.
3. **Legal fee source**: Fee amounts come from `project.team[].honorarios_centavos` (intake data per D-15), formatted via `formatMXNLegal` with word representation. Not derived from budget output.
4. **Cross-pass referencing**: `extractPriorDocSummary` loads first 500 chars of a prior generated doc for context injection, avoiding full-document prompt inflation.
5. **Combined timeout**: 600 seconds (10 minutes) for combined pass since it generates 8 documents -- double the standard 300s pass timeout.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added filmografia field to TeamMember interface**
- **Found during:** Task 2 (Combined pass implementation)
- **Issue:** `combined.ts` maps team members with `filmografia` property but `TeamMember` interface in `orchestrator.ts` did not include it
- **Fix:** Added `filmografia?: unknown[]` as optional field to `TeamMember` interface
- **Files modified:** `functions/src/pipeline/orchestrator.ts`
- **Verification:** `cd functions && npx tsc --noEmit` passes
- **Committed in:** f2974d55

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor type addition to shared interface. No scope creep.

## Known Stubs

None -- all documents fully wired to their data sources and prompt files.

## Issues Encountered

None -- all tasks executed cleanly with passing tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 generation passes implemented: lineProducer (5 docs), financeAdvisor (3 docs), legal (5 docs), combined (8 docs)
- 21 documents total across 4 passes, matching the DOCUMENT_REGISTRY
- Pipeline backend complete -- Plan 04 (Generation UI) can wire frontend controls to these Cloud Functions
- Staleness tracking from Plan 01 ready to integrate with generation triggers

## Self-Check: PASSED

- 4/4 created files verified present
- 2/2 modified files verified present
- 2/2 task commits verified in git history (e22abfea, f2974d55)
- 16/16 tests passing across 2 test files
- Functions TypeScript compiles cleanly
- Frontend build succeeds

---
*Phase: 03-ai-doc-generation*
*Completed: 2026-03-23*
