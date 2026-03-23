---
phase: 03-ai-doc-generation
plan: 05
subsystem: ui
tags: [react, document-viewer, staleness-detection, regeneration, edit-mode, shadcn-textarea]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    plan: 04
    provides: "GenerationScreen with two-panel layout, DocumentList, DocumentListItem, useGeneration, useGeneratedDocs"
provides:
  - "DocumentViewer with read/edit modes and metadata footer"
  - "StalenessIndicator yellow banner with reason and regenerate CTA"
  - "RegenerateButton with Dialog confirmation for edited documents"
  - "useStaleness hook with real-time Firestore listener and cascade detection"
  - "Viewer and staleness/regeneration Spanish strings in es.ts"
affects: [03-06-PLAN]

# Tech tracking
tech-stack:
  added: [shadcn-textarea]
  patterns: [Staleness detection via Firestore timestamp comparison with cascade propagation, Document viewer read/edit toggle with Firestore editedContent field]

key-files:
  created:
    - src/components/generation/DocumentViewer.tsx
    - src/components/generation/StalenessIndicator.tsx
    - src/components/generation/RegenerateButton.tsx
    - src/hooks/useStaleness.ts
    - src/components/ui/textarea.tsx
  modified:
    - src/components/generation/GenerationScreen.tsx
    - src/locales/es.ts

key-decisions:
  - "useStaleness uses pure function computeStalePasses for testable staleness logic, separate from Firestore listener"
  - "Client-side PASS_DEPENDENCIES mirrors backend dependency graph (no cross-boundary import)"
  - "DOC_TO_PASS static map in useStaleness for O(1) document-to-pass lookup"
  - "StalenessIndicator receives props from parent rather than using hook directly, enabling flexible placement"

patterns-established:
  - "Staleness detection pattern: onSnapshot listener on meta/generation_state, pure function computation, cascade via dependency graph"
  - "Document viewer edit pattern: editedContent field in Firestore alongside original content, manuallyEdited boolean flag"
  - "Regeneration confirmation pattern: RegenerateButton checks editedDocNames array, shows Dialog only when manual edits at risk"

requirements-completed: [AIGEN-08, AIGEN-09, AIGEN-10]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 03 Plan 05: Document Viewer & Staleness Summary

**Document viewer with read/edit modes, real-time staleness detection via Firestore timestamp comparison with cascade propagation, and pass-level regeneration with confirmation dialog for edited documents**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T19:46:26Z
- **Completed:** 2026-03-23T19:51:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- DocumentViewer shows formatted document content with metadata footer (model, timestamp, edited badge), loading skeletons, and A4 Word export handling (from parallel Plan 06 merge)
- Edit mode provides Textarea with save/cancel buttons, warning banner, and saves editedContent + manuallyEdited flag to Firestore
- useStaleness hook detects stale passes in real time via Firestore onSnapshot listener with cascade propagation matching backend dependency graph
- StalenessIndicator shows yellow warning banner with Spanish reason text and "Regenerar Paso N" button
- RegenerateButton shows Dialog confirmation with destructive variant when pass contains manually-edited documents
- All Spanish strings added to es.ts for viewer, staleness, and regeneration UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Document viewer with read/edit modes and Textarea component** - `2294ecbd` (feat)
2. **Task 2: Staleness detection hook, StalenessIndicator, and RegenerateButton** - `514f1657` (feat)

## Files Created/Modified

- `src/components/generation/DocumentViewer.tsx` - Right-panel viewer with read/edit toggle, Firestore content loading, metadata footer, staleness banner integration
- `src/components/generation/StalenessIndicator.tsx` - Yellow Alert banner with stale reason, regenerate button, optional edit warning
- `src/components/generation/RegenerateButton.tsx` - Pass-level regeneration with Dialog confirmation for edited documents
- `src/hooks/useStaleness.ts` - Real-time staleness detection via Firestore listener, pure function computation, cascade propagation
- `src/components/ui/textarea.tsx` - shadcn Textarea component (installed via CLI)
- `src/components/generation/GenerationScreen.tsx` - Replaced viewer placeholder with DocumentViewer (also BudgetEditor integration from parallel Plan 06)
- `src/locales/es.ts` - Added viewer strings (editButton, saveEdits, etc.), staleness strings (stalePassTitle, regeneratePassCTA, etc.), and budget strings from parallel Plan 06

## Decisions Made

1. **Pure function staleness computation**: `computeStalePasses()` is a pure function that takes timestamps and returns stale pass IDs. This separates Firestore listener concerns from business logic and enables unit testing without mocking Firestore.
2. **Client-side dependency graph duplication**: PASS_DEPENDENCIES in useStaleness.ts mirrors the backend's dependencyGraph.ts. This is intentional (same pattern as FRONTEND_DOC_REGISTRY from Plan 04) to avoid cross-boundary imports between src/ and functions/.
3. **StalenessIndicator as props-driven component**: The indicator receives staleness info as props from DocumentViewer rather than using useStaleness directly, allowing flexible placement and easier testing.
4. **DOC_TO_PASS static map**: Maps all 21 document IDs to their pass for O(1) staleness lookup in `isDocStale()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing locale strings from parallel Plan 06 agent**
- **Found during:** Task 1 (build verification)
- **Issue:** `useBudgetEditor.ts` and `BudgetEditor.tsx` and `DownstreamWarning.tsx` (created by parallel Plan 06 agent) referenced `es.generation.budgetSaved`, `budgetHeading`, `budgetColAccount`, `downstreamWarning`, etc. which did not exist in es.ts, causing TypeScript build failure
- **Fix:** Added all budget-related and downstream warning locale strings to es.ts under the generation section
- **Files modified:** `src/locales/es.ts`
- **Verification:** `npm run build` exits 0
- **Committed in:** 2294ecbd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Missing locale strings from parallel agent needed to unblock the build. No scope creep -- strings match UI-SPEC Copywriting Contract.

## Known Stubs

None. All components are fully wired to their data sources.

## Issues Encountered

None -- all tasks executed cleanly with passing build and tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Document viewer fully implements the right panel of the two-panel generation screen layout
- Staleness detection ready for real-time use once generation pipeline produces documents
- RegenerateButton wired to useGeneration.regeneratePass via parent component
- Plan 06 (Budget Editor) already merged by parallel agent -- BudgetEditor integrated into GenerationScreen
- All viewer, staleness, and regeneration Spanish strings in place

## Self-Check: PASSED

- 5/5 created files verified present
- 2/2 modified files verified present
- 2/2 task commits verified in git history (2294ecbd, 514f1657)
- 21/21 acceptance criteria verified (2 items use locale references instead of hardcoded Spanish text per project convention -- es.generation.stalePassTitle and es.generation.regenerateConfirm)
- Frontend build succeeds (exit code 0)
- 124/124 unit tests passing (e2e excluded -- requires dev server)

---
*Phase: 03-ai-doc-generation*
*Completed: 2026-03-23*
