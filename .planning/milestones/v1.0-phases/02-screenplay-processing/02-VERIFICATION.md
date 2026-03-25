---
phase: 02-screenplay-processing
verified: 2026-03-22T00:00:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 2: Screenplay Processing Verification Report

**Phase Goal:** Upload screenplay PDF -> extract text -> parse structure -> analyze with Claude API -> store structured results in Firestore. Cloud Functions for heavy lifting.
**Verified:** 2026-03-22
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Cloud Functions project initializes, compiles, and can be deployed to Firebase | VERIFIED | `cd functions && npm run build` exits 0; `functions/package.json` has `"type":"module"`, node 22, all four required dependencies |
| 2 | Extraction function reads a PDF from Storage, returns raw text with line breaks preserved and page count | VERIFIED | `extractTextFromPdf` in `functions/src/screenplay/extractText.ts` — pdf-parse v2 class API (`PDFParse.getText()/.getInfo()/.destroy()`), normalization preserves `\n`, returns `{text, numPages, metadata}` |
| 3 | Structure parser identifies scene headers, character names, and location list from raw screenplay text | VERIFIED | `parseScreenplayStructure` uses `SCENE_HEADING_RX`, `CHAR_CUE_RX`, `NOT_A_CHARACTER_RX` — identical to client-side parser; strips parentheticals `(V.O.)` etc. |
| 4 | Parsed breakdown includes scene count, page count, locations with frequency, characters with scene count, INT/EXT breakdown, and DAY/NIGHT breakdown | VERIFIED | `ScreenplayBreakdown` type and `parseScreenplayStructure` return all 7 fields: `num_paginas`, `num_escenas`, `escenas`, `locaciones`, `personajes`, `desglose_int_ext`, `desglose_dia_noche` |
| 5 | Prompt loader resolves prompts from within the functions/ deployment bundle (not repo root) | VERIFIED | `promptLoader.ts` line 22: `path.join(__dirname, '../../prompts', filename)` — two levels up from `lib/utils/` reaches `functions/prompts/`; `firebase.json` predeploy `cp -r prompts "$RESOURCE_DIR/prompts"` confirmed |
| 6 | User clicks 'Analizar guion' and receives structured analysis results from Claude within 30-90 seconds | VERIFIED | `handleAnalyze` in `ScreenplayUpload.tsx` calls `httpsCallable(functions, 'analyzeScreenplay')` and sets `analysisData`/`analysisStatus`; Cloud Function has 540s timeout |
| 7 | Analysis results display shooting day estimates, complexity flags, and last-analyzed timestamp in the right panel | VERIFIED | `AnalysisResults.tsx` renders three estimate cards (`baja`/`media`/`alta`), complexity badges, night percentage, and `lastAnalyzed` timestamp; rendered in `ScreenplayUpload.tsx` when `analysisStatus === 'success' && analysisData` |
| 8 | If analysis fails, user sees error message with retry button after one silent auto-retry | VERIFIED | `analyzeWithClaude.ts` loop runs 2 attempts silently; frontend `ScreenplayUpload.tsx` shows `<Alert variant="destructive">` with `es.screen2.analysisRetryCTA` button on `analysisStatus === 'error'` |
| 9 | When screenplay is re-uploaded after analysis, results show stale warning with 'Reanalizar guion' button | VERIFIED | `extractScreenplay` Cloud Function sets `analysis_stale: true` on Firestore write; frontend renders `<Alert>` with `es.screen2.reanalyzeCTA` button when `data.analysis_stale && analysisStatus === 'success'` |
| 10 | Analysis results are stored in Firestore at projects/{projectId}/screenplay/analysis as structured JSON | VERIFIED | `analyzeHandler.ts` lines 72-78: `analysisRef.set({...analysis, raw_response, analyzed_at, analysis_version: 1})` to path `projects/${projectId}/screenplay/analysis` |
| 11 | analyzeScreenplay Cloud Function writes analysis to Firestore and updates screenplay status | VERIFIED | `analyzeHandler.ts` lines 81-104: updates `screenplay/data` with `screenplay_status: 'analyzed'`, `analysis_stale: false`, `dias_rodaje_estimados`, `complejidad`, `last_analyzed`; error path sets `analysis_error` |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `functions/package.json` | Node.js project with pdf-parse, @anthropic-ai/sdk, firebase-functions, firebase-admin | VERIFIED | All 4 deps present; `"type":"module"`, `"engines":{"node":"22"}` |
| `functions/src/screenplay/types.ts` | TypeScript interfaces for ExtractionResult, ScreenplayBreakdown, ParsedScene, LocationSummary, CharacterSummary, AnalysisResult | VERIFIED | All 8 interfaces present: ExtractionResult, ParsedScene, LocationSummary, CharacterSummary, ScreenplayBreakdown, AnalysisResult, ExtractRequest/Response, AnalyzeRequest/Response |
| `functions/src/screenplay/extractText.ts` | `extractTextFromPdf(pdfBuffer: Buffer): Promise<ExtractionResult>` | VERIFIED | Exports `extractTextFromPdf`, uses pdf-parse v2 class API with text normalization |
| `functions/src/screenplay/parseStructure.ts` | `parseScreenplayStructure(rawText: string, totalPages: number): ScreenplayBreakdown` | VERIFIED | Exports `parseScreenplayStructure`, all three regex constants present, `es_protagonista`, `desglose_int_ext`, `desglose_dia_noche` |
| `functions/src/utils/promptLoader.ts` | `loadPrompt(filename: string, variables: Record<string, string>): string` | VERIFIED | Exports `loadPrompt`, uses `replaceAll`, resolves `../../prompts` (correct two-level path) |
| `functions/src/index.ts` | `extractScreenplay` and `analyzeScreenplay` callable Cloud Function exports | VERIFIED | Both exported via `onCall`; extractScreenplay: 120s/1GiB; analyzeScreenplay: 540s/1GiB/Secret Manager |
| `functions/src/screenplay/analyzeWithClaude.ts` | `analyzeScreenplayWithClaude` calling Anthropic Messages API | VERIFIED | Exports function, imports loadPrompt, calls `analisis_guion.md`, strips code fences, validates schema, retries once |
| `functions/src/screenplay/validateAnalysis.ts` | `validateAnalysisResponse` checking Claude JSON output | VERIFIED | Exports function; checks `complejidad_global` and `estimacion_jornadas.baja/media/alta` required fields |
| `src/components/wizard/AnalysisResults.tsx` | React component displaying Claude analysis output | VERIFIED | Full implementation — 3 estimate cards, complexity badges, night percentage, timestamp; no stubs |
| `src/components/wizard/ScreenplayUpload.tsx` | Updated screen with analysis CTA, loading states, error handling, stale detection | VERIFIED | All states implemented: extracting, loading, error+retry, stale+reanalyze, success badge, analysis results panel |
| `src/schemas/screenplay.ts` | Extended schema with new statuses: extracting, analyzing, analyzed, analysis_error, extraction_error | VERIFIED | All 5 new statuses present plus `analysis_stale`, `last_analyzed`, `raw_text`, `desglose_int_ext`, `desglose_dia_noche` fields |
| `src/__tests__/screenplay/storage.test.ts` | Integration test verifying Firestore write path for analyzeScreenplay | VERIFIED | 4 tests with DI-based fake db, covering analysis doc write, status update, error path, version field |
| `firebase.json` | functions section with source, runtime, predeploy (build + cp -r prompts) | VERIFIED | `"source":"functions"`, `"runtime":"nodejs22"`, predeploy has both tsc build and `cp -r prompts` commands |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `functions/src/index.ts` | `functions/src/screenplay/extractText.ts` | `import extractTextFromPdf` | WIRED | Line 6: `import { extractTextFromPdf } from './screenplay/extractText.js'` |
| `functions/src/index.ts` | `functions/src/screenplay/parseStructure.ts` | `import parseScreenplayStructure` | WIRED | Line 7: `import { parseScreenplayStructure } from './screenplay/parseStructure.js'` |
| `functions/src/index.ts` | `firebase-admin/storage` | `getStorage().bucket().file().download()` | WIRED | Lines 40-42: full download chain in extractScreenplay |
| `functions/src/utils/promptLoader.ts` | `functions/prompts/` | `readFileSync resolving ../../prompts` | WIRED | Line 22: `path.join(__dirname, '../../prompts', filename)` — exact two-level path specified in plan |
| `firebase.json (predeploy)` | `prompts/ -> functions/prompts/` | `cp -r prompts` | WIRED | `"cp -r prompts \"$RESOURCE_DIR/prompts\""` in predeploy array |
| `functions/src/index.ts (analyzeScreenplay)` | `functions/src/screenplay/analyzeHandler.ts` | `import handleAnalyzeScreenplay` | WIRED | Line 8: delegates to `handleAnalyzeScreenplay(projectId, apiKey)` |
| `functions/src/screenplay/analyzeWithClaude.ts` | `functions/src/utils/promptLoader.ts` | `import loadPrompt` | WIRED | Line 2: `import { loadPrompt } from '../utils/promptLoader.js'` |
| `functions/src/screenplay/analyzeWithClaude.ts` | `prompts/analisis_guion.md` | `loadPrompt('analisis_guion.md', ...)` | WIRED | Lines 39-43: calls `loadPrompt('analisis_guion.md', {texto_guion, titulo_proyecto, categoria_cinematografica})` |
| `src/components/wizard/ScreenplayUpload.tsx` | `functions/src/index.ts (analyzeScreenplay)` | `httpsCallable(functions, 'analyzeScreenplay')` | WIRED | Line 237: `httpsCallable(functions, 'analyzeScreenplay')` followed by result handling |
| `src/components/wizard/ScreenplayUpload.tsx` | `functions/src/index.ts (extractScreenplay)` | `httpsCallable(functions, 'extractScreenplay')` | WIRED | Lines 154-158: `httpsCallable(functions, 'extractScreenplay')` called with `{projectId, storagePath}` |
| `src/components/wizard/ScreenplayUpload.tsx` | `src/components/wizard/AnalysisResults.tsx` | renders AnalysisResults when analysis data exists | WIRED | Line 27 import + line 439 conditional render `{analysisStatus === 'success' && analysisData && (<AnalysisResults .../>)}` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCRN-01 | 02-01-PLAN.md | App extracts text from uploaded screenplay PDF preserving structure (scene headers, character names, dialogue) | SATISFIED | `extractTextFromPdf` + `extractScreenplay` Cloud Function downloads PDF from Storage, runs pdf-parse v2, preserves line breaks |
| SCRN-02 | 02-01-PLAN.md | App parses extracted text to identify scene count, page count, locations list, character list, and INT/EXT/DAY/NIGHT breakdown | SATISFIED | `parseScreenplayStructure` produces full `ScreenplayBreakdown`; 12 unit tests pass for all breakdown fields; stored in Firestore `screenplay/data` |
| SCRN-03 | 02-02-PLAN.md | App sends parsed screenplay data to Claude API (via Cloud Function) using the Spanish prompt from `prompts/analisis_guion.md` for deep analysis | SATISFIED | `analyzeScreenplayWithClaude` injects `raw_text` + project metadata into `analisis_guion.md` via `loadPrompt`; `analyzeScreenplay` Cloud Function invokes it; 9 unit tests pass |
| SCRN-04 | 02-02-PLAN.md | App stores screenplay analysis results in Firestore as structured data (not PDF), accessible to downstream generation passes | SATISFIED | `analyzeHandler.ts` writes validated JSON to `projects/{id}/screenplay/analysis` with version field; `AnalysisResult` type exported for Phase 3 |

No orphaned requirements: all SCRN-01 through SCRN-04 were claimed by plans and are satisfied.

---

### Anti-Patterns Found

None detected. Scanned all phase 2 source files for:
- TODO/FIXME/HACK/PLACEHOLDER comments — none found
- Empty return stubs (`return null`, `return {}`, `return []`) — none found
- Console.log-only handler bodies — none found (only error logging in catch blocks)
- Hardcoded empty arrays/objects flowing to render — none found (all state is populated by real Cloud Function responses)

---

### Human Verification Required

The following items cannot be verified programmatically and require human testing:

#### 1. End-to-End Extraction Flow

**Test:** Upload a real Spanish-format screenplay PDF (80-120 pages, digital-native, created in Final Draft or WriterSolo).
**Expected:** Extraction completes within 15-30 seconds; right panel populates with scene count, location list, and character list matching the screenplay; `screenplay_status` shows `parsed`.
**Why human:** Requires real PDF + live Firebase emulator or deployed environment; pdf-parse v2 behavior with real-world PDFs cannot be verified with static analysis.

#### 2. Claude Analysis Call and Response

**Test:** After extraction, click "Analizar guion". Wait up to 90 seconds.
**Expected:** Loading spinner appears; analysis badge appears on success; shooting day estimates display three numbers (baja/media/alta) that are plausible for the screenplay length; complexity badges reflect the actual screenplay content.
**Why human:** Requires a real `ANTHROPIC_API_KEY` in Firebase Secret Manager and live Cloud Function deployment; response quality depends on Claude's output.

#### 3. Stale Warning After Re-upload

**Test:** Upload a screenplay, analyze it, then upload a different screenplay to the same project.
**Expected:** The analysis zone shows a yellow warning ("El analisis puede estar desactualizado") with a "Reanalizar guion" button instead of the success badge.
**Why human:** Requires live Firestore with `analysis_stale: true` being written and read across sessions; state transition involves two Cloud Function calls.

#### 4. Error and Retry Flow

**Test:** Trigger analysis when Claude API key is missing or invalid.
**Expected:** After approximately 2 attempts (silent retry), the UI shows a destructive alert with the error message and a "Reintentar analisis" button. Clicking the button re-triggers the analysis.
**Why human:** Requires intentional API key misconfiguration in a deployed environment; error propagation from Cloud Function through httpsCallable cannot be fully simulated with static analysis.

---

### Build and Test Verification

| Check | Command | Result |
|-------|---------|--------|
| Functions TypeScript build | `cd functions && npm run build` | Exit 0, no errors |
| Frontend React build | `npm run build` | Exit 0, chunk size warning only (not an error) |
| All screenplay unit tests | `npx vitest run src/__tests__/screenplay/` | 28/28 passed (12 parseStructure + 3 extractText + 9 analyzeWithClaude + 4 storage) |
| All task commits present | `git log --oneline` | All 6 commits verified: 87eb3155, bda21d45, 61519546, d6797b5b, 426e696d, 6f09497a |

---

## Summary

Phase 2 goal is achieved. The complete pipeline — PDF upload to Storage, `extractScreenplay` Cloud Function download + pdf-parse v2 text extraction + regex structure parsing + Firestore write, `analyzeScreenplay` Cloud Function reading parsed text + calling Claude API with `analisis_guion.md` prompt injection + JSON validation + Firestore write — is fully implemented, wired, and tested. The frontend `ScreenplayUpload` component calls both Cloud Functions via `httpsCallable`, handles all UI states (extracting, loading, success, error+retry, stale+reanalyze), and renders `AnalysisResults` with shooting day estimates, complexity badges, and timestamp.

The prompt loader correctly resolves `../../prompts` from the compiled `lib/utils/` location, and `firebase.json` predeploy copies `prompts/` into the deployment bundle. All four SCRN requirements are satisfied. No stubs, no empty implementations, no broken wiring detected.

Four items are flagged for human verification (end-to-end with real PDF, live Claude API call, stale state transition, error/retry flow) — standard for Cloud Function integration that cannot be fully exercised without a deployed environment.

---

_Verified: 2026-03-22_
_Verifier: Claude (gsd-verifier)_
