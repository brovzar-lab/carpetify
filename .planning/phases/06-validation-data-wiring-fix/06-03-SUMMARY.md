---
phase: 06-validation-data-wiring-fix
plan: 03
subsystem: validation
tags: [validation, traffic-light, wizard-sidebar, regional-bonus, useValidation, deriveScreenStatuses]

# Dependency graph
requires:
  - phase: 06-validation-data-wiring-fix
    provides: Corrected Firestore path wiring (Plan 01), fee extractors and regional bonus schema/UI fields (Plan 02)
  - phase: 04-validation-dashboard
    provides: Validation engine, useValidation hook, WizardSidebar screenStatuses prop, TrafficLight component
provides:
  - Per-screen traffic light derivation from validation results via deriveScreenStatuses
  - Regional bonus category (c) data flow from project metadata and ERPI settings to engine
  - screenStatuses field in UseValidationResult consumed by WizardShell
affects: [06-validation-data-wiring-fix]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "deriveScreenStatuses groups ValidationResults by navigateTo.screen then reduces to worst severity"
    - "Metadata spread pattern: spread all metadata fields first, then override with typed core fields for ProjectDataSnapshot"
    - "Engine reads regional fields via type assertion (data.metadata as Record<string, unknown>) for optional field access"

key-files:
  created:
    - src/validation/__tests__/trafficLight.test.ts
  modified:
    - src/hooks/useValidation.ts
    - src/components/wizard/WizardShell.tsx
    - src/validation/engine.ts

key-decisions:
  - "deriveScreenStatuses exported as pure function from useValidation.ts for testability and reuse"
  - "Results without navigateTo default to validacion screen as catch-all"
  - "Metadata spread-then-override pattern ensures regional fields flow through without changing ProjectDataSnapshot type"

patterns-established:
  - "Per-screen status derivation: group by navigateTo.screen, reduce blocker-fail=error > warning-fail=partial > complete"
  - "Metadata pass-through: spread raw Firestore metadata then override typed core fields for type safety"

requirements-completed: [VALD-16, VALD-14, VALD-13]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 06 Plan 03: Per-Screen Traffic Lights and Regional Bonus Wiring Summary

**Per-screen traffic light derivation from validation results with deriveScreenStatuses, plus regional bonus category (c) data flow from project metadata to engine**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T00:03:42Z
- **Completed:** 2026-03-25T00:07:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Implemented deriveScreenStatuses pure function that maps validation results to per-screen traffic light statuses (red/yellow/green)
- Wired WizardShell to pass real screenStatuses from useValidation to WizardSidebar, replacing the old single-screen validacionStatus computation
- Connected 5 regional bonus fields from project metadata and 1 from ERPI settings to the engine's buildBonusInput, enabling VALD-13 category (c) to fire
- Wrote 11 unit tests covering all screen status scenarios (null, empty, blocker, warning, pass, skip, mixed, multi-screen)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement and test deriveScreenStatuses + wire per-screen traffic lights** - `ec12a993` (test RED), `4fde300f` (feat GREEN + wiring)
2. **Task 2: Wire regional bonus fields to engine buildBonusInput + final verification** - `7e614a49` (feat)

## Files Created/Modified
- `src/validation/__tests__/trafficLight.test.ts` - 11 unit tests for deriveScreenStatuses covering all traffic light status scenarios
- `src/hooks/useValidation.ts` - Added deriveScreenStatuses export, screenStatuses in UseValidationResult, metadata spread pattern for regional fields
- `src/components/wizard/WizardShell.tsx` - Replaced manual validacionStatus with screenStatuses from useValidation hook
- `src/validation/engine.ts` - Replaced hardcoded false/0 regional fields with reads from data.metadata and data.erpiSettings

## Decisions Made
- deriveScreenStatuses exported as a pure function from useValidation.ts (not a hook) for direct testability and potential reuse
- Results without navigateTo default to validacion screen as a catch-all, keeping unmapped rules visible
- Metadata spread-then-override pattern ensures regional bonus fields (director_origen_fuera_zmcm, etc.) flow through to the engine without modifying the ProjectDataSnapshot type definition

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all traffic light derivation and regional bonus data paths are fully wired.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 14 validation rules now receive correct data from Firestore after Plans 01+02+03
- Per-screen traffic lights derive from real validation state (not all-yellow defaults)
- Regional bonus category (c) fires when user enters location data in project setup form
- Phase 06 validation data wiring is complete

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 06-validation-data-wiring-fix*
*Completed: 2026-03-24*
