---
phase: 03-ai-doc-generation
plan: 04
subsystem: ui
tags: [react, generation-ui, pipeline-progress, streaming, document-list, eficine-sections, shadcn-progress]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    plan: 02
    provides: "Line Producer and Finance Advisor Cloud Functions with streaming (runLineProducerPass, runFinanceAdvisorPass)"
  - phase: 03-ai-doc-generation
    plan: 03
    provides: "Legal and Combined Cloud Functions with streaming (runLegalPass, runCombinedPass)"
provides:
  - "Generation screen at /project/:projectId/generacion with wizard sidebar integration"
  - "PipelineControl CTA button with running/partial-failure/idle states"
  - "PipelineProgress real-time display with per-pass and per-document tracking via streaming"
  - "DocumentList with 21 documents organized by EFICINE section (A, B, C, E, EXTRA)"
  - "Generation service (runPass, runFullPipeline) wrapping 4 Cloud Functions with httpsCallable().stream()"
  - "useGeneration hook with pipeline state management and resume-from-pass support"
  - "useGeneratedDocs hook with real-time Firestore listener for generated documents"
  - "All Spanish UI strings for generation screen in es.ts"
affects: [03-05-PLAN, 03-06-PLAN]

# Tech tracking
tech-stack:
  added: [shadcn-progress]
  patterns: [Firebase httpsCallable().stream() for real-time progress, PassProgress state pattern with per-document tracking, EFICINE section grouping for document organization]

key-files:
  created:
    - src/components/generation/GenerationScreen.tsx
    - src/components/generation/PipelineControl.tsx
    - src/components/generation/PipelineProgress.tsx
    - src/components/generation/DocumentList.tsx
    - src/components/generation/DocumentListItem.tsx
    - src/services/generation.ts
    - src/hooks/useGeneration.ts
    - src/hooks/useGeneratedDocs.ts
    - src/components/ui/progress.tsx
  modified:
    - src/stores/wizardStore.ts
    - src/components/wizard/WizardShell.tsx
    - src/components/wizard/WizardSidebar.tsx
    - src/locales/es.ts

key-decisions:
  - "WizardShell has dedicated layout for generation screen (no padding wrapper, flex column) to support two-panel layout"
  - "Generation sidebar item separated from intake screens with shadcn Separator per UI-SPEC"
  - "Frontend document registry is a static array mirroring backend DOCUMENT_REGISTRY (no cross-boundary import)"
  - "useGeneration tracks PASS_DOCS map (docs per pass) for progress state without querying backend"
  - "Viewer panel is intentional placeholder for Plan 05 (document viewer implementation)"

patterns-established:
  - "Firebase streaming callable pattern: httpsCallable<Req, Res, Stream>().stream() for real-time progress"
  - "PassProgress state pattern: Record<PassId, { status, docs[], completedCount }> for UI tracking"
  - "EFICINE section grouping: SECTION_ORDER ['A','B','C','E','EXTRA'] with FRONTEND_DOC_REGISTRY for display organization"
  - "Generation screen layout: dedicated WizardShell branch with flex column, no auto-save indicator"

requirements-completed: [AIGEN-08, AIGEN-10, LANG-01]

# Metrics
duration: 14min
completed: 2026-03-23
---

# Phase 03 Plan 04: Generation UI Summary

**Frontend generation screen with real-time pipeline progress via Firebase streaming, document list organized by EFICINE section, and wizard sidebar integration for triggering and monitoring the 4-pass document generation pipeline**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-23T19:28:19Z
- **Completed:** 2026-03-23T19:43:05Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Generation screen accessible at /project/:projectId/generacion via wizard sidebar "Generacion" entry with visual separator from intake screens
- "Generar carpeta" CTA button triggers full 4-pass pipeline with streaming progress, supports "Continuar desde Paso N" for partial failure resume
- PipelineProgress shows real-time pass-by-pass tracking with per-document status, progress bars, auto-collapse after 5s on completion
- DocumentList shows all 21 documents organized by EFICINE section (A: 12 docs, B: 2, C: 4, E: 2, EXTRA: 1) with status dots, badges, and active highlight
- Generation service wraps 4 Cloud Functions via httpsCallable().stream() for real-time progress streaming
- useGeneration hook manages full pipeline state with startPipeline, regeneratePass, and passProgress tracking
- useGeneratedDocs hook provides real-time Firestore listener for the generated subcollection
- All Spanish strings from UI-SPEC Copywriting Contract added to es.ts (21 document names, pipeline labels, error messages)

## Task Commits

Each task was committed atomically:

1. **Task 1: Route integration, sidebar, Spanish strings, and Progress component** - `3b0bcce5` (feat)
2. **Task 2: Generation service, useGeneration hook, and useGeneratedDocs hook** - `f47db6ec` (feat)
3. **Task 3: GenerationScreen, PipelineControl, PipelineProgress, DocumentList, DocumentListItem** - `ea94ffd0` (feat)

## Files Created/Modified

- `src/components/generation/GenerationScreen.tsx` - Main generation screen with two-panel layout (doc list + viewer placeholder)
- `src/components/generation/PipelineControl.tsx` - "Generar carpeta" CTA with idle/running/partial-failure states
- `src/components/generation/PipelineProgress.tsx` - Real-time pipeline progress with pass expansion, doc status, auto-collapse
- `src/components/generation/DocumentList.tsx` - Left panel (320px) with 21 docs grouped by EFICINE section using ScrollArea
- `src/components/generation/DocumentListItem.tsx` - Doc item with EFICINE ID badge, status dot, active highlight, edit indicator
- `src/services/generation.ts` - Client-side Firebase callable wrappers with streaming (runPass, runFullPipeline)
- `src/hooks/useGeneration.ts` - Pipeline state hook with progress tracking and resume support
- `src/hooks/useGeneratedDocs.ts` - Firestore real-time listener for generated documents
- `src/components/ui/progress.tsx` - shadcn Progress component (installed via CLI)
- `src/stores/wizardStore.ts` - Added 'generacion' to WizardScreen type
- `src/components/wizard/WizardShell.tsx` - Added GenerationScreen import, renderScreen case, dedicated layout
- `src/components/wizard/WizardSidebar.tsx` - Added "Generacion" sidebar item with Separator
- `src/locales/es.ts` - Added wizard.screen6 and full generation section with all Spanish strings

## Decisions Made

1. **Dedicated WizardShell layout for generation**: The generation screen manages its own layout (flex column, no padding wrapper) unlike other wizard screens, because the two-panel layout with pipeline progress needs full height control.
2. **Static frontend document registry**: FRONTEND_DOC_REGISTRY duplicates the backend's DOCUMENT_REGISTRY as a static array to avoid cross-boundary imports between src/ and functions/. This is intentional per project conventions.
3. **PASS_DOCS map in useGeneration**: The hook tracks which docs belong to each pass locally rather than querying the backend, enabling immediate progress state updates during streaming.
4. **Viewer panel placeholder**: The right panel shows "Selecciona un documento" placeholder text. Document viewer is explicitly scoped for Plan 05.
5. **Static import for runPass**: Fixed Vite dynamic import warning by using static import in useGeneration instead of `await import()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed dynamic import warning in useGeneration**
- **Found during:** Task 3 (build verification)
- **Issue:** useGeneration used `const { runPass } = await import('@/services/generation')` which triggered a Vite INEFFECTIVE_DYNAMIC_IMPORT warning since generation.ts was also statically imported by other components
- **Fix:** Changed to static import of runPass at module level
- **Files modified:** `src/hooks/useGeneration.ts`
- **Verification:** Build passes without warning
- **Committed in:** ea94ffd0

**2. [Rule 3 - Blocking] Added dedicated WizardShell layout for generation screen**
- **Found during:** Task 3 (GenerationScreen implementation)
- **Issue:** The default WizardShell layout wraps content in `<div className="relative p-8">` which prevents the generation screen's two-panel flex layout from filling available height
- **Fix:** Added early return in WizardShell for generation screen with dedicated flex column layout (no padding wrapper)
- **Files modified:** `src/components/wizard/WizardShell.tsx`
- **Verification:** Generation screen fills full height, build passes
- **Committed in:** ea94ffd0

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for correct UI rendering and clean builds. No scope creep.

## Known Stubs

- **Viewer panel placeholder** (`src/components/generation/GenerationScreen.tsx`, line 76): The right panel shows "Selecciona un documento" / "Cargando documento..." text. This is intentional -- document viewer is scoped for Plan 05.

## Issues Encountered

None -- all tasks executed cleanly with passing build and tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 generation components built and integrated into the wizard flow
- Generation service ready to invoke the 4 Cloud Functions built in Plans 02-03
- useGeneration hook provides complete pipeline state management for UI consumption
- useGeneratedDocs hook wired to Firestore for real-time document list updates
- Plan 05 (Document Viewer) can implement the viewer panel in the right side of the two-panel layout
- Plan 06 (Budget Editor) can implement the A9b special view referenced in DocumentListItem

## Self-Check: PASSED

- 9/9 created files verified present
- 4/4 modified files verified present
- 3/3 task commits verified in git history (3b0bcce5, f47db6ec, ea94ffd0)
- Frontend build succeeds
- 124/124 unit tests passing (e2e excluded -- requires dev server)

---
*Phase: 03-ai-doc-generation*
*Completed: 2026-03-23*
