---
phase: 02-screenplay-processing
plan: 02
subsystem: api
tags: [anthropic-sdk, claude-api, cloud-functions, firestore, react, screenplay-analysis, dependency-injection]

# Dependency graph
requires:
  - phase: 02-screenplay-processing
    provides: Cloud Functions project, extractScreenplay callable, types.ts (AnalysisResult, AnalyzeRequest/Response), promptLoader utility
provides:
  - analyzeScreenplayWithClaude function calling Anthropic Messages API with prompt injection and retry logic
  - validateAnalysisResponse function checking Claude's JSON output schema
  - handleAnalyzeScreenplay extracted handler with DI for Firestore and FieldValue
  - analyzeScreenplay callable Cloud Function (540s timeout, Secret Manager API key)
  - AnalysisResults React component displaying shooting day estimates and complexity badges
  - Updated ScreenplayUpload with Cloud Function extraction and analysis flow
  - Firebase Functions client initialization (getFunctions)
  - Extended screenplay schema with analyzing/analyzed/analysis_error statuses
affects: [03-ai-doc-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [dependency injection for Cloud Function handler testability, vi.hoisted for mock factories with @functions alias, base-ui tooltip without asChild]

key-files:
  created:
    - functions/src/screenplay/analyzeWithClaude.ts
    - functions/src/screenplay/validateAnalysis.ts
    - functions/src/screenplay/analyzeHandler.ts
    - src/components/wizard/AnalysisResults.tsx
    - src/components/ui/alert.tsx
    - src/__tests__/screenplay/analyzeWithClaude.test.ts
    - src/__tests__/screenplay/storage.test.ts
  modified:
    - functions/src/index.ts
    - src/components/wizard/ScreenplayUpload.tsx
    - src/components/wizard/ScreenplayParsedData.tsx
    - src/schemas/screenplay.ts
    - src/locales/es.ts
    - src/lib/firebase.ts
    - tsconfig.app.json

key-decisions:
  - "Dependency injection pattern for analyzeWithClaude (optional MessagesClient param) and handleAnalyzeScreenplay (optional db/fieldValue params) to avoid mocking firebase-admin and @anthropic-ai/sdk across separate node_modules directories"
  - "vi.hoisted() required for mock factories referencing external variables when vi.mock is hoisted above variable declarations"
  - "Handler logic extracted to analyzeHandler.ts (separate from index.ts onCall wrapper) for direct unit testing without Cloud Functions framework mocking"
  - "base-ui tooltip component uses render-based API not asChild -- adjusted CTA to conditional render instead of wrapped tooltip trigger"
  - "Test files excluded from tsconfig.app.json build to avoid @functions alias resolution errors in tsc (vitest.config.ts handles alias for test execution)"

patterns-established:
  - "Cloud Function handler extraction: onCall wrapper in index.ts delegates to pure handler function in separate file, enabling DI-based testing"
  - "vi.hoisted pattern for mock factories that need external references in @functions alias tests"
  - "Analysis state management: idle/loading/success/error with analysisData and analysisError separate state vars"

requirements-completed: [SCRN-03, SCRN-04]

# Metrics
duration: 13min
completed: 2026-03-23
---

# Phase 2 Plan 02: Claude Analysis Cloud Function + Frontend Analysis UI Summary

**Claude API screenplay analysis via Cloud Function with prompt injection from prompts/analisis_guion.md, JSON response validation, Firestore storage, and frontend analysis CTA with loading/error/stale/success states and shooting day estimate display**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-23T04:45:07Z
- **Completed:** 2026-03-23T04:58:01Z
- **Tasks:** 2 (Task 1 was TDD with RED/GREEN commits)
- **Files modified:** 15

## Accomplishments

- Implemented Claude API analysis function with prompt injection from prompts/analisis_guion.md, code fence stripping, schema validation, and auto-retry on failure (per D-08, D-10, D-14)
- Created analyzeScreenplay callable Cloud Function with 540s timeout, Secret Manager API key, Firestore storage at projects/{id}/screenplay/analysis with version tracking
- Replaced client-side screenplay parser with extractScreenplay Cloud Function call in frontend
- Built complete analysis UI flow: "Analizar guion" CTA, loading spinner with time estimate, success badge, error alert with retry, stale warning with reanalyze button
- Added AnalysisResults component showing shooting day estimates (conservadora/estandar/agresiva), complexity flags as badges, night percentage, and last-analyzed timestamp
- 13 new tests passing (9 analysis function + 4 Firestore storage contract)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests** - `d6797b5b` (test)
2. **Task 1 GREEN: Implementation** - `426e696d` (feat)
3. **Task 2: Frontend wiring** - `6f09497a` (feat)

## Files Created/Modified

- `functions/src/screenplay/analyzeWithClaude.ts` - Calls Anthropic Messages API with prompt injection, code fence stripping, retry logic, optional MessagesClient DI
- `functions/src/screenplay/validateAnalysis.ts` - Validates Claude JSON response (complejidad_global + estimacion_jornadas required fields)
- `functions/src/screenplay/analyzeHandler.ts` - Extracted handler logic with DI for Firestore db and FieldValue, testable without Cloud Functions framework
- `functions/src/index.ts` - Added analyzeScreenplay callable (540s, 1GiB, Secret Manager) delegating to handleAnalyzeScreenplay
- `src/components/wizard/AnalysisResults.tsx` - Displays shooting day estimates (3 cards), complexity badges, night percentage, last-analyzed timestamp
- `src/components/wizard/ScreenplayUpload.tsx` - Replaced client-side parser with Cloud Function calls, added analysis CTA/loading/error/stale/success states
- `src/components/wizard/ScreenplayParsedData.tsx` - Updated manual warning to only show for uploaded/error/extraction_error statuses
- `src/schemas/screenplay.ts` - Extended status enum (extracting, analyzing, analyzed, analysis_error, extraction_error), added analysis_stale, last_analyzed, raw_text, breakdown fields
- `src/locales/es.ts` - Added 30+ new Spanish strings for extraction, analysis, and results UI states
- `src/lib/firebase.ts` - Added getFunctions initialization with us-central1 region
- `src/components/ui/alert.tsx` - shadcn Alert component (installed)
- `tsconfig.app.json` - Excluded src/__tests__ from build to avoid @functions alias errors
- `src/__tests__/screenplay/analyzeWithClaude.test.ts` - 9 tests for API call, prompt injection, code fences, retry, validation
- `src/__tests__/screenplay/storage.test.ts` - 4 tests for Firestore write contract (analysis doc, status update, error path, version)

## Decisions Made

- **Dependency injection over module mocking:** analyzeWithClaude accepts optional MessagesClient, handleAnalyzeScreenplay accepts optional db/fieldValue. This avoids fighting vitest's module resolution across separate node_modules directories (root vs functions/).
- **Handler extraction pattern:** Separated onCall wrapper (index.ts) from core handler logic (analyzeHandler.ts) so Firestore write contract can be tested with fake db injection, no Cloud Functions framework mocking needed.
- **vi.hoisted for mock factories:** vi.mock factories cannot reference variables declared after them due to hoisting. Used vi.hoisted() to create mock functions available during hoisted mock factory execution.
- **base-ui tooltip API:** shadcn base-nova style uses @base-ui/react tooltip which doesn't support asChild prop. Used conditional rendering (canAnalyze ? Button : TooltipProvider wrapping disabled span) instead.
- **Test exclusion from build:** Added `"exclude": ["src/__tests__"]` to tsconfig.app.json since test files use @functions vitest alias not available to tsc.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Anthropic SDK mock not intercepting across node_modules boundaries**
- **Found during:** Task 1 (analyzeWithClaude tests)
- **Issue:** vi.mock('@anthropic-ai/sdk') only intercepts resolution from root node_modules, but production code resolves from functions/node_modules/. Mocked constructor not applied.
- **Fix:** Refactored analyzeWithClaude to accept optional MessagesClient parameter (dependency injection). Tests pass mock client directly instead of trying to mock the SDK module.
- **Files modified:** functions/src/screenplay/analyzeWithClaude.ts, src/__tests__/screenplay/analyzeWithClaude.test.ts
- **Verification:** All 9 analyzeWithClaude tests pass without hitting real API
- **Committed in:** 426e696d

**2. [Rule 3 - Blocking] firebase-admin mock not intercepting for storage tests**
- **Found during:** Task 1 (storage tests)
- **Issue:** vi.mock('firebase-admin/firestore') doesn't intercept resolution from functions/node_modules/firebase-admin/. getFirestore() throws "no app" error.
- **Fix:** Extracted handler logic to analyzeHandler.ts with optional db/fieldValue DI params. Tests pass fake db object directly. Also needed vi.hoisted() for mock variable hoisting.
- **Files modified:** functions/src/screenplay/analyzeHandler.ts (new), functions/src/index.ts, src/__tests__/screenplay/storage.test.ts
- **Verification:** All 4 storage tests pass with fake db injection
- **Committed in:** 426e696d

**3. [Rule 3 - Blocking] TooltipTrigger asChild prop not supported by base-ui**
- **Found during:** Task 2 (frontend build)
- **Issue:** Plan specified TooltipTrigger with asChild prop, but shadcn base-nova uses @base-ui/react which doesn't support asChild on tooltip triggers.
- **Fix:** Used conditional rendering: canAnalyze renders plain Button, !canAnalyze renders TooltipProvider wrapping a disabled trigger span.
- **Files modified:** src/components/wizard/ScreenplayUpload.tsx
- **Verification:** npm run build exits 0
- **Committed in:** 6f09497a

**4. [Rule 3 - Blocking] Test files failing tsc build due to @functions alias**
- **Found during:** Task 2 (frontend build verification)
- **Issue:** tsconfig.app.json includes src/ which includes src/__tests__/, but @functions alias is only in vitest.config.ts. tsc reports "Cannot find module @functions/..."
- **Fix:** Added `"exclude": ["src/__tests__"]` to tsconfig.app.json
- **Files modified:** tsconfig.app.json
- **Verification:** npm run build exits 0, vitest still runs tests via its own config
- **Committed in:** 6f09497a

---

**Total deviations:** 4 auto-fixed (4 blocking issues)
**Impact on plan:** All fixes necessary due to vitest module resolution boundaries and base-ui API differences. Dependency injection pattern is actually superior to module mocking for these tests. No scope creep -- all planned functionality delivered.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

**Anthropic API Key:** Before deploying the analyzeScreenplay Cloud Function, the ANTHROPIC_API_KEY must be set in Firebase Secret Manager:
```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# Paste key from console.anthropic.com when prompted
```

## Known Stubs

None - all functions are fully implemented with real logic.

## Next Phase Readiness

- analyzeScreenplay Cloud Function ready for deployment (requires ANTHROPIC_API_KEY in Secret Manager)
- Analysis results stored as structured JSON in Firestore at projects/{id}/screenplay/analysis
- AnalysisResult type exported for Phase 3 consumption (datos_generales, desglose_escenas, locaciones_unicas, personajes_detalle, complejidad_global, estimacion_jornadas)
- promptLoader utility proven working for {{variable}} injection from prompts/
- Frontend complete: upload -> extraction -> review/correct -> analyze -> results display
- Phase 2 (screenplay-processing) is now complete -- ready for Phase 3 (validation engine or AI doc generation)

## Self-Check: PASSED

- All 14 created/modified files exist on disk
- All 3 task commits verified in git log (d6797b5b, 426e696d, 6f09497a)
- Build compiles: `cd functions && npm run build` exits 0
- Build compiles: `npm run build` exits 0
- Tests pass: `npx vitest run src/__tests__/screenplay/` exits 0 (28/28 pass)

---
*Phase: 02-screenplay-processing*
*Completed: 2026-03-23*
