---
phase: 1
slug: scaffold-intake-wizard
status: draft
nyquist_compliant: false
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
| **Config file** | vitest.config.ts (Wave 0 installs) |
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
| 01-01-01 | 01 | 1 | INTK-01 | integration | `npx vitest run src/__tests__/project-creation.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INTK-04 | integration | `npx vitest run src/__tests__/screenplay-upload.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | LANG-02 | unit | `npx vitest run src/__tests__/formatting.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` — test framework installation
- [ ] `vitest.config.ts` — vitest configuration with React plugin
- [ ] `src/__tests__/` — test directory structure
- [ ] Test stubs for project creation, wizard navigation, formatting utilities

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All UI text in Mexican Spanish | INTK-10 | Visual inspection of rendered components | Navigate all 5 wizard screens, verify no English text visible |
| Dark mode rendering | D-13 | Visual appearance check | Toggle system dark mode, verify all screens render correctly |
| PDF viewer side-by-side layout | INTK-04 | Visual layout verification | Upload a screenplay PDF, verify side-by-side rendering |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
