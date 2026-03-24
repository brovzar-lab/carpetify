---
phase: 04-validation-dashboard
plan: 02
subsystem: validation
tags: [typescript, pure-functions, tdd, vitest, warning-rules, date-fns, bonus-points, expiration]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    plan: 01
    provides: ValidationResult type, Severity type, EXPIRABLE_DOC_TYPES constant, validation rule pattern
  - phase: 01-scaffold-intake
    provides: PERIODOS_EFICINE constants, UploadedDocument schema
provides:
  - validateRutaCriticaSync (VALD-11) pure function for timeline vs spending alignment
  - validateHyperlinkAccessibility (VALD-12) pure function for cached link verification
  - validateBonusEligibility (VALD-13) pure function for 4 bonus categories with recommendation
  - BonusCheckInput interface for bonus eligibility input
  - validateDocumentExpiration (VALD-17) pure function with dynamic severity
  - DocExpirationStatus interface for per-doc expiration metadata
affects: [04-04, 04-05, 04-06, 04-07, 05-export-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [dynamic-severity-validation, cached-verification-pattern, bonus-recommendation-priority]

key-files:
  created:
    - src/validation/rules/rutaCriticaSync.ts
    - src/validation/rules/hyperlinkAccessibility.ts
    - src/validation/rules/bonusEligibility.ts
    - src/validation/rules/documentExpiration.ts
    - src/validation/__tests__/warningRules.test.ts
  modified: []

key-decisions:
  - "Dynamic severity for documentExpiration: warning when approaching, blocker when expired (per D-17)"
  - "BonusCheckInput uses flat boolean/number interface from RESEARCH.md -- caller maps team/project data to this shape"
  - "Hyperlink rule reads cached verification status only -- no HTTP requests (per D-12)"
  - "Bonus recommendation follows priority order (a,b,c,d) per scoring rubric"

patterns-established:
  - "Dynamic severity: rule returns blocker OR warning based on data conditions (documentExpiration)"
  - "Cached verification: rule reads pre-computed results rather than performing side effects (hyperlinkAccessibility)"
  - "Recommendation metadata: eligible categories list with recommended first choice (bonusEligibility)"

requirements-completed: [VALD-11, VALD-12, VALD-13, VALD-17]

# Metrics
duration: 9min
completed: 2026-03-24
---

# Phase 04 Plan 02: Warning Rules Summary

**4 warning-level validation rules (ruta critica sync, hyperlink accessibility, bonus eligibility, document expiration) with dynamic severity for expired docs and bonus category recommendation engine**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-24T14:33:20Z
- **Completed:** 2026-03-24T14:42:20Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files created:** 5

## Accomplishments
- Created all 4 warning validation rules as pure functions with no React/Firestore dependencies
- Implemented dynamic severity for document expiration: warning when approaching, blocker when expired (per D-17)
- Bonus eligibility checks all 4 categories (a-d) from scoring_rubric.md with first-eligible recommendation
- Document expiration provides per-doc metadata with daysRemaining and 4-tier status (vigente/proximo/critico/vencido)
- Comprehensive TDD test suite with 33 test cases across all 4 rules, all passing
- All Spanish messages match the UI-SPEC copywriting contract exactly

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests for 4 warning rules** - `d2c5b727` (test)
2. **Task 1 (GREEN): Implement 4 warning rules** - `55fda5ce` (feat)

## Files Created/Modified
- `src/validation/rules/rutaCriticaSync.ts` - VALD-11: stage month overlap check between ruta critica and cash flow
- `src/validation/rules/hyperlinkAccessibility.ts` - VALD-12: cached link verification status check (no HTTP)
- `src/validation/rules/bonusEligibility.ts` - VALD-13: 4 bonus categories (a-d) with BonusCheckInput interface and recommendation
- `src/validation/rules/documentExpiration.ts` - VALD-17: 90-day window check with differenceInCalendarDays, dynamic blocker/warning severity
- `src/validation/__tests__/warningRules.test.ts` - 33 test cases covering skip/pass/fail/edge cases for all 4 rules

## Decisions Made
- Dynamic severity for documentExpiration: returns 'blocker' when any doc is expired, 'warning' otherwise (per D-17: "Expired = strict blocker, no dismissal")
- BonusCheckInput uses a flat boolean/number interface matching RESEARCH.md code example -- the caller is responsible for mapping team/project data to this shape
- Hyperlink rule reads cached verification status only, does NOT make HTTP requests (per D-12: verification happens in the UI component)
- Bonus recommendation follows priority order (a,b,c,d) per scoring rubric -- first eligible category is recommended

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test date calculations for expiration edge cases**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Two test assertions used dates that produced boundary values (exactly 30 days remaining falls into 'proximo', 15 days remaining falls into 'proximo' not 'critico')
- **Fix:** Adjusted test dates to produce correct expected values (35 remaining for pass, 14 remaining for critico)
- **Files modified:** src/validation/__tests__/warningRules.test.ts
- **Verification:** All 33 tests pass
- **Committed in:** 55fda5ce (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test assertions)
**Impact on plan:** Trivial test date adjustment. No scope creep.

## Known Stubs

None. All 4 warning rule functions are fully implemented with complete business logic.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 warning rules ready for integration into validation engine orchestrator (Plan 04-04)
- BonusCheckInput interface ready for mapping in useValidation hook
- Document expiration metadata ready for ExpirationBadge and ExpirationAlert components (Plan 04-06/07)
- Dynamic severity pattern established for rules that can escalate from warning to blocker

## Self-Check: PASSED

All 5 created files verified present. Commits d2c5b727 and 55fda5ce verified in git log.

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
