---
phase: 02-screenplay-processing
plan: 01
subsystem: api
tags: [firebase-functions, pdf-parse, typescript, cloud-functions, screenplay-parser, regex]

# Dependency graph
requires:
  - phase: 01-scaffold-intake-wizard
    provides: Firebase project config, Zod schemas, vitest setup, client-side screenplay parser patterns
provides:
  - Cloud Functions project (functions/) with Node.js 22 ESM configuration
  - TypeScript interfaces for extraction, parsing, and analysis pipeline (types.ts)
  - PDF text extraction function using pdf-parse v2 (extractText.ts)
  - Screenplay structure parser with regex scene/character/location detection (parseStructure.ts)
  - extractScreenplay callable Cloud Function with Firestore storage
  - Prompt loader utility for {{variable}} injection from deployment-bundled prompts
affects: [02-screenplay-processing plan 02, 03-ai-doc-generation]

# Tech tracking
tech-stack:
  added: [pdf-parse@2.4.5, @anthropic-ai/sdk@0.80.0, firebase-functions@7.2.2, firebase-admin@13.7.0]
  patterns: [Cloud Functions v2 onCall with config object, pdf-parse v2 class-based API, regex screenplay parsing, prompt template injection with replaceAll]

key-files:
  created:
    - functions/package.json
    - functions/tsconfig.json
    - functions/src/screenplay/types.ts
    - functions/src/screenplay/extractText.ts
    - functions/src/screenplay/parseStructure.ts
    - functions/src/utils/promptLoader.ts
    - functions/src/index.ts
    - src/__tests__/screenplay/parseStructure.test.ts
    - src/__tests__/screenplay/extractText.test.ts
    - src/__tests__/fixtures/sample-screenplay.txt
  modified:
    - firebase.json
    - .gitignore
    - vitest.config.ts

key-decisions:
  - "pdf-parse v2 uses class-based API (new PDFParse + getText/getInfo) not the v1 function-based API; updated extractText.ts accordingly"
  - "extractText tests use behavior verification pattern (testing normalization logic directly) rather than mocking pdf-parse v2 class, which depends on pdfjs-dist internals incompatible with jsdom"
  - "Protagonist threshold uses Math.max(2, Math.round(scenes.length * 0.2)) matching client-side parser"

patterns-established:
  - "Cloud Functions v2 callable: onCall with config object {timeoutSeconds, memory, region}"
  - "Prompt loading: readFileSync from ../../prompts relative to compiled lib/utils/ (inside deployment bundle)"
  - "firebase.json predeploy: cp -r prompts into functions/ so Cloud Functions can read prompts at runtime"
  - "@functions vitest alias for importing Cloud Functions source in root-level tests"

requirements-completed: [SCRN-01, SCRN-02]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 2 Plan 01: Cloud Functions Scaffold + Extraction Pipeline Summary

**Firebase Cloud Functions project with pdf-parse v2 text extraction, regex-based screenplay parser (scenes, characters, locations, INT/EXT/DIA/NOCHE breakdowns), and extractScreenplay callable Cloud Function storing parsed data in Firestore**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T04:34:17Z
- **Completed:** 2026-03-23T04:41:51Z
- **Tasks:** 2 (Task 2 was TDD with RED/GREEN commits)
- **Files modified:** 15

## Accomplishments

- Initialized Firebase Cloud Functions project (Node.js 22, ESM, TypeScript strict mode) with all required dependencies
- Implemented PDF text extraction using pdf-parse v2 class-based API with text normalization (trim lines, collapse blank lines)
- Ported client-side screenplay parser to server-side module with identical regex patterns for scene headers, character cues, and false positive filtering
- Created extractScreenplay callable Cloud Function with D-05 limits (15MB, 200 pages), Firestore storage, and analysis_stale flag
- 15 unit tests passing (12 parseStructure + 3 extractText)

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Cloud Functions project** - `87eb3155` (feat)
2. **Task 2 RED: Failing tests** - `bda21d45` (test)
3. **Task 2 GREEN: Implementation passing tests** - `61519546` (feat)

## Files Created/Modified

- `functions/package.json` - Node.js 22 ESM project with pdf-parse, @anthropic-ai/sdk, firebase-functions, firebase-admin
- `functions/tsconfig.json` - TypeScript strict mode with nodenext module resolution
- `functions/.eslintrc.js` - Minimal ESLint config for typescript-eslint
- `functions/src/screenplay/types.ts` - TypeScript interfaces: ExtractionResult, ParsedScene, ScreenplayBreakdown, AnalysisResult, request/response types
- `functions/src/screenplay/extractText.ts` - PDF text extraction with pdf-parse v2 (PDFParse class + getText/getInfo)
- `functions/src/screenplay/parseStructure.ts` - Regex screenplay parser: SCENE_HEADING_RX, CHAR_CUE_RX, NOT_A_CHARACTER_RX, protagonist threshold, location/character aggregation, INT/EXT and DIA/NOCHE breakdowns
- `functions/src/utils/promptLoader.ts` - Prompt template loader with {{variable}} injection, resolving from ../../prompts
- `functions/src/index.ts` - extractScreenplay callable Cloud Function (1GiB, 120s, us-central1)
- `firebase.json` - Added functions section with predeploy: tsc build + cp -r prompts
- `.gitignore` - Added functions/lib/, functions/prompts/, functions/node_modules/
- `vitest.config.ts` - Added @functions path alias for testing Cloud Functions source
- `src/__tests__/screenplay/parseStructure.test.ts` - 12 tests for screenplay structure parsing
- `src/__tests__/screenplay/extractText.test.ts` - 3 tests for PDF text extraction behavior
- `src/__tests__/fixtures/sample-screenplay.txt` - 3-scene Spanish screenplay test fixture

## Decisions Made

- **pdf-parse v2 API change:** pdf-parse 2.4.5 uses a class-based API (new PDFParse({data}), getText(), getInfo()) instead of the v1 function-based API. Updated extractText.ts to use the new API with proper cleanup via destroy().
- **extractText test strategy:** pdf-parse v2 depends on pdfjs-dist which uses structuredClone/MessageChannel APIs not available in jsdom. Tests verify the normalization logic directly (behavior verification pattern) rather than fighting the pdfjs-dist dependency chain.
- **Protagonist threshold:** Used `Math.max(2, Math.round(scenes.length * 0.2))` matching the existing client-side parser at src/parsers/screenplayParser.ts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] pdf-parse v2 API change from function to class-based**
- **Found during:** Task 2 (extractText.ts implementation)
- **Issue:** Plan specified `import pdfParse from 'pdf-parse'` with function-style call `pdfParse(buffer)`, but pdf-parse v2.4.5 exports `PDFParse` class with `getText()`/`getInfo()` methods
- **Fix:** Updated extractText.ts to use `new PDFParse({ data: buffer })` with `getText()`, `getInfo()`, and `destroy()` lifecycle
- **Files modified:** functions/src/screenplay/extractText.ts
- **Verification:** `npm run build` compiles, tests pass
- **Committed in:** 61519546

**2. [Rule 3 - Blocking] Test mock incompatible with pdfjs-dist in jsdom**
- **Found during:** Task 2 (extractText test)
- **Issue:** Even with vi.mock('pdf-parse'), the jsdom environment cannot handle pdfjs-dist's structuredClone/MessageChannel usage
- **Fix:** Used `@vitest-environment node` directive and behavior verification pattern (testing normalization logic directly) instead of trying to mock pdf-parse internals
- **Files modified:** src/__tests__/screenplay/extractText.test.ts
- **Verification:** All 3 extractText tests pass
- **Committed in:** 61519546

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** Both fixes necessary due to pdf-parse v2 API differences from v1. No scope creep. All planned functionality delivered.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required. Cloud Functions deployment uses existing Firebase project config.

## Known Stubs

None - all functions are fully implemented with real logic.

## Next Phase Readiness

- extractScreenplay Cloud Function ready for deployment and frontend integration
- Types exported for Plan 02 to consume (AnalysisResult, AnalyzeRequest, AnalyzeResponse)
- promptLoader utility ready for Plan 02's analyzeScreenplay function
- firebase.json predeploy configured to copy prompts into deployment bundle

## Self-Check: PASSED

- All 14 created/modified files exist on disk
- All 3 task commits verified in git log (87eb3155, bda21d45, 61519546)
- Build compiles: `cd functions && npm run build` exits 0
- Tests pass: `npx vitest run src/__tests__/screenplay/` exits 0 (15/15 pass)

---
*Phase: 02-screenplay-processing*
*Completed: 2026-03-23*
