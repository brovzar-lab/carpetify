---
phase: 15-ai-pre-submission-review
plan: 01
subsystem: ai, api
tags: [claude, anthropic, streaming-callable, persona-evaluation, eficine-review]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    provides: 5 evaluator persona definitions (reygadas, marcopolo, pato, leo, alejandro) and scoring pattern
  - phase: 03-ai-doc-generation
    provides: loadProjectDataForGeneration, getAllGeneratedDocuments, concurrencyPool, promptLoader
provides:
  - Review types (ReviewPersona, ReviewFinding, CoherenceContradiction, ReviewResult, ReviewProgressChunk)
  - REVIEW_PERSONAS array with 5 persona-to-document mappings
  - handlePreSubmissionReview handler with 2-pass architecture
  - runPreSubmissionReview streaming callable Cloud Function
  - 6 critique prompt files (5 persona + 1 coherence)
affects: [15-ai-pre-submission-review, validation-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [two-pass-review-architecture, persona-critique-mode, coherence-contradiction-detection]

key-files:
  created:
    - functions/src/review/reviewTypes.ts
    - functions/src/review/preSubmissionReview.ts
    - prompts/evaluadores/revision_artistico.md
    - prompts/evaluadores/revision_viabilidad.md
    - prompts/evaluadores/revision_produccion.md
    - prompts/evaluadores/revision_narrativa.md
    - prompts/evaluadores/revision_ejecutivo.md
    - prompts/evaluadores/revision_coherencia.md
  modified:
    - functions/src/index.ts

key-decisions:
  - "Used createConcurrencyPool(3) for Pass 1 parallel persona calls matching Phase 3 D-04 pattern"
  - "Curated user message per persona (~2000 chars per doc) instead of raw document dump to control token budget"
  - "Readiness computed from findings count thresholds: lista(0-3), casi_lista(4-6), necesita_trabajo(7-12), no_lista(>12)"

patterns-established:
  - "Two-pass review: Pass 1 parallel persona critiques + Pass 2 sequential coherence check"
  - "Review finding structure: personaId + documentId + criterion + weakness + suggestion + resolved checkbox"
  - "Firestore persistence at projects/{projectId}/meta/pre_submission_review"

requirements-completed: [AIGEN-V2-01]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 15 Plan 01: Pre-Submission Review Backend Summary

**5 AI persona critique prompts with 2-pass review handler (parallel personas + coherence check) and streaming Cloud Function**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T00:05:50Z
- **Completed:** 2026-03-27T00:12:06Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created complete type system for pre-submission review: ReviewPersona, ReviewFinding, CoherenceContradiction, PersonaReviewResult, ReviewResult, ReviewProgressChunk
- REVIEW_PERSONAS array with exact D-07 persona-document mappings: Reygadas=A4+A5, Marcopolo=A10+A9a, Pato=A2, Leo=A7+A8a+A8b, Alejandro=A1+A6
- 6 Spanish critique prompt files with persona-specific rubric criteria and JSON output format
- handlePreSubmissionReview handler: loads data, pre-checks doc completeness, runs 5 personas in parallel (concurrency 3), runs coherence check, computes readiness/score, persists to Firestore
- runPreSubmissionReview streaming callable registered in index.ts with auth, access checks, 540s timeout

## Task Commits

Each task was committed atomically:

1. **Task 1: Create review types, persona critique prompts, and user message builder** - `fdaefafa` (feat)
2. **Task 2: Create review handler with 2-pass architecture and register Cloud Function** - `3cf922f2` (feat)

## Files Created/Modified
- `functions/src/review/reviewTypes.ts` - Review types, REVIEW_PERSONAS array with D-07 document mappings
- `functions/src/review/preSubmissionReview.ts` - 2-pass review handler: parallel personas + coherence check + Firestore persistence
- `functions/src/index.ts` - runPreSubmissionReview streaming callable registration
- `prompts/evaluadores/revision_artistico.md` - Reygadas critique prompt for A4, A5
- `prompts/evaluadores/revision_viabilidad.md` - Marcopolo critique prompt for A10, A9a
- `prompts/evaluadores/revision_produccion.md` - Leo critique prompt for A7, A8a, A8b
- `prompts/evaluadores/revision_narrativa.md` - Pato critique prompt for A2 with guion alignment framing
- `prompts/evaluadores/revision_ejecutivo.md` - Alejandro critique prompt for A1, A6
- `prompts/evaluadores/revision_coherencia.md` - Pass 2 cross-document coherence prompt

## Decisions Made
- Used createConcurrencyPool(3) for Pass 1 parallel persona calls, matching the Phase 3 D-04 established pattern
- Curated user message per persona with ~2000 char truncation per document to control token budget per Pitfall 1
- Readiness thresholds: lista (0-3 findings, 0 contradictions), casi_lista (4-6 or 1), necesita_trabajo (7-12 or 2-3), no_lista (>12 or >3)
- Score estimation: start at 100, -2 per finding, -3 per contradiction, clamped 0-100
- Pre-check requires A1, A2, A7, A9a before allowing review per Pitfall 4
- generatedDocsTimestamp stored for staleness detection per Pitfall 6

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DocumentId type mismatch in pre-check**
- **Found during:** Task 2 (handler implementation)
- **Issue:** TypeScript error: `Set<DocumentId>` vs `string` comparison in required docs pre-check
- **Fix:** Explicitly typed Set as `Set<string>` for the existingDocIds variable
- **Files modified:** functions/src/review/preSubmissionReview.ts
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** 3cf922f2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Trivial type annotation fix. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all functionality is complete for the backend scope of this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend review infrastructure complete: types, handler, prompts, Cloud Function
- Ready for Plan 02 (frontend integration): client-side service wrapper, UI panel, checklist display
- All types exported from reviewTypes.ts for frontend consumption

## Self-Check: PASSED

All 9 created files verified on disk. Both task commits (fdaefafa, 3cf922f2) verified in git log.

---
*Phase: 15-ai-pre-submission-review*
*Completed: 2026-03-27*
