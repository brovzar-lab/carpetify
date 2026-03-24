---
phase: 04-validation-dashboard
plan: 08
subsystem: validation
tags: [typescript, gap-closure, data-wiring, firestore-subscription, traffic-light, team-data]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    plan: 04
    provides: engine.ts with buildBonusInput, extractRutaCriticaStages, extractCashFlowPeriods placeholders
  - phase: 04-validation-dashboard
    plan: 05
    provides: useValidation hook with Firestore subscriptions, WizardShell with WizardSidebar rendering
provides:
  - buildBonusInput reads es_mujer and es_indigena_afromexicano from team array for VALD-13
  - extractRutaCriticaStages parses A8b prose for stage/month data for VALD-11
  - extractCashFlowPeriods reads A9d structured data for production phase months for VALD-11
  - useValidation subscribes to generated/A8b and passes doc content to snapshot
  - WizardShell derives traffic light status from validation report and passes to sidebar
affects: [05-export-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [prose-parsing-extraction, phase-boundary-derivation, validation-status-propagation]

key-files:
  created: []
  modified:
    - src/validation/types.ts
    - src/validation/engine.ts
    - src/hooks/useValidation.ts
    - src/components/wizard/WizardShell.tsx

key-decisions:
  - "Cargo values use actual constants ('Director', 'Guionista', 'Productor') not parenthesized forms from plan interfaces"
  - "Regional bonus fields (c) remain at defaults -- current data model lacks origin/shooting location data"
  - "A8b prose parsing uses 200-char lookahead window after stage name match for month extraction"
  - "Cash flow phase boundaries derived from month count percentages (25%/60%) matching cashFlowBuilder distribution"

patterns-established:
  - "Prose parsing pattern: regex stage detection + nearby month name extraction for unstructured AI-generated text"
  - "Validation status propagation: WizardShell derives TrafficLightStatus from report counts and passes to sidebar via props"

requirements-completed: [VALD-11, VALD-13, VALD-16]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 04 Plan 08: Gap Closure Summary

**Wired 3 verification gaps: sidebar traffic light from validation report, bonus eligibility from team es_mujer/es_indigena_afromexicano, and ruta critica/cash flow extractors from A8b/A9d document content**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T17:59:54Z
- **Completed:** 2026-03-24T18:03:26Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Closed Gap 1 (VALD-16): WizardShell calls useValidation, derives traffic light status (green=no issues, yellow=warnings, red=blockers), passes screenStatuses to both WizardSidebar renders
- Closed Gap 2 (VALD-13): buildBonusInput reads director es_mujer and es_indigena_afromexicano from team array, detects co-direction disqualification scenarios, evaluates creative team qualification for bonus (d)
- Closed Gap 3 (VALD-11): extractRutaCriticaStages parses A8b prose content for production stage/month data; extractCashFlowPeriods reads A9d structured data with phase boundary derivation (25%/60% month split)
- Added A8b Firestore subscription to useValidation hook and wired rutaCriticaDocContent + cashFlowDocContent into ProjectDataSnapshot
- All 122 validation tests pass, TypeScript compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire buildBonusInput and document content extractors in engine.ts** - `699b3d31` (feat)
2. **Task 2: Wire sidebar traffic light and A8b subscription in useValidation/WizardShell** - `20f37699` (feat)

## Files Created/Modified
- `src/validation/types.ts` - Added rutaCriticaDocContent and cashFlowDocContent optional fields to ProjectDataSnapshot
- `src/validation/engine.ts` - Rewrote buildBonusInput to read team data, extractRutaCriticaStages to parse A8b prose, extractCashFlowPeriods to read A9d structured data; added extractStagesFromProse helper and MONTH_NAME_TO_NUMBER constant
- `src/hooks/useValidation.ts` - Added A8b Firestore subscription (#8), rutaCriticaLoading state, rutaCriticaDocContent and cashFlowDocContent in snapshot assembly
- `src/components/wizard/WizardShell.tsx` - Added useValidation import, derives validacionStatus from report, passes screenStatuses={{ validacion: validacionStatus }} to both WizardSidebar renders

## Decisions Made
- Used actual cargo constant values ('Director', 'Guionista', 'Productor') from CARGOS_EQUIPO, not the parenthesized forms mentioned in the plan interfaces -- the plan's interface descriptions said 'Director(a)' but the actual codebase uses 'Director'
- Regional bonus fields (category c) remain at defaults because the current data model does not capture origin location or shooting percentage data. Only categories (a), (b), and (d) are wired from existing team data.
- A8b prose parsing uses a 200-character lookahead window after each stage name match to find nearby month references -- balances between catching relevant months and avoiding false positives from distant text
- Cash flow phase boundaries use 25%/60% of total month count, matching the cashFlowBuilder's distribution logic

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected cargo values from plan interface to actual constants**
- **Found during:** Task 1 (buildBonusInput implementation)
- **Issue:** Plan specified 'Director(a)' and 'Productor(a)' as cargo values, but actual CARGOS_EQUIPO constant uses 'Director', 'Productor', 'Guionista' without parenthesized forms
- **Fix:** Used actual cargo values from src/lib/constants.ts: 'Director', 'Guionista', 'Productor'
- **Files modified:** src/validation/engine.ts
- **Verification:** All 122 tests pass, TypeScript compiles
- **Committed in:** 699b3d31 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in plan specification)
**Impact on plan:** Corrected cargo values to match actual codebase constants. No scope creep.

## Known Stubs

Regional bonus fields in buildBonusInput remain at defaults:
- `directorOrigenFueraZMCM: false` in engine.ts -- no origin location data in schema
- `productorOrigenFueraZMCM: false` in engine.ts -- no origin location data in schema
- `porcentajeRodajeFueraZMCM: 0` in engine.ts -- no shooting location percentage in schema
- `porcentajePersonalCreativoLocal: 0` in engine.ts -- no local personnel percentage in schema
- `porcentajePersonalTecnicoLocal: 0` in engine.ts -- no local personnel percentage in schema
- `erpiDomicilioFueraZMCM: false` in engine.ts -- not extracted from ERPI settings

These are intentional -- the current data model does not capture location/origin data. Category (c) regional decentralization bonus cannot be evaluated until location fields are added to the schema in a future phase. This does NOT prevent the plan's goal from being achieved -- categories (a), (b), and (d) are fully wired.

## Issues Encountered
None.

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- All 3 verification gaps closed -- phase 04 validation dashboard is complete
- All 17/17 truths now verified (previously 14/17)
- 122 validation tests passing
- canExport gating correct (blocker rules only)
- Ready for Phase 05 (export manager) which consumes canExport and validation report

## Self-Check: PASSED

All 4 modified files verified present. Commits 699b3d31 and 20f37699 verified in git log.

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
