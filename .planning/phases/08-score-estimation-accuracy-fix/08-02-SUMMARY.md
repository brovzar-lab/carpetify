---
phase: 08-score-estimation-accuracy-fix
plan: 02
subsystem: api, ui
tags: [firebase, cloud-functions, firestore, react, validation, scoring]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    provides: validation engine, scoring handler, ScoreEstimationPanel, useValidation hook
  - phase: 03-ai-doc-generation
    provides: generated documents A3/A4/A5 in Firestore
provides:
  - estimateScore Cloud Function self-reads A3/A4/A5 content from Firestore (no frontend payload needed)
  - ProjectCard dynamic completion percentage from validation report pass rate
  - Locale-compliant retry button in ScoreEstimationPanel
affects: [score-estimation, dashboard, validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cloud Function data enrichment: wrapper reads Firestore, handler stays pure"
    - "extractProse helper for flexible document content structure (string or {prose})"

key-files:
  created: []
  modified:
    - functions/src/index.ts
    - src/components/dashboard/ProjectCard.tsx
    - src/components/validation/ScoreEstimationPanel.tsx
    - src/locales/es.ts

key-decisions:
  - "Cloud Function wrapper enriches request from Firestore rather than relying on frontend to send document content"
  - "extractProse handles both string content and {prose} structured content for forward compatibility"

patterns-established:
  - "Data enrichment pattern: onCall wrapper reads server-side data, handler receives complete typed request"

requirements-completed: [VALD-15]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 08 Plan 02: Score Estimation Accuracy Fix Summary

**estimateScore Cloud Function self-reads A3/A4/A5 from Firestore, ProjectCard shows real validation pass rate, locale compliance fix**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T12:49:56Z
- **Completed:** 2026-03-25T12:52:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Cloud Function now reads document content (A3, A4, A5) and project metadata from Firestore server-side, so AI persona evaluators receive actual project data instead of empty strings
- ProjectCard completion bar derives percentage from validation report pass rate instead of showing hardcoded 0%
- Hardcoded Spanish string "Reintentar evaluacion" replaced with es.ts locale reference

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Cloud Function to self-read document content from Firestore** - `2439392c` (fix)
2. **Task 2: Fix ProjectCard completion percentage and ScoreEstimationPanel hardcoded string** - `437db628` (fix)

## Files Created/Modified
- `functions/src/index.ts` - estimateScore wrapper reads A3/A4/A5 + metadata from Firestore, builds enriched ScoreEstimationRequest
- `src/components/dashboard/ProjectCard.tsx` - completionPct useMemo from validation report, dynamic progress bar
- `src/components/validation/ScoreEstimationPanel.tsx` - retry button uses es.scoring.retryEvaluation
- `src/locales/es.ts` - added retryEvaluation key to scoring section

## Decisions Made
- Cloud Function wrapper enriches request from Firestore rather than relying on frontend to send document content -- this preserves the clean { projectId } call signature and keeps handler testable
- extractProse handles both string content and { prose: string } structured content -- accommodates both document storage patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in unrelated files (ERPISettingsPage, ExportProgressStep, pdf templates, etc.) cause `npm run build` to fail at the frontend level. None of these errors are in the files modified by this plan. Cloud Functions build passes cleanly. These pre-existing errors are out of scope per deviation rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Score estimation now receives real document content for AI evaluation
- ProjectCard reflects actual validation progress
- All locale strings properly centralized

## Self-Check: PASSED

All files exist. All commits verified (2439392c, 437db628).

---
*Phase: 08-score-estimation-accuracy-fix*
*Completed: 2026-03-25*
