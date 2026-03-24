---
phase: 06
slug: validation-data-wiring-fix
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | VALD-01, VALD-02, VALD-05, VALD-14 | unit + typecheck | `npx tsc --noEmit` | yes (existing) | pending |
| 06-01-02 | 01 | 1 | VALD-04, LANG-03 | unit + typecheck | `npx vitest run src/validation/__tests__/blockerRules.test.ts -t "VALD-04" --reporter=verbose` | yes (existing) | pending |
| 06-02-01 | 02 | 2 | VALD-03, VALD-08, VALD-13 | unit + typecheck | `npx tsc --noEmit && npx vitest run src/validation/__tests__/blockerRules.test.ts --reporter=verbose` | yes (existing) | pending |
| 06-02-02 | 02 | 2 | VALD-07, VALD-13 | typecheck + build | `npx tsc --noEmit && npm run build` | yes (existing) | pending |
| 06-03-01 | 03 | 3 | VALD-16, VALD-14 | unit (TDD) | `npx vitest run src/validation/__tests__/trafficLight.test.ts --reporter=verbose` | created by task | pending |
| 06-03-02 | 03 | 3 | VALD-13 | unit + typecheck + build | `npx vitest run --reporter=verbose && npm run build` | yes (existing) | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements

- Existing test infrastructure covers all phase requirements.
- Task 06-03-01 creates `src/validation/__tests__/trafficLight.test.ts` as part of its TDD flow (RED step creates the file before GREEN implements).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Traffic light sidebar reflects real validation state | VALD-14 | Visual component rendering | Verify traffic light colors change from false-green to correct state |
| canExport blocks when EFICINE rules fail | VALD-16 | Integration with export flow | Attempt export with failing validations, verify blocked |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
