---
phase: 08-score-estimation-accuracy-fix
verified: 2026-03-25T07:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 8: Score Estimation & Accuracy Fix Verification Report

**Phase Goal:** Viability scoring produces accurate results using correct role matching and populated scoring signals, and artistic score estimation is accessible from the UI
**Verified:** 2026-03-25T07:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | findTeamByRole matches 'Productor' and 'Director' (not 'Productor/a' and 'Director/a') | VERIFIED | scoring.ts lines 132-133 and 437 use 'Productor'/'Director'; grep for 'Productor/a' and 'Director/a' across all of src/validation/ returns zero matches |
| 2 | Scoring signals (screenplayPagesPerDay, budgetHasImprevistos, exhibitionHasSpectatorEstimate, etc.) populated in useValidation snapshot | VERIFIED | All 7 signals defined in useMemo hooks (lines 392-432) and wired into the snapshot return object (lines 488-496); each appears 3 times in useValidation.ts (declaration, snapshot, dependency array) |
| 3 | ScoreEstimationPanel triggers the estimateScore Cloud Function for artistic scoring | VERIFIED | ScoreEstimationPanel calls `estimateScoreFn({ projectId })` (line 128); Cloud Function wrapper reads A3/A4/A5 from Firestore and builds enrichedRequest before passing to handler |
| 4 | Dashboard ProjectCard shows completion/readiness percentage instead of hardcoded 0% | VERIFIED | ProjectCard has completionPct useMemo (lines 57-63) deriving from report.results pass rate; progress bar uses `style={{ width: \`${completionPct}%\` }}`; no 'w-0' or '"0%"' remain |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/validation/scoring.ts` | Corrected role matching using CARGOS_EQUIPO values | VERIFIED | findTeamByRole called with 'Productor' and 'Director' at lines 132, 133, 437; no 'Productor/a' or 'Director/a' anywhere in file |
| `src/validation/__tests__/scoring.test.ts` | Updated fixtures using CARGOS_EQUIPO values | VERIFIED | `cargo: 'Productor'` appears at line 74; `cargo: 'Director'` appears at lines 85, 228, 275, 312; no gendered forms present; 13/13 tests pass |
| `src/hooks/useValidation.ts` | Scoring signal derivation from Firestore subscriptions | VERIFIED | Subscription 10 at lines 328-342 reads `projects/${projectId}/screenplay/data`; all 7 signals present in snapshot assembly; screenplayLoading added to derived loading state |
| `functions/src/index.ts` | estimateScore wrapper reads A3/A4/A5 + metadata from Firestore | VERIFIED | Lines 316-318 read generated/A3, A4, A5; extractProse helper at line 324; enrichedRequest at line 332; Cloud Functions tsc build exits 0 |
| `src/components/dashboard/ProjectCard.tsx` | Completion bar driven by validation report pass rate | VERIFIED | completionPct useMemo at lines 57-63; dynamic style width; hardcoded 0% removed |
| `src/locales/es.ts` | retryEvaluation locale string | VERIFIED | Line 612: `retryEvaluation: 'Reintentar evaluacion'` in scoring section |
| `src/components/validation/ScoreEstimationPanel.tsx` | Uses es.scoring.retryEvaluation, not hardcoded string | VERIFIED | Line 261 uses `{es.scoring.retryEvaluation}`; no hardcoded 'Reintentar evaluacion' in file |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/hooks/useValidation.ts | src/validation/scoring.ts | scoring signals on ProjectDataSnapshot | WIRED | All 7 signals (screenplayPagesPerDay, budgetHasImprevistos, rutaCriticaHasMonthlyDetail, productionHasSafeWorkplace, exhibitionHasSpectatorEstimate, exhibitionHasFestivalStrategy, exhibitionHasTargetAudience) present in snapshot return and dependency array |
| src/validation/__tests__/scoring.test.ts | src/validation/scoring.ts | import computeViabilityScore with cargo:'Productor' | WIRED | Tests use correct CARGOS_EQUIPO values; 13/13 pass |
| src/components/validation/ScoreEstimationPanel.tsx | functions/src/index.ts (estimateScore) | httpsCallable({ projectId }) | WIRED | estimateScoreFn called with `{ projectId }` at line 128; Cloud Function wrapper enriches from Firestore |
| functions/src/index.ts | functions/src/scoreHandler.ts | handleScoreEstimation(enrichedRequest, apiKey) | WIRED | Line 341 calls handleScoreEstimation with enrichedRequest populated from Firestore reads |
| src/components/dashboard/ProjectCard.tsx | src/hooks/useValidation.ts | useValidation(id) returning report | WIRED | report destructured at line 54; completionPct useMemo consumes report.results |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| VALD-15 | 08-01-PLAN.md, 08-02-PLAN.md | Score estimation — estimate project's EFICINE score against the rubric (100 pts + 5 bonus) with actionable improvement suggestions | SATISFIED | Role matching fixed (equipo category now scores non-zero), 7 scoring signals populated from Firestore (viability score reflects actual state), Cloud Function enriches request with A3/A4/A5 content (artistic evaluators receive real data), ProjectCard shows real pass rate |

No orphaned requirements: REQUIREMENTS.md maps only VALD-15 to Phase 8, and both plans claim only VALD-15.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No TODOs, placeholders, hardcoded empty values, or stub implementations found in the modified files. The pre-existing TypeScript build errors in unrelated files (ERPISettingsPage, ExportProgressStep, pdf templates) noted in the SUMMARY are out of scope for this phase and do not affect its goal.

### Human Verification Required

#### 1. Artistic score evaluation end-to-end

**Test:** Open a project that has A3, A4, and A5 generated documents. Navigate to the validation dashboard, open the ScoreEstimationPanel, and click "Evaluar puntaje artístico."
**Expected:** The 5 AI persona evaluators each return a score and rationale based on the actual document content, not empty strings. The total artistic score reflects real evaluation.
**Why human:** Cloud Function invokes the Anthropic API; requires Firebase emulator or live environment to test end-to-end.

#### 2. ProjectCard completion percentage updates as validation state changes

**Test:** On the dashboard, create or open a project with some rules passing and some failing. Observe the percentage. Then fix a failing rule and return to the dashboard.
**Expected:** The completion bar visually updates to a higher percentage after fixing the issue.
**Why human:** Real-time Firestore + React state reactivity cannot be verified statically; requires running app.

---

## Summary

Phase 8 delivered all four accuracy fixes cleanly. Every must-have is verified against the actual codebase with no gaps:

1. **Role matching fixed** — `findTeamByRole` in scoring.ts now uses 'Productor' and 'Director' matching CARGOS_EQUIPO. No gendered forms remain anywhere in the validation directory. 13/13 scoring tests pass.

2. **Scoring signals populated** — useValidation.ts has a new subscription 10 for `screenplay/data`, useMemo derivations for all 7 signals, and all signals wired into the ProjectDataSnapshot return with correct dependency array entries. The viability score will now reflect actual project state rather than always scoring signals as absent.

3. **Cloud Function wired to receive real data** — estimateScore wrapper reads A3/A4/A5 and project metadata from Firestore server-side, builds a complete ScoreEstimationRequest, and passes it to the pure handler. Frontend correctly sends only `{ projectId }`. Cloud Functions TypeScript compiles clean.

4. **ProjectCard shows real progress** — completionPct derived from report.results pass rate; hardcoded w-0 and "0%" are gone; `retryEvaluation` locale string added to es.ts and referenced from ScoreEstimationPanel.

All four commits (2439392c, 7e4b4d95, 8bb67236, 437db628) verified in git log.

---

_Verified: 2026-03-25T07:00:00Z_
_Verifier: Claude (gsd-verifier)_
