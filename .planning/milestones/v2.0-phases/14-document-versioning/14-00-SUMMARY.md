---
phase: 14-document-versioning
plan: 00
subsystem: testing
tags: [vitest, diff, jsdiff, spanish-prose, d-07, wave-0, test-stubs]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    provides: documentStore.ts saveGeneratedDocument, GeneratedDocument type
provides:
  - Failing test stubs for version snapshot logic (AIGEN-V2-03)
  - Spanish prose diff tests validating D-07 Unicode handling (AIGEN-V2-04)
  - Failing test stubs for revert copy-forward logic (AIGEN-V2-05)
affects: [14-document-versioning]

# Tech tracking
tech-stack:
  added: []
  patterns: [wave-0 test stubs with expect.fail for future plans, D-07 Spanish prose diff validation]

key-files:
  created:
    - src/__tests__/versioning/diffCompute.test.ts
    - src/__tests__/functions/documentStore.test.ts
    - src/__tests__/functions/revertDocument.test.ts
  modified: []

key-decisions:
  - "diff v4.0.4 already available as transitive dependency -- diffCompute tests run as passing GREEN tests rather than import-error RED stubs"
  - "diffWords tokenizes monetary amounts at comma boundaries ($15,000,000 splits at commas) -- test assertions adapted accordingly"

patterns-established:
  - "Wave 0 test stubs: use expect.fail('STUB: implement after Plan XX') for stubs awaiting implementation"
  - "D-07 compliance pattern: test diffWords with full Unicode range (U+00E1 through U+00FC, inverted punctuation)"

requirements-completed: [AIGEN-V2-03, AIGEN-V2-04, AIGEN-V2-05]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 14 Plan 00: Wave 0 Test Stubs Summary

**19 test stubs covering diff computation (7 GREEN with Spanish prose), version snapshots (6 RED), and revert logic (6 RED) for Plans 01-03**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T21:42:19Z
- **Completed:** 2026-03-26T21:46:20Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- D-07 validated: `diffWords` correctly handles all Spanish accented characters (a/e/i/o/u with accent, n with tilde, u with umlaut, inverted question/exclamation marks) without splitting words at Unicode boundaries
- 6 version snapshot test stubs ready for Plan 01 (AIGEN-V2-03): snapshot before overwrite, required fields, prune at 10, batch atomicity, first-save edge case, editedContent priority
- 6 revert test stubs ready for Plan 03 (AIGEN-V2-05): copy-forward as N+1, manual_revert trigger reason, triggeredBy UID, not-found error, invalid docId error, history preservation

## Task Commits

Each task was committed atomically:

1. **Task 1: diffCompute tests with Spanish prose (D-07)** - `24156543` (test)
2. **Task 2: documentStore and revertDocument test stubs** - `52ea387f` (test)

## Files Created/Modified
- `src/__tests__/versioning/diffCompute.test.ts` - 7 tests: Spanish prose diff (5 tests covering word-level changes, accented chars, compound sentences, empty string edges) + JSON diff (2 tests for budget field-level changes)
- `src/__tests__/functions/documentStore.test.ts` - 6 stub tests for saveGeneratedDocument version snapshot behavior (AIGEN-V2-03)
- `src/__tests__/functions/revertDocument.test.ts` - 6 stub tests for revertDocumentVersion Cloud Function (AIGEN-V2-05)

## Decisions Made
- diff v4.0.4 was already installed as a transitive dependency, so diffCompute tests were written as fully passing GREEN tests (not import-error RED stubs). This provides immediate D-07 validation rather than deferring to Plan 02.
- diffWords tokenizes monetary amounts at comma boundaries -- test assertions check individual digit groups rather than full formatted amounts like "$15,000,000".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed diffWords monetary amount assertion**
- **Found during:** Task 1 (diffCompute test writing)
- **Issue:** Plan suggested asserting `removedText.toContain('15,000,000')` but diffWords splits `$15,000,000` at commas into tokens `$`, `15`, `,`, `000`, `,`, `000`. The removed text only contains `15` and `000` as separate tokens.
- **Fix:** Changed assertion to check individual digit groups (`15` -> `18`, `000` -> `500`) which correctly reflects diffWords word-boundary tokenization.
- **Files modified:** `src/__tests__/versioning/diffCompute.test.ts`
- **Verification:** All 7 diffCompute tests pass
- **Committed in:** 24156543 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix in test assertion)
**Impact on plan:** Minimal -- assertion adapted to match actual diffWords tokenization behavior. Test intent preserved.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 test files ready for Plans 01-03 to make pass
- Plan 01 (version storage): 6 stubs in documentStore.test.ts awaiting implementation
- Plan 02 (diff UI): 7 passing tests in diffCompute.test.ts validate diff library works with Spanish prose
- Plan 03 (revert): 6 stubs in revertDocument.test.ts awaiting Cloud Function implementation

## Self-Check: PASSED

- [x] src/__tests__/versioning/diffCompute.test.ts exists
- [x] src/__tests__/functions/documentStore.test.ts exists
- [x] src/__tests__/functions/revertDocument.test.ts exists
- [x] 14-00-SUMMARY.md exists
- [x] Commit 24156543 exists (Task 1)
- [x] Commit 52ea387f exists (Task 2)

---
*Phase: 14-document-versioning*
*Completed: 2026-03-26*
