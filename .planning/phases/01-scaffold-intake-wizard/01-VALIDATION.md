---
phase: 1
slug: scaffold-intake-wizard
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Plan 01-01 Task 1 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-02 | 01 | 1 | INTK-01, LANG-02 | unit | `npx vitest run src/lib/__tests__/format.test.ts src/schemas/__tests__/project.test.ts src/schemas/__tests__/team.test.ts src/hooks/__tests__/useCompliance.test.ts` | Plan 01-01 Task 2 creates | pending |
| 01-02-01 | 02 | 2 | INTK-01, INTK-03 | integration | `npx vitest run --reporter=verbose 2>&1 \| tail -20` | Runs existing tests | pending |
| 01-03-01 | 03 | 2 | INTK-02, INTK-06 | integration | `npx vitest run --reporter=verbose 2>&1 \| tail -20` | Runs existing tests | pending |
| 01-04-01 | 04 | 3 | INTK-04, INTK-08 | integration | `npx vitest run --reporter=verbose 2>&1 \| tail -20` | Runs existing tests | pending |
| 01-04-02 | 04 | 3 | INTK-07 | integration | `npx vitest run --reporter=verbose 2>&1 \| tail -20` | Runs existing tests | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Test infrastructure and initial test files are created in Plan 01-01:
- [x] `vitest` + `@testing-library/react` — installed in Plan 01-01 Task 1
- [x] `vitest.config.ts` — created in Plan 01-01 Task 1
- [x] `src/test-setup.ts` — created in Plan 01-01 Task 1
- [ ] `src/lib/__tests__/format.test.ts` — created in Plan 01-01 Task 2
- [ ] `src/schemas/__tests__/project.test.ts` — created in Plan 01-01 Task 2
- [ ] `src/schemas/__tests__/team.test.ts` — created in Plan 01-01 Task 2
- [ ] `src/hooks/__tests__/useCompliance.test.ts` — created in Plan 01-01 Task 2

---

## Nyquist Compliance

Consecutive auto-task verification chain:
1. Plan 01-01 Task 1 (auto) — verify: dev server curl test
2. Plan 01-01 Task 2 (auto, tdd) — verify: `npx vitest run --reporter=verbose` (TESTS)
3. Plan 01-02 Task 1 (auto) — verify: `npx vitest run` + grep (TESTS)
4. Plan 01-02 Task 2 (auto) — verify: grep only
5. Plan 01-03 Task 1 (auto) — verify: grep only
6. Plan 01-03 Task 2 (auto) — verify: grep only
7. Plan 01-04 Task 1 (auto) — verify: `npx vitest run` + grep (TESTS)
8. Plan 01-04 Task 2 (auto) — verify: `npx vitest run` + grep (TESTS)
9. Plan 01-04 Task 3 (checkpoint:human-verify) — BREAKS consecutive auto chain

Maximum consecutive auto-tasks without `npx vitest run`: 3 (Tasks 01-02-02 through 01-03-02), which meets the 3-consecutive limit.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All UI text in Mexican Spanish | INTK-10 | Visual inspection of rendered components | Navigate all 5 wizard screens, verify no English text visible |
| Dark mode rendering | D-13 | Visual appearance check | Toggle system dark mode, verify all screens render correctly |
| PDF viewer side-by-side layout | INTK-04 | Visual layout verification | Upload a screenplay PDF, verify side-by-side rendering |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no more than 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (test files created in Plan 01-01 Task 2)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
