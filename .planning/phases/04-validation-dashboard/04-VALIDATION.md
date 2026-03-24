---
phase: 04
slug: validation-dashboard
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-23
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/validation/ -x` |
| **Full suite command** | `npx vitest run src/validation/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/validation/ -x`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-T1 | 04-01 | 1 | VALD-01..10 | unit | `npx vitest run src/validation/__tests__/blockerRules.test.ts -x` | W0 | ⬜ pending |
| 04-02-T1 | 04-02 | 1 | VALD-11,12,13,17 | unit | `npx vitest run src/validation/__tests__/warningRules.test.ts -x` | W0 | ⬜ pending |
| 04-03-T1 | 04-03 | 1 | VALD-15 | unit | `npx vitest run src/validation/__tests__/scoring.test.ts -x` | W0 | ⬜ pending |
| 04-03-T2 | 04-03 | 1 | VALD-15 | compile+files | `ls prompts/evaluadores/*.md \| wc -l && grep -l "handleScoreEstimation" functions/src/scoreHandler.ts && grep -l "estimateScore" functions/src/index.ts && cd functions && npx tsc --noEmit` | n/a | ⬜ pending |
| 04-04-T1 | 04-04 | 2 | VALD-14,16 | integration | `npx vitest run src/validation/__tests__/engine.test.ts -x` | W0 | ⬜ pending |
| 04-05-T1 | 04-05 | 2 | VALD-14,16 | compile | `npx tsc --noEmit 2>&1 \| head -30` | n/a | ⬜ pending |
| 04-05-T2 | 04-05 | 2 | VALD-14,16 | compile | `npx tsc --noEmit 2>&1 \| head -30` | n/a | ⬜ pending |
| 04-06-T1 | 04-06 | 3 | VALD-14,15,16 | compile | `npx tsc --noEmit 2>&1 \| head -30` | n/a | ⬜ pending |
| 04-06-T2 | 04-06 | 3 | VALD-14,15,16 | compile | `npx tsc --noEmit 2>&1 \| head -30` | n/a | ⬜ pending |
| 04-07-T1 | 04-07 | 3 | VALD-04,06..09,11,12,15..17 | compile | `npx tsc --noEmit 2>&1 \| head -30` | n/a | ⬜ pending |
| 04-07-T2 | 04-07 | 3 | VALD-04,06..09,11,12,15..17 | compile | `npx tsc --noEmit 2>&1 \| head -30` | n/a | ⬜ pending |
| 04-07-T3 | 04-07 | 3 | ALL | manual | Visual verification checkpoint (see plan) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/validation/__tests__/` — test directory for validation engine (created by Plan 04-01 Task 1)
- [ ] Shared fixtures with sample project data triggering each of the 14 validation rules
- [ ] Mock Firestore data matching `schemas/*.json` field structures

*Wave 0 files are created inline by TDD tasks in Plans 04-01, 04-02, 04-03, and 04-04.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Traffic light dashboard visual rendering | VALD-14 | Color rendering, visual hierarchy | Inspect dashboard for green/yellow/red indicators |
| Real-time validation feedback on form input | VALD-16 | Requires live form interaction | Enter data in wizard, observe validation updates |
| Score estimation AI personas produce varied scores | VALD-15 | AI output variance | Click "Evaluar puntaje", verify 5 persona scores differ |
| "Ir al campo" field highlight animation | VALD-14 | CSS transition timing | Click link, verify ring fades after 3s |
| Document expiration at three touchpoints | VALD-17 | Visual positioning across views | Check dashboard, Screen 5, and project card |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
