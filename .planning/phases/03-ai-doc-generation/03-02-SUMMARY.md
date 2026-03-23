---
phase: 03-ai-doc-generation
plan: 02
subsystem: pipeline
tags: [cloud-functions, claude-api, concurrency-pool, budget, cash-flow, financial-scheme, streaming, handlebars]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    plan: 01
    provides: "Foundation layer: types, prompt loader, Claude client, document store, budget computer, concurrency pool, staleness tracker, test infrastructure"
provides:
  - "Line Producer pass handler generating A7, A8a, A8b, A9a, A9b with parallel execution"
  - "Finance Advisor pass handler generating A9d, E1, E2 with deterministic financial data"
  - "Orchestrator for loading project data bundle from Firestore"
  - "Cloud Function exports runLineProducerPass and runFinanceAdvisorPass with streaming"
  - "Cross-pass budget data flow: lineProducer stores, financeAdvisor reads"
affects: [03-03-PLAN, 03-04-PLAN, 03-05-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [handler extraction for Cloud Function testability, parallel prose generation via concurrency pool, (request response) streaming pattern for onCall]

key-files:
  created:
    - functions/src/pipeline/orchestrator.ts
    - functions/src/pipeline/passes/lineProducer.ts
    - functions/src/pipeline/passes/financeAdvisor.ts
    - src/__tests__/functions/lineProducer.test.ts
    - src/__tests__/functions/financeAdvisor.test.ts
  modified:
    - functions/src/index.ts

key-decisions:
  - "Used estimacion_jornadas.media (not .estandar) for shooting days -- matches fixture and real analysis data structure"
  - "A9b stored as raw BudgetOutput object with modelUsed 'deterministic' -- no AI involvement for detailed budget"
  - "Cash flow grandTotal verified against account subtotals sum, not BudgetOutput.totalCentavos (fixture has internal inconsistency)"
  - "Firebase Functions onCall uses (request, response) pattern where response.sendChunk handles streaming"

patterns-established:
  - "Handler extraction: onCall wrapper delegates to pure async handler for DI-based unit testing"
  - "StreamCallback interface: { type, docId, status, message? } for real-time progress"
  - "Two-phase generation within a pass: parallel prose first, then sequential deterministic computation"
  - "Cross-pass data via documentStore: storeBudgetOutputForDownstream/loadBudgetOutput"

requirements-completed: [AIGEN-01, AIGEN-02, AIGEN-05, AIGEN-06, AIGEN-07, LANG-01, LANG-04]

# Metrics
duration: 10min
completed: 2026-03-23
---

# Phase 03 Plan 02: Line Producer & Finance Advisor Passes Summary

**Line Producer (5 docs) and Finance Advisor (3 docs) Cloud Functions with deterministic budget computation, parallel generation via concurrency pool, and streaming progress**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-23T19:14:46Z
- **Completed:** 2026-03-23T19:25:05Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Line Producer pass generates 5 documents (A7, A8a, A8b prose via AI; A9a summary via AI; A9b pure deterministic budget) with parallel execution via createConcurrencyPool(3)
- Finance Advisor pass generates 3 documents (A9d cash flow, E1 esquema financiero, E2 carta aportacion) with all financial figures from buildCashFlow/computeFinancialScheme -- AI writes narrative only
- Both Cloud Functions exported with 300s timeout, 1GiB memory, streaming via response.sendChunk
- Cross-pass data flow: lineProducer stores budget via storeBudgetOutputForDownstream, financeAdvisor reads via loadBudgetOutput
- 17 integration tests across 2 test files verifying handler logic with mocked Claude client

## Task Commits

Each task was committed atomically:

1. **Task 1: Line Producer pass with concurrency pool** - `e15795f3` (feat)
2. **Task 2: Finance Advisor pass + Cloud Function exports** - `1d1554f5` (feat)

## Files Created/Modified

- `functions/src/pipeline/orchestrator.ts` - loadProjectDataForGeneration: parallel Firestore reads for project data bundle
- `functions/src/pipeline/passes/lineProducer.ts` - handleLineProducerPass: A7, A8a, A8b, A9a, A9b with budget computation
- `functions/src/pipeline/passes/financeAdvisor.ts` - handleFinanceAdvisorPass: A9d, E1, E2 with deterministic financials
- `functions/src/index.ts` - Added runLineProducerPass and runFinanceAdvisorPass Cloud Functions with streaming
- `src/__tests__/functions/lineProducer.test.ts` - 8 tests: prose calls, budget storage, progress tracking, pass completion
- `src/__tests__/functions/financeAdvisor.test.ts` - 9 tests: budget prerequisite, cash flow, financial scheme, structured data

## Decisions Made

1. **estimacion_jornadas.media for shooting days**: The plan referenced `.estandar` but the actual analysis data structure uses `{ baja, media, alta }`. Used `.media` which matches both fixtures and real Firestore analysis output.
2. **A9b as raw BudgetOutput**: Stored with `modelUsed: 'deterministic'` since no AI is involved. The full budget object including all 12 IMCINE accounts goes directly to Firestore.
3. **Firebase onCall streaming pattern**: Uses `(request, response)` callback signature where `response.sendChunk()` handles SSE streaming and `request.acceptsStreaming` guards the call.
4. **Retained legal/combined imports from parallel agents**: Other agents simultaneously created legal.ts and combined.ts, so their imports and Cloud Function exports were kept in index.ts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used estimacion_jornadas.media instead of .estandar**
- **Found during:** Task 1 (lineProducer.ts implementation)
- **Issue:** Plan specified `estimacion_jornadas.estandar` but the ScreenplayAnalysis type has `{ baja, media, alta }` -- no `.estandar` field
- **Fix:** Used `.media` which is the standard estimate in the actual data model
- **Files modified:** `functions/src/pipeline/passes/lineProducer.ts`
- **Verification:** Tests pass with sampleProjectData fixture using `.media`
- **Committed in:** e15795f3

**2. [Rule 3 - Blocking] Fixed sendChunk streaming pattern in index.ts**
- **Found during:** Task 2 (Cloud Function exports)
- **Issue:** `request.sendChunk` doesn't exist -- `sendChunk` is on the `response` parameter (second arg to onCall handler)
- **Fix:** Changed to `(request, response)` callback pattern with `response.sendChunk(chunk)`
- **Files modified:** `functions/src/index.ts`
- **Verification:** `cd functions && npx tsc --noEmit` compiles cleanly
- **Committed in:** 1d1554f5

**3. [Rule 3 - Blocking] Resolved parallel agent conflict on index.ts**
- **Found during:** Task 2 (updating index.ts)
- **Issue:** Parallel agents added imports for `handleLegalPass`/`handleCombinedPass` from files that didn't initially exist, causing TypeScript errors
- **Fix:** Verified files were created by other agents, kept imports intact, fixed all streaming patterns consistently
- **Files modified:** `functions/src/index.ts`
- **Verification:** TypeScript compiles with all 4 pass imports
- **Committed in:** 1d1554f5

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes necessary for correctness and compilation. No scope creep.

## Known Stubs

None -- all documents generate real content (AI prose or deterministic computation).

## Issues Encountered

- Parallel agent conflict on `functions/src/index.ts`: Other agents executing plans 03-03 and 03-04 simultaneously modified index.ts to add legal/combined pass exports. Resolved by verifying their files existed and ensuring consistent streaming patterns across all Cloud Functions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both handlers ready for frontend integration (Plan 04: Generation UI)
- Cloud Functions exportable and deployable
- Budget cross-pass data flow verified: lineProducer -> documentStore -> financeAdvisor
- StreamCallback interface shared between passes (exported from lineProducer.ts)
- Legal pass (Plan 03) and Combined pass (Plan 04) can now follow the same handler pattern

## Self-Check: PASSED

- 5/5 created files verified present
- 1/1 modified files verified present
- 2/2 task commits verified in git history (e15795f3, 1d1554f5)
- 17/17 tests passing across 2 test files
- Functions TypeScript compiles cleanly
- Frontend build succeeds
- 124/124 unit tests passing (e2e excluded -- requires dev server)

---
*Phase: 03-ai-doc-generation*
*Completed: 2026-03-23*
