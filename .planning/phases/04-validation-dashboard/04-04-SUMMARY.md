---
phase: 04-validation-dashboard
plan: 04
subsystem: validation
tags: [typescript, pure-functions, tdd, vitest, engine-orchestrator, tiered-validation]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    plan: 01
    provides: 10 blocker rule functions (VALD-01 through VALD-10), ValidationResult/ValidationReport/ProjectDataSnapshot types
  - phase: 04-validation-dashboard
    plan: 02
    provides: 4 warning rule functions (VALD-11, VALD-12, VALD-13, VALD-17), BonusCheckInput, LinkCheckInput, StageMonths interfaces
provides:
  - runInstantRules function (12 real-time rules)
  - runMediumRules function (VALD-10 + VALD-11 for document generation events)
  - runAllRules function (all 14 rules for initial load and export gating)
  - INSTANT_RULE_IDS constant (12 entries)
  - MEDIUM_RULE_IDS constant (2 entries)
  - buildReport utility for categorizing results into blockers/warnings/passed/skipped
  - Data mapping functions from ProjectDataSnapshot to individual rule params
affects: [04-05, 04-06, 04-07, 05-export-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [tiered-validation-engine, data-mapping-orchestrator, pure-function-engine]

key-files:
  created:
    - src/validation/engine.ts
    - src/validation/__tests__/engine.test.ts
  modified: []

key-decisions:
  - "Engine is pure: no React, no Firebase, no hooks -- takes ProjectDataSnapshot, returns ValidationReport"
  - "Three entry points per D-11 timing tiers: runInstantRules (12 rules), runMediumRules (2 rules), runAllRules (all 14)"
  - "Data mapping in engine: each rule receives only the specific params it needs, extracted from the snapshot"
  - "Placeholder extractors for links, ruta critica stages, and cash flow periods -- will be wired when UI captures these signals"

patterns-established:
  - "Tiered validation: instant rules fire on every data change, medium rules fire on document generation/edit events"
  - "Engine as orchestrator: maps snapshot fields to individual rule params, runs rules, builds categorized report"
  - "canExport gating: true IFF zero blocker rules have status=fail (warnings never block export)"

requirements-completed: [VALD-14, VALD-16]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 04 Plan 04: Validation Engine Summary

**Central engine orchestrator with three tiered entry points (instant 12 / medium 2 / all 14) mapping ProjectDataSnapshot to 14 rule functions per D-11 timing specification**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T14:55:18Z
- **Completed:** 2026-03-24T15:02:58Z
- **Tasks:** 1 (TDD: RED + GREEN + REFACTOR)
- **Files created:** 2

## Accomplishments
- Created validation engine orchestrator as pure functions with no React/Firebase dependencies
- Implemented three tiered entry points per D-11: runInstantRules (12 rules for real-time), runMediumRules (VALD-10 + VALD-11 for document generation events), and runAllRules (all 14 for initial load and export gating)
- Engine maps ProjectDataSnapshot fields to each rule's specific params via dedicated data mapping functions
- canExport gating logic: true when zero blocker rules fail, regardless of warning count
- Comprehensive TDD test suite with 22 test cases covering all three entry points, tier constants, and report categorization
- All 122 validation tests pass (54 blocker + 33 warning + 13 scoring + 22 engine)

## Task Commits

Each task was committed atomically (TDD flow):

1. **Task 1 (RED): Add failing integration tests** - `11b87a54` (test)
2. **Task 1 (GREEN): Implement engine orchestrator** - `e6760278` (feat)
3. **Task 1 (REFACTOR): Remove unused variables in data mappers** - `1d18114e` (refactor)

## Files Created/Modified
- `src/validation/engine.ts` - Central orchestrator with runInstantRules (12), runMediumRules (2), runAllRules (14), INSTANT_RULE_IDS, MEDIUM_RULE_IDS, buildReport, and data mapping helpers
- `src/validation/__tests__/engine.test.ts` - 22 integration test cases covering tier constants, instant rules, medium rules, all rules, report categorization, and canExport gating

## Decisions Made
- Engine is pure: no React, no Firebase, no hooks -- takes ProjectDataSnapshot, returns ValidationReport. The hook (Plan 05) handles debouncing, caching, and Firestore observation.
- Data mapping in engine: each rule receives only the specific params it needs, extracted from the snapshot via dedicated helper functions (extractPriorProjects, buildDocConditions, buildBonusInput, extractLinks, etc.)
- Placeholder extractors for links (VALD-12), ruta critica stages (VALD-11), and bonus signals (VALD-13) return defaults -- will be wired when UI captures these data signals in future plans.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adjusted test expectations to match actual rule behaviors**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Initial tests expected all rules to return 'skip' on empty snapshot, but VALD-06 (documentCompleteness) correctly returns 'fail' for missing required docs and VALD-13 (bonusEligibility) returns 'fail' when no bonus category is eligible
- **Fix:** Rewrote tests to verify engine orchestration behavior rather than individual rule outcomes: check specific rule IDs skip when data is absent, verify report categorization, and test canExport gating logic
- **Files modified:** src/validation/__tests__/engine.test.ts
- **Verification:** All 22 tests pass
- **Committed in:** e6760278 (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test expectations)
**Impact on plan:** Test expectations adjusted to match the contract established by Plans 01 and 02. No scope creep.

## Known Stubs

The following data mapping functions return placeholder defaults. They are intentional scaffolding for data that will be captured by future UI components:

- `extractLinks()` in engine.ts (line ~153) -- returns `[]`, will be wired when hyperlink verification UI is built
- `extractRutaCriticaStages()` / `extractCashFlowPeriods()` in engine.ts (line ~163/170) -- return `[]`, will be wired from generated document content
- `buildBonusInput()` in engine.ts (line ~125) -- returns defaults for gender/origin/region signals, will be wired when bonus eligibility UI captures these from team data

These stubs do NOT prevent the plan's goal from being achieved. Each returns valid input that causes the corresponding rule to return 'skip' or 'fail' gracefully. Plan 05 (useValidation hook) will wire live data into these mappers.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Engine orchestrator ready for consumption by useValidation hook (Plan 05)
- Three entry points enable tiered validation timing per D-11
- INSTANT_RULE_IDS and MEDIUM_RULE_IDS exported for the hook to determine which rules to run on which events
- canExport flag ready for export gating in Phase 5

## Self-Check: PASSED

All 2 created files verified present. Commits 11b87a54, e6760278, and 1d18114e verified in git log.

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
