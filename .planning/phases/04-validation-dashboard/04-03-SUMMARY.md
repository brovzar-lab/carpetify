---
phase: 04-validation-dashboard
plan: 03
subsystem: validation
tags: [typescript, scoring, cloud-functions, ai-personas, eficine-rubric, tdd, vitest]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    provides: ProjectDataSnapshot type, validation types (Severity, ValidationResult), constants
  - phase: 03-ai-doc-generation
    provides: GeneratedDocClient type, generated documents (A3, A4, A5, A7, A8a, A8b, A9a, A9b, A9d, A10)
provides:
  - computeViabilityScore (deterministic 38-pt scoring across 5 categories)
  - generateImprovementSuggestions (top 5 sorted by point impact)
  - ScoreEstimate, ScoreCategory, ImprovementSuggestion, PersonaScore types
  - handleScoreEstimation Cloud Function handler (5 parallel AI persona evaluations)
  - estimateScore onCall export (300s timeout, 1GiB memory)
  - 5 persona prompt files (prompts/evaluadores/) in Spanish
  - 69 new Spanish strings in es.ts (validation + scoring keys)
affects: [04-04, 04-05, 04-06, 04-07, 05-export-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [persona-parallel-evaluation, score-signal-detection, handler-extraction-for-scoring]

key-files:
  created:
    - src/validation/scoring.ts
    - src/validation/__tests__/scoring.test.ts
    - functions/src/scoreHandler.ts
    - prompts/evaluadores/reygadas.md
    - prompts/evaluadores/marcopolo.md
    - prompts/evaluadores/pato.md
    - prompts/evaluadores/leo.md
    - prompts/evaluadores/alejandro.md
  modified:
    - src/validation/types.ts
    - src/locales/es.ts
    - functions/src/index.ts

key-decisions:
  - "Score signal booleans on ProjectDataSnapshot rather than deep document content analysis -- keeps viability scoring purely deterministic from project metadata"
  - "AI persona prompts instruct 65-70% average scoring to prevent score inflation -- mimics realistic EFICINE evaluator behavior"
  - "Per-persona graceful failure (null result) in Cloud Function so partial results still useful if one persona times out"

patterns-established:
  - "Scoring signal pattern: boolean flags on ProjectDataSnapshot detected by computeViabilityScore signals array"
  - "Persona evaluation pattern: handler loads prompt .md files, builds user message with document content, runs parallel Claude calls"
  - "Improvement suggestion rules: SUGGESTION_RULES array with applies() predicate, sorted by points descending, max 5"

requirements-completed: [VALD-15, VALD-13]

# Metrics
duration: 16min
completed: 2026-03-24
---

# Phase 04 Plan 03: Score Estimation Summary

**Deterministic viability scoring (38 pts, 5 categories) with AI persona artistic scoring (5 parallel evaluator Cloud Function) and 69 Phase 4 Spanish locale strings**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-24T14:34:02Z
- **Completed:** 2026-03-24T14:50:33Z
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 3

## Accomplishments
- Deterministic viability scoring across 5 EFICINE categories (equipo 2, produccion 12, plan_rodaje 10, presupuesto 10, exhibicion 4) with per-signal breakdown
- Top 5 improvement suggestions sorted by point impact with exact Spanish copy from UI-SPEC
- 5 AI evaluator persona prompts (Reygadas, Marcopolo, Pato, Leo, Alejandro) fully in Spanish with structured JSON output
- Cloud Function handler running 5 parallel persona evaluations with graceful per-persona failure handling
- 69 new Spanish strings added to es.ts covering validation dashboard (38 strings) and score estimation (31 strings)
- 13 passing TDD test cases covering all scoring functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create viability scoring module with improvement suggestions and tests** - `7a99ba4c` (test) + `6a49110d` (feat)
2. **Task 2: Create AI persona scoring Cloud Function and persona prompt files** - `eeb67473` (feat)

_Note: Task 1 was TDD with separate test (RED) and implementation (GREEN) commits._

## Files Created/Modified
- `src/validation/scoring.ts` - computeViabilityScore, generateImprovementSuggestions, all score types (ScoreEstimate, ScoreCategory, ImprovementSuggestion, PersonaScore)
- `src/validation/__tests__/scoring.test.ts` - 13 TDD test cases covering empty data, category maxPoints, equipo/produccion/plan/presupuesto/exhibicion scoring, improvement suggestions, ScoreEstimate type
- `src/validation/types.ts` - Extended ProjectDataSnapshot with 8 optional scoring signal fields
- `src/locales/es.ts` - Added validation (38 strings) and scoring (31 strings) keys with all Phase 4 UI copy
- `functions/src/scoreHandler.ts` - handleScoreEstimation: 5 parallel Claude persona evaluations, JSON parsing, score clamping, error handling
- `functions/src/index.ts` - Added estimateScore onCall (300s timeout, 1GiB, Secret Manager)
- `prompts/evaluadores/reygadas.md` - Auteur/arthouse evaluator (artistic innovation, formal experimentation)
- `prompts/evaluadores/marcopolo.md` - Commercial producer evaluator (audience accessibility, market viability)
- `prompts/evaluadores/pato.md` - Writer evaluator (narrative craft, dialogue quality, character depth)
- `prompts/evaluadores/leo.md` - Producer evaluator (production solidity, budget realism, risk management)
- `prompts/evaluadores/alejandro.md` - Commercial director evaluator (visual storytelling, audience engagement)

## Decisions Made
- Added scoring signal booleans (screenplayPagesPerDay, budgetHasImprevistos, exhibitionHasSpectatorEstimate, etc.) to ProjectDataSnapshot rather than parsing document content -- keeps viability scoring deterministic and fast
- AI persona prompts instruct evaluators to average around 65-70% of max per category to prevent score inflation and approximate real EFICINE committee behavior
- Per-persona graceful failure in Cloud Function: if one persona call fails, it returns null and the remaining results are still returned with success=true

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test data for equipo 2/2 test case**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Test expected 2/2 score but team members had separate filmography titles, giving only 1.5/2 (no prior collaboration signal)
- **Fix:** Updated test to use shared filmography title ("Film Compartido") between producer and director
- **Files modified:** src/validation/__tests__/scoring.test.ts
- **Verification:** All 13 tests pass
- **Committed in:** 6a49110d (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test data)
**Impact on plan:** Trivial test data correction. No scope creep.

## Known Stubs

None. All scoring functions are fully implemented. AI persona evaluation is a real Cloud Function (not mocked).

## Issues Encountered
None.

## User Setup Required
None -- no new external service configuration required. Uses existing ANTHROPIC_API_KEY via Firebase Secret Manager.

## Next Phase Readiness
- Viability scoring module ready for integration into ScoreEstimationPanel component (Plan 04-05 or later)
- Cloud Function ready to be called from frontend via httpsCallable
- All Phase 4 Spanish strings in es.ts ready for validation dashboard and score panel components
- Score types ready for use in useValidation hook and dashboard components

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
