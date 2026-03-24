---
phase: 06-validation-data-wiring-fix
plan: 01
subsystem: validation
tags: [firestore, validation, data-wiring, useValidation, PERIODOS_EFICINE]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    provides: Validation engine, useValidation hook, engine.ts rules, DocumentUpload component
provides:
  - Corrected Firestore path wiring for metadata, financials, and ERPI in useValidation
  - Correct metadata.periodo_registro read path in DocumentUpload
  - PERIODOS_EFICINE-based date mapping for VALD-04 in engine.ts
affects: [06-validation-data-wiring-fix]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Financial data read from subcollection (projects/{id}/financials/data) not project root"
    - "ERPI settings path uses snake_case collection name (erpi_settings) matching services/erpi.ts"
    - "Period string to close date mapping via PERIODOS_EFICINE constant lookup"

key-files:
  created: []
  modified:
    - src/hooks/useValidation.ts
    - src/components/wizard/DocumentUpload.tsx
    - src/validation/engine.ts

key-decisions:
  - "Financial data subscription reads from projects/{id}/financials/data subcollection document, matching the auto-save write path"
  - "getRegistrationCloseDate falls back to current date when periodo_registro is not in PERIODOS_EFICINE"

patterns-established:
  - "Metadata access pattern: projectData.metadata.* for nested project document fields"
  - "Period-to-date mapping: use PERIODOS_EFICINE constant for close date lookup instead of new Date() parsing"

requirements-completed: [VALD-01, VALD-02, VALD-04, VALD-05, VALD-14, LANG-03]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 06 Plan 01: Validation Data Wiring Fix Summary

**Fixed 5 Firestore path wiring bugs in useValidation, DocumentUpload, and engine.ts that caused validation rules to receive empty data and produce false-green traffic lights**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T23:48:50Z
- **Completed:** 2026-03-24T23:53:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed useValidation to read metadata from correct nested `metadata.*` path instead of document root
- Added new Firestore subscription for `projects/{id}/financials/data` subcollection with proper loading state
- Fixed ERPI settings path from camelCase `erpiSettings/default` to snake_case `erpi_settings/default`
- Fixed DocumentUpload to read periodo_registro from `data.metadata.periodo_registro`
- Added `getRegistrationCloseDate` helper mapping "2026-P1"/"2026-P2" to actual close dates via PERIODOS_EFICINE

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix useValidation Firestore path wiring (Bugs #1, #2, #5)** - `f107e06d` (fix)
2. **Task 2: Fix DocumentUpload periodo path + engine VALD-04 date mapping** - `448166e8` (fix)

## Files Created/Modified
- `src/hooks/useValidation.ts` - Fixed metadata read path, added financials subscription, fixed ERPI path, added financialLoading
- `src/components/wizard/DocumentUpload.tsx` - Fixed periodo_registro to read from data.metadata
- `src/validation/engine.ts` - Added PERIODOS_EFICINE import, getRegistrationCloseDate helper, fixed VALD-04 date mapping

## Decisions Made
- Financial data subscription reads from `projects/{id}/financials/data` subcollection document, matching the auto-save write path used by FinancialStructure wizard screen
- `getRegistrationCloseDate` falls back to `new Date()` when periodo_registro string is not found in PERIODOS_EFICINE constant, ensuring graceful degradation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all data paths are now wired to real Firestore sources.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Data wiring fixes are complete; validation rules now receive real metadata, financial, and ERPI data
- Plans 06-02 and 06-03 can proceed to fix remaining wiring issues (team data extractors, scoring signals)

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 06-validation-data-wiring-fix*
*Completed: 2026-03-24*
