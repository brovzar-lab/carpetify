---
phase: 2
slug: screenplay-processing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already installed from Phase 1) |
| **Config file** | vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SCRN-01 | unit | `npx vitest run src/__tests__/screenplay/extractText.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SCRN-02 | unit | `npx vitest run src/__tests__/screenplay/parseStructure.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | SCRN-03 | integration | `npx vitest run src/__tests__/screenplay/analyzeWithClaude.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | SCRN-04 | integration | `npx vitest run src/__tests__/screenplay/storage.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/screenplay/extractText.test.ts` — PDF text extraction tests
- [ ] `src/__tests__/screenplay/parseStructure.test.ts` — Regex parser tests with known screenplay text
- [ ] `src/__tests__/screenplay/analyzeWithClaude.test.ts` — Claude API integration test (mocked)
- [ ] `src/__tests__/screenplay/storage.test.ts` — Firestore write verification
- [ ] `src/__tests__/fixtures/sample-screenplay.txt` — Test fixture with known-structure screenplay text

*Existing infrastructure from Phase 1 covers vitest config and test setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF viewer renders uploaded screenplay | SCRN-01 | Visual rendering check | Upload a real screenplay PDF on Screen 2, verify it displays in the viewer |
| Parsed data matches screenplay content | SCRN-02 | Content accuracy requires human judgment | Compare parsed scenes/locations/characters against actual screenplay |
| Claude analysis produces coherent Spanish output | SCRN-03 | AI output quality assessment | Review generated analysis for Spanish language quality and accuracy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
