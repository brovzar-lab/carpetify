---
phase: 14-document-versioning
plan: 01
subsystem: pipeline
tags: [firestore, versioning, subcollection, document-generation, batch-write, prune]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    provides: saveGeneratedDocument, GeneratedDocument type, 4-pass pipeline
  - phase: 14-document-versioning
    provides: Wave 0 test stubs for version snapshot logic (plan 00)
provides:
  - DocumentVersion interface and VersionTriggerReason type in shared/types.ts
  - Pre-save snapshot logic in saveGeneratedDocument with 10-version prune
  - triggeredBy userId threaded through all 4 pass handlers to saveGeneratedDocument
affects: [14-document-versioning]

# Tech tracking
tech-stack:
  added: []
  patterns: [pre-save snapshot to Firestore subcollection before overwrite, batched write for atomic archive+prune, optional trailing parameters for backward compatibility]

key-files:
  created: []
  modified:
    - functions/src/shared/types.ts
    - functions/src/pipeline/documentStore.ts
    - functions/src/pipeline/passes/lineProducer.ts
    - functions/src/pipeline/passes/financeAdvisor.ts
    - functions/src/pipeline/passes/legal.ts
    - functions/src/pipeline/passes/combined.ts
    - functions/src/index.ts

key-decisions:
  - "triggeredBy and triggerReason added as optional trailing parameters to preserve backward compatibility with any callers not yet updated"
  - "Version prune threshold is >= 10 (not > 10) to maintain exactly 10 max versions per D-04"

patterns-established:
  - "Pre-save snapshot pattern: read existing doc, archive to subcollection, then overwrite -- guarantees no version loss"
  - "Batched write for archive + prune: batch.set(new version) + batch.delete(oldest) committed atomically per D-04"

requirements-completed: [AIGEN-V2-03]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 14 Plan 01: Version Snapshot Infrastructure Summary

**Pre-save document snapshot to Firestore subcollection with 10-version prune and userId threading across all 21 generation callsites**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T21:48:51Z
- **Completed:** 2026-03-26T21:53:33Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- DocumentVersion interface and VersionTriggerReason type exported from shared/types.ts for downstream consumers (Plans 02, 03)
- saveGeneratedDocument now snapshots existing document content to `projects/{projectId}/generated/{docId}/versions/{versionNumber}` before every overwrite
- 10-version pruning via Firestore batched write ensures archive + prune happen atomically (D-04)
- All 21 saveGeneratedDocument calls across 4 pass handlers (lineProducer: 5, financeAdvisor: 3, legal: 5, combined: 8) thread triggeredBy userId and triggerReason
- All 4 Cloud Function callsites in index.ts pass authenticated uid to pass handlers
- Cloud Functions project compiles cleanly with zero new errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DocumentVersion type and pre-save snapshot with prune** - `29920e51` (feat)
2. **Task 2: Thread triggeredBy userId through all 4 pass handlers** - `e7f5e73b` (feat)

## Files Created/Modified
- `functions/src/shared/types.ts` - Added DocumentVersion interface and VersionTriggerReason type
- `functions/src/pipeline/documentStore.ts` - Pre-save snapshot logic with 10-version prune via batched write, new triggeredBy/triggerReason parameters
- `functions/src/pipeline/passes/lineProducer.ts` - Added triggeredBy parameter, threaded to 5 saveGeneratedDocument calls
- `functions/src/pipeline/passes/financeAdvisor.ts` - Added triggeredBy parameter, threaded to 3 saveGeneratedDocument calls
- `functions/src/pipeline/passes/legal.ts` - Added triggeredBy parameter, threaded to 5 saveGeneratedDocument calls
- `functions/src/pipeline/passes/combined.ts` - Added triggeredBy parameter, threaded to 8 saveGeneratedDocument calls
- `functions/src/index.ts` - Updated 4 pass handler invocations to pass authenticated uid

## Decisions Made
- triggeredBy and triggerReason added as optional trailing parameters (not required) to preserve backward compatibility with any callers not yet updated
- Version prune threshold uses `>= 10` to maintain exactly 10 max versions per D-04 specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all code is production-ready, no placeholder values or TODO items in modified files.

## Next Phase Readiness
- Plan 02 (diff UI): DocumentVersion type is available for client-side version history queries and diff rendering
- Plan 03 (revert): saveGeneratedDocument already accepts `triggerReason: 'manual_revert'` for the revert Cloud Function
- Wave 0 test stubs in `src/__tests__/functions/documentStore.test.ts` are ready to be converted from RED stubs to passing tests

## Self-Check: PASSED

- [x] functions/src/shared/types.ts exists
- [x] functions/src/pipeline/documentStore.ts exists
- [x] functions/src/pipeline/passes/lineProducer.ts exists
- [x] functions/src/pipeline/passes/financeAdvisor.ts exists
- [x] functions/src/pipeline/passes/legal.ts exists
- [x] functions/src/pipeline/passes/combined.ts exists
- [x] functions/src/index.ts exists
- [x] 14-01-SUMMARY.md exists
- [x] Commit 29920e51 exists (Task 1)
- [x] Commit e7f5e73b exists (Task 2)

---
*Phase: 14-document-versioning*
*Completed: 2026-03-26*
