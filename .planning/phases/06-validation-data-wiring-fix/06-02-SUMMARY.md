---
phase: 06-validation-data-wiring-fix
plan: 02
subsystem: validation
tags: [validation, firestore, fee-extraction, erpi, regional-bonus, useValidation]

# Dependency graph
requires:
  - phase: 06-validation-data-wiring-fix
    provides: Corrected Firestore path wiring for metadata, financials, and ERPI in useValidation (Plan 01)
  - phase: 04-validation-dashboard
    provides: Validation engine, useValidation hook, fee cross-match rule (VALD-03), ERPI eligibility rule (VALD-08)
provides:
  - Working fee extractors from budget_output cuentas and team data for VALD-03 cross-match
  - ERPI submission tracking fields (solicitudes_periodo_actual, domicilio_fuera_zmcm) in schema and UI
  - Project submission tracking field (intentos_proyecto) and 5 regional bonus fields in schema and UI
  - Real data reads for submissionsThisPeriod and projectAttempts in ProjectDataSnapshot
affects: [06-validation-data-wiring-fix]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Budget fee extraction navigates cuentas[].partidas[] by numeroCuenta (100/200/300) and concepto string match"
    - "Team data as authoritative contract fee source (D-15 pattern: contracts derive from intake fees)"
    - "Cash flow fees equal budget fees by construction (same pipeline), avoiding redundant extraction"

key-files:
  created: []
  modified:
    - src/hooks/useValidation.ts
    - src/schemas/erpi.ts
    - src/schemas/project.ts
    - src/locales/es.ts
    - src/components/erpi/ERPICompanyForm.tsx
    - src/components/wizard/ProjectSetup.tsx

key-decisions:
  - "Team data (honorarios_centavos) used as contract fee source since contracts are generated from intake fees per D-15"
  - "Cash flow fees derived from budget_output (same pipeline) instead of parsing A9d generated document content"
  - "Budget doc stored as full Record<string, unknown> replacing bare totalCentavos number for fee extraction access"

patterns-established:
  - "Fee extraction from budget_output: account 100=Guionista, 200=Productor, 300=Director"
  - "Submission count read pattern: cast erpiSettings to Record for optional field access"

requirements-completed: [VALD-03, VALD-08, VALD-07, VALD-13]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 06 Plan 02: Validation Data Wiring Fix Summary

**Fee cross-match extractors reading budget_output cuentas and team honorarios, plus ERPI submission tracking and regional bonus schema/UI fields for VALD-03/08/13**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T23:55:11Z
- **Completed:** 2026-03-25T00:01:05Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Replaced 3 stub fee extractors with real implementations: extractFeesFromBudgetOutput navigates cuentas/partidas, extractFeesFromTeamData reads team member honorarios_centavos
- Wired submissionsThisPeriod and projectAttempts from real Firestore data instead of hardcoded 0
- Added solicitudes_periodo_actual and domicilio_fuera_zmcm to ERPI schema with UI inputs in ERPICompanyForm
- Added intentos_proyecto and 5 regional bonus fields to project schema with UI inputs in ProjectSetup
- All Spanish labels sourced from es.ts, all fields auto-save via existing hooks

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement fee extractors and ERPI submission tracking** - `a6e701e4` (feat)
2. **Task 2: Add UI inputs for submission tracking and regional bonus fields** - `70bff297` (feat)

## Files Created/Modified
- `src/hooks/useValidation.ts` - Replaced stub fee extractors with real budget_output and team data readers, wired submission counts from real data
- `src/schemas/erpi.ts` - Added solicitudes_periodo_actual and domicilio_fuera_zmcm fields
- `src/schemas/project.ts` - Added intentos_proyecto and 5 regional bonus fields (director/productor_origen_fuera_zmcm, porcentaje_rodaje/creativo/tecnico)
- `src/locales/es.ts` - Added Spanish labels for all new fields under screen1 and erpi sections
- `src/components/erpi/ERPICompanyForm.tsx` - Added solicitudes_periodo_actual numeric input and domicilio_fuera_zmcm checkbox with schema extension
- `src/components/wizard/ProjectSetup.tsx` - Added regional bonus section with 6 fields (intentos_proyecto, 2 checkboxes, 3 percentage inputs) plus save/hydrate wiring

## Decisions Made
- Team data (honorarios_centavos) used as contract fee source since contracts are generated from intake fees per D-15 pattern
- Cash flow fees derived from budget_output (same pipeline) instead of parsing A9d generated document content separately
- Budget subscription now stores full document (Record<string, unknown>) instead of just totalCentavos, with totalCentavos derived via useMemo

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all fee extractors return real data from budget_output and team members. Submission counts read from Firestore fields.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Fee cross-match (VALD-03) now has working extractors comparing team fees vs budget_output partida fees
- ERPI eligibility (VALD-08) reads real submission counts instead of hardcoded 0
- Regional bonus (VALD-13) has all 6 data fields in schema with UI inputs
- Plan 06-03 can proceed to wire remaining scoring signals and finalize validation data wiring

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 06-validation-data-wiring-fix*
*Completed: 2026-03-24*
