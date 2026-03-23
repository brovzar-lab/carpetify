---
phase: 03-ai-doc-generation
plan: 01
subsystem: pipeline
tags: [handlebars, zod, p-limit, claude-api, firestore, budget, staleness, typescript]

# Dependency graph
requires:
  - phase: 02-screenplay-processing
    provides: "Cloud Function patterns, Anthropic SDK, screenplay analysis types"
provides:
  - "21-document registry (DOCUMENT_REGISTRY) mapping all generated docs to passes/sections/prompts"
  - "Handlebars prompt loader with automatic LANG-01/LANG-04 guardrail append"
  - "Claude API client with generateProse and generateStructured methods"
  - "Firestore document store with cross-pass budget data flow (storeBudgetOutputForDownstream/loadBudgetOutput)"
  - "Deterministic budget computation with IMCINE 100-1200 account structure"
  - "Cash flow builder distributing budget across months by production phase"
  - "Financial scheme aggregating funding sources with golden equation"
  - "Staleness tracker with cascade propagation across 4 generation passes"
  - "Concurrency pool (p-limit) for parallel within-pass generation"
  - "Wave 0 test infrastructure: mock Claude client, mock document store, shared fixtures"
affects: [03-02-PLAN, 03-03-PLAN, 03-04-PLAN, 03-05-PLAN, 03-06-PLAN]

# Tech tracking
tech-stack:
  added: [handlebars, zod (functions), date-fns (functions), p-limit, zod-to-json-schema]
  patterns: [Handlebars template compilation, p-limit concurrency pool, pure staleness detection, mock factory test pattern]

key-files:
  created:
    - functions/src/shared/types.ts
    - functions/src/shared/formatters.ts
    - functions/src/pipeline/promptLoader.ts
    - functions/src/pipeline/documentStore.ts
    - functions/src/pipeline/concurrencyPool.ts
    - functions/src/claude/client.ts
    - functions/src/claude/schemas.ts
    - functions/src/financial/budgetComputer.ts
    - functions/src/financial/ratesTables.ts
    - functions/src/financial/cashFlowBuilder.ts
    - functions/src/financial/financialScheme.ts
    - functions/src/staleness/dependencyGraph.ts
    - functions/src/staleness/stalenessTracker.ts
    - src/__tests__/functions/promptLoader.test.ts
    - src/__tests__/functions/budgetComputer.test.ts
    - src/__tests__/functions/stalenessTracker.test.ts
    - src/__tests__/functions/helpers/mockClaudeClient.ts
    - src/__tests__/functions/helpers/fixtures.ts
  modified:
    - functions/package.json

key-decisions:
  - "Zod v4 toJSONSchema instead of zod-to-json-schema for structured Claude outputs (Zod v4 type incompatibility)"
  - "Pure function getStalePasses for staleness detection, Firestore operations separate -- enables unit testing without mocks"
  - "Budget Imprevistos (account 1200) absorbs delta between computed line items and target total cost"
  - "Handlebars strict:false allows partial variable resolution without throwing"

patterns-established:
  - "Handlebars prompt compilation: load raw MD, compile with Handlebars, append guardrail"
  - "Centavos-only arithmetic in financial modules: all amounts as integers, formatMXN only for display"
  - "Cross-pass data flow via Firestore meta documents (budget_output) not AI document parsing"
  - "Mock factory pattern: createMockClaudeClient returns mock + getModuleMock for vi.mock"

requirements-completed: [AIGEN-05, AIGEN-06, AIGEN-07, AIGEN-08, AIGEN-09]

# Metrics
duration: 14min
completed: 2026-03-23
---

# Phase 03 Plan 01: Foundation Layer Summary

**Handlebars prompt loader with language guardrail, IMCINE budget computation (100-1200 accounts), staleness tracking with cascade, and 28 passing tests**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-23T18:54:45Z
- **Completed:** 2026-03-23T19:09:56Z
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments

- 21-document registry mapping all generated documents to their passes, EFICINE sections, content types, and prompt files
- Handlebars-based prompt loader that compiles templates with conditionals/iteration and always appends the language guardrail from politica_idioma.md (LANG-01/LANG-04 enforcement)
- Deterministic budget computation with IMCINE standard 12-account structure (100-1200), centavos arithmetic, and locked intake fees (D-15)
- Staleness tracker with pure-function cascade propagation: if lineProducer goes stale, downstream passes cascade automatically (D-09)
- Wave 0 test infrastructure ready for Plans 02-03 handler integration tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared types, prompt loader, Claude client, document store, concurrency pool** - `9a194f55` (feat)
2. **Task 2: Financial computation module (budget, cash flow, esquema financiero)** - `76c5b644` (feat)
3. **Task 3: Staleness tracking, dependency graph, Wave 0 test infrastructure** - `040b8957` (feat)

## Files Created/Modified

- `functions/src/shared/types.ts` - PassId, DocumentId, GeneratedDocument, GenerationState, DOCUMENT_REGISTRY (21 entries)
- `functions/src/shared/formatters.ts` - formatMXN, formatMXNLegal (with number-to-words), formatDateES, formatMonthYearES
- `functions/src/pipeline/promptLoader.ts` - Handlebars template loader with language guardrail append
- `functions/src/pipeline/documentStore.ts` - Firestore CRUD for generated docs + storeBudgetOutputForDownstream/loadBudgetOutput
- `functions/src/pipeline/concurrencyPool.ts` - p-limit(3) concurrency wrapper for D-04
- `functions/src/claude/client.ts` - Anthropic API wrapper: generateProse, generateStructured with Zod schemas
- `functions/src/claude/schemas.ts` - Zod schemas for budget, cash flow, esquema financiero, ficha tecnica
- `functions/src/financial/budgetComputer.ts` - IMCINE budget computation with 12-account structure
- `functions/src/financial/ratesTables.ts` - IMCINE accounts, Mexican crew rates (2025-2026), fringe percentages
- `functions/src/financial/cashFlowBuilder.ts` - Budget-to-monthly distribution by production phase
- `functions/src/financial/financialScheme.ts` - Funding source aggregation with golden equation reconciliation
- `functions/src/staleness/dependencyGraph.ts` - PASS_DEPENDENCIES static graph + UPSTREAM_PATHS
- `functions/src/staleness/stalenessTracker.ts` - getStalePasses, markPassComplete, getGenerationState, initGenerationState
- `src/__tests__/functions/promptLoader.test.ts` - 8 tests including guardrail verification
- `src/__tests__/functions/budgetComputer.test.ts` - 11 tests: account structure, fee injection, golden equation, formatting
- `src/__tests__/functions/stalenessTracker.test.ts` - 9 tests: dependency graph, cascade detection, null pass handling
- `src/__tests__/functions/helpers/mockClaudeClient.ts` - createMockClaudeClient, createMockDocumentStore factories
- `src/__tests__/functions/helpers/fixtures.ts` - sampleProjectData, sampleBudgetOutput, noopProgress
- `functions/package.json` - Added handlebars, zod, date-fns, p-limit, zod-to-json-schema

## Decisions Made

1. **Zod v4 built-in JSON Schema**: Used `z.toJSONSchema()` instead of `zod-to-json-schema` library due to Zod v4 type incompatibility. The library's types expect Zod v3 internals.
2. **Pure staleness function**: `getStalePasses` is a pure function taking a `TimestampMap` and returning `PassId[]`. Firestore operations are separate functions. This enables unit testing without mocks.
3. **Budget reconciliation via Imprevistos**: When computed line items don't sum to the target project cost, the delta is absorbed by account 1200 (Imprevistos / Contingencia) with a floor of 10% BTL.
4. **Handlebars strict:false**: Allows partial variable resolution without throwing errors, since some prompts have optional sections.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed zod-to-json-schema and handled Zod v4 incompatibility**
- **Found during:** Task 1 (Claude client implementation)
- **Issue:** `zod-to-json-schema` types expect Zod v3 internals; functions/ has Zod v4
- **Fix:** Switched to `z.toJSONSchema()` built into Zod v4 instead
- **Files modified:** `functions/src/claude/client.ts`
- **Verification:** `cd functions && npx tsc --noEmit` passes
- **Committed in:** 9a194f55

**2. [Rule 3 - Blocking] Created budgetComputer and ratesTables early for documentStore compilation**
- **Found during:** Task 1 (documentStore imports BudgetOutput type)
- **Issue:** `documentStore.ts` imports from `../financial/budgetComputer.js` which was planned for Task 2
- **Fix:** Created the full budgetComputer and ratesTables in Task 1 to unblock compilation
- **Files modified:** `functions/src/financial/budgetComputer.ts`, `functions/src/financial/ratesTables.ts`
- **Verification:** Functions TypeScript compiles cleanly
- **Committed in:** 9a194f55

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for compilation. budgetComputer was moved from Task 2 to Task 1 to resolve the import dependency; Task 2 tests still verify it independently.

## Known Stubs

- `functions/src/pipeline/documentStore.ts` line 40: `inputHash: ''` -- TODO comment for computing input hash. Will be implemented when actual generation runs in Plans 02-03. Does not affect plan goal.

## Issues Encountered

None -- all tasks executed cleanly with passing tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All foundation types and utilities ready for Plans 02-03 (handler implementation)
- Mock Claude client and fixtures ready for handler integration tests
- Budget computation can be tested by Plan 02 handler with real intake data
- Staleness tracker ready for Plan 04 frontend integration

## Self-Check: PASSED

- 18/18 created files verified present
- 3/3 task commits verified in git history (9a194f55, 76c5b644, 040b8957)
- 28/28 tests passing across 3 test files
- Functions TypeScript compiles cleanly
- Frontend build succeeds

---
*Phase: 03-ai-doc-generation*
*Completed: 2026-03-23*
