---
phase: 15
slug: ai-pre-submission-review
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-26
---

# Phase 15 — Validation Strategy

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

- [x] Review prompt/response parsing tests — stubs for AIGEN-V2-01
- [x] Review UI component tests — stubs for AIGEN-V2-02
- [x] Existing vitest + Playwright infrastructure covers framework needs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI review quality with real Claude API | AIGEN-V2-01 | Requires live API call with real screenplay data | Run review on a test project, verify 5 personas produce coherent findings |
| Streaming progress display | AIGEN-V2-02 | Real-time streaming requires live Cloud Function | Trigger review, verify progress updates appear in real-time |
| Checklist checkbox persistence | AIGEN-V2-02 | Requires Firestore round-trip | Check/uncheck findings, reload page, verify state persists |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete
