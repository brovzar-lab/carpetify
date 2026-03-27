---
phase: 14
slug: document-versioning
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-26
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (E2E) |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~30 seconds (unit) + ~60 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| *Populated after plans are created* | | | | | | | |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Version service tests — stubs for AIGEN-V2-03 (version storage, retrieval)
- [x] Diff computation tests — stubs for AIGEN-V2-04 (prose diff, structured diff)
- [x] Revert logic tests — stubs for AIGEN-V2-05 (copy-forward revert, staleness cascade)
- [x] Existing vitest + Playwright infrastructure covers framework needs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Side-by-side diff visual rendering | AIGEN-V2-04 | Green/red/yellow color rendering requires visual verification | Open diff view, compare two versions, verify color-coded additions/deletions |
| Revert staleness cascade UI | AIGEN-V2-05 | Multi-document staleness state requires end-to-end flow | Revert a document, verify downstream documents show stale indicators |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete
