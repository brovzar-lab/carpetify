---
phase: 08-score-estimation-accuracy-fix
plan: 01
subsystem: validation
tags: [scoring, viability, firestore, signals, role-matching]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    provides: "scoring.ts viability module, useValidation.ts hook, ProjectDataSnapshot type"
provides:
  - "Corrected role matching in scoring.ts using CARGOS_EQUIPO values"
  - "7 scoring signals populated from Firestore subscriptions in useValidation.ts"
  - "New screenplay/data subscription for screenplayPagesPerDay derivation"
affects: [validation-dashboard, score-estimation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Document existence as scoring signal proxy (A7 -> safe workplace, A10 -> exhibition signals)"
    - "Month-name counting heuristic for ruta critica monthly detail detection"

key-files:
  created: []
  modified:
    - src/validation/scoring.ts
    - src/validation/__tests__/scoring.test.ts
    - src/hooks/useValidation.ts

key-decisions:
  - "Role names use CARGOS_EQUIPO values ('Productor', 'Director') not gendered forms ('Productor/a', 'Director/a')"
  - "Document existence (A7/A10) used as proxy for content signals since AI prompts enforce required content"
  - "Ruta critica monthly detail detected by counting Spanish month names (>= 3 months = monthly detail)"

patterns-established:
  - "Scoring signal derivation pattern: useMemo hooks before snapshot assembly, wired into dependency array"

requirements-completed: [VALD-15]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 08 Plan 01: Score Estimation Accuracy Fix Summary

**Fixed role name mismatch in viability scoring (Productor/Director vs Productor/a/Director/a) and populated 7 scoring signals from Firestore subscriptions so viability score reflects actual project state**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T12:49:52Z
- **Completed:** 2026-03-25T12:53:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed role name mismatch in scoring.ts: 'Productor/a' -> 'Productor', 'Director/a' -> 'Director' matching CARGOS_EQUIPO constants, so equipo category scores non-zero when team has correct roles
- Populated 7 scoring signals in useValidation.ts from Firestore data: screenplayPagesPerDay (new screenplay/data subscription), budgetHasImprevistos (from budget cuentas), rutaCriticaHasMonthlyDetail (from A8b content), and 4 document-existence proxy signals (A7/A10)
- Updated test fixtures to use correct CARGOS_EQUIPO role values, all 13 scoring tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix role names in scoring.ts and update test fixtures (TDD RED)** - `2439392c` (test)
2. **Task 1: Fix role names in scoring.ts (TDD GREEN)** - `7e4b4d95` (feat)
3. **Task 2: Populate scoring signals in useValidation.ts** - `8bb67236` (feat)

_Note: Task 1 used TDD with separate RED/GREEN commits_

## Files Created/Modified
- `src/validation/scoring.ts` - Fixed 3 role name lookups from 'Productor/a'/'Director/a' to 'Productor'/'Director'
- `src/validation/__tests__/scoring.test.ts` - Updated 7 test fixture role values to match CARGOS_EQUIPO
- `src/hooks/useValidation.ts` - Added screenplay/data subscription, 7 scoring signal derivations, wired into snapshot assembly

## Decisions Made
- Role names use CARGOS_EQUIPO values ('Productor', 'Director') not gendered forms -- matches constants.ts and is what Firestore stores
- A7/A10 document existence used as proxy for content-level signals (safe workplace, spectator estimate, festival strategy, target audience) because the AI prompts enforce inclusion of these sections
- Ruta critica monthly detail detected by counting >= 3 Spanish month names in prose content

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript build errors in unrelated files (pdf templates, validation components, engine tests) -- not caused by this plan's changes, no errors in modified files. Documented but not fixed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Viability scoring now correctly identifies team members and reflects project data signals
- 38-point viability estimate is functional end-to-end from Firestore data through scoring engine
- Ready for any downstream work depending on accurate viability scores

## Self-Check: PASSED

All files verified present, all commits verified in git log.

---
*Phase: 08-score-estimation-accuracy-fix*
*Completed: 2026-03-25*
