---
phase: 04-validation-dashboard
plan: 01
subsystem: validation
tags: [typescript, pure-functions, tdd, vitest, eficine-rules, centavos]

# Dependency graph
requires:
  - phase: 01-scaffold-intake
    provides: useCompliance hook, TeamMember/ERPISettings/UploadedDocument schemas, EFICINE constants
  - phase: 03-ai-doc-generation
    provides: GeneratedDocClient type, document generation pipeline output
provides:
  - Severity, ValidationResult, ValidationReport, ProjectDataSnapshot types
  - REQUIRED_DOCUMENTS map (29 entries), PROHIBITED_CATEGORIES (8), EXPIRABLE_DOC_TYPES (5)
  - 10 pure blocker rule functions (VALD-01 through VALD-10)
  - Comprehensive test suite (54 tests)
affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07, 05-export-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-validation-rule-function, skip-pass-fail-status, navigateTo-deep-links]

key-files:
  created:
    - src/validation/types.ts
    - src/validation/constants.ts
    - src/validation/rules/financialReconciliation.ts
    - src/validation/rules/titleConsistency.ts
    - src/validation/rules/feeCrossMatch.ts
    - src/validation/rules/dateCompliance.ts
    - src/validation/rules/eficineCompliance.ts
    - src/validation/rules/documentCompleteness.ts
    - src/validation/rules/experienceThresholds.ts
    - src/validation/rules/erpiEligibility.ts
    - src/validation/rules/fileFormatCompliance.ts
    - src/validation/rules/prohibitedExpenditure.ts
    - src/validation/__tests__/blockerRules.test.ts
  modified: []

key-decisions:
  - "Pure functions with typed params rather than full ProjectDataSnapshot -- keeps each rule focused and independently testable"
  - "TeamMemberLike interface in experienceThresholds instead of importing TeamMember directly -- looser coupling"
  - "NavigateTo type includes screen, fieldId, and memberIndex for precise 'Ir al campo' deep links"

patterns-established:
  - "Pure validation rule: data in, ValidationResult out, no React/Firestore dependencies"
  - "Three-state result: skip (insufficient data), pass, fail -- each with Spanish message from UI-SPEC"
  - "Each rule returns navigateTo pointing to the relevant wizard screen for 'Ir al campo' links"
  - "Centavos integer comparison with strict === (no tolerance) for financial rules"

requirements-completed: [VALD-01, VALD-02, VALD-03, VALD-04, VALD-05, VALD-06, VALD-07, VALD-08, VALD-09, VALD-10]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 04 Plan 01: Blocker Rules Summary

**10 pure TypeScript validation rule functions (VALD-01 through VALD-10) with TDD test suite covering financial reconciliation, title consistency, fee matching, date compliance, EFICINE percentages, document completeness, experience thresholds, ERPI eligibility, file format, and prohibited expenditure**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T14:21:36Z
- **Completed:** 2026-03-24T14:29:35Z
- **Tasks:** 1
- **Files created:** 13

## Accomplishments
- Created shared validation types (Severity, ValidationResult, ValidationReport, ProjectDataSnapshot) and constants (29 required documents, 8 prohibited categories, 5 expirable doc types)
- Implemented all 10 blocker validation rules as pure functions with no React/Firestore dependencies
- Each rule handles three states (skip/pass/fail) with Spanish messages matching the UI-SPEC copywriting contract
- VALD-05 wraps existing calculateCompliance from useCompliance.ts for EFICINE percentage rules
- All rules include navigateTo metadata for "Ir al campo" deep linking to relevant wizard screens
- Comprehensive TDD test suite with 54 test cases across all 10 rules, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create validation types, constants, all 10 blocker rule functions, and test suite** - `47eca72e` (feat)

## Files Created/Modified
- `src/validation/types.ts` - Severity, ValidationStatus, WizardScreenTarget, NavigateTo, ValidationResult, ValidationReport, ProjectDataSnapshot types
- `src/validation/constants.ts` - REQUIRED_DOCUMENTS (29 entries), PROHIBITED_CATEGORIES (8 entries), EXPIRABLE_DOC_TYPES (5 entries)
- `src/validation/rules/financialReconciliation.ts` - VALD-01: golden equation (budget === cashflow === esquema), strict integer centavos
- `src/validation/rules/titleConsistency.ts` - VALD-02: character-identical title across docs, NFC normalization
- `src/validation/rules/feeCrossMatch.ts` - VALD-03: producer/director/screenwriter fee triple-match
- `src/validation/rules/dateCompliance.ts` - VALD-04: 90-day document freshness using differenceInCalendarDays
- `src/validation/rules/eficineCompliance.ts` - VALD-05: wraps calculateCompliance for ERPI/EFICINE percentage rules
- `src/validation/rules/documentCompleteness.ts` - VALD-06: required doc presence check (A-E sections) with conditional E docs
- `src/validation/rules/experienceThresholds.ts` - VALD-07: genre-dependent producer/director experience requirements
- `src/validation/rules/erpiEligibility.ts` - VALD-08: unexhibited projects, submissions, and attempts limits
- `src/validation/rules/fileFormatCompliance.ts` - VALD-09: filename regex, 40MB limit, ASCII-only enforcement
- `src/validation/rules/prohibitedExpenditure.ts` - VALD-10: EFICINE-sourced funds in banned categories
- `src/validation/__tests__/blockerRules.test.ts` - 54 test cases covering all 10 rules (skip, pass, fail, edge cases)

## Decisions Made
- Used pure function signatures with typed params per rule rather than passing full ProjectDataSnapshot -- keeps each rule focused and independently testable
- Created TeamMemberLike interface in experienceThresholds instead of importing full TeamMember -- reduces coupling to schema layer
- NavigateTo type includes screen, fieldId, and memberIndex for precise deep links matching the UI-SPEC "Ir al campo" pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused variable in test file**
- **Found during:** Task 1 (REFACTOR phase)
- **Issue:** TypeScript compilation flagged unused `files` variable in accents test case
- **Fix:** Consolidated test to use single variable name
- **Files modified:** src/validation/__tests__/blockerRules.test.ts
- **Verification:** `npx tsc -b --noEmit` passes for validation files
- **Committed in:** 47eca72e (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial cleanup of test code. No scope creep.

## Known Stubs

None. All 10 rule functions are fully implemented with complete business logic.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 10 blocker rules ready for integration into validation engine orchestrator (Plan 02)
- Types and constants ready for use by warning rules (Plan 03) and dashboard UI (Plan 04-06)
- navigateTo metadata ready for "Ir al campo" deep linking in dashboard components

## Self-Check: PASSED

All 13 created files verified present. Commit 47eca72e verified in git log.

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
