---
phase: 13
slug: activity-tracking
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-26
updated: 2026-03-26
---

# Phase 13 — Validation Strategy

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
| 00-T1 | 13-00 | 0 | COLLAB-04 | unit stub | `npx vitest run src/services/__tests__/activityLog.test.ts --reporter=verbose` | Wave 0 creates | ⬜ pending |
| 00-T2 | 13-00 | 0 | COLLAB-06 | unit stub | `npx vitest run src/__tests__/functions/emailTemplates.test.ts src/__tests__/functions/onInvitationCreated.test.ts --reporter=verbose` | Wave 0 creates | ⬜ pending |
| 01-T1 | 13-01 | 1 | COLLAB-04 | unit | `npx vitest run src/services/__tests__/activityLog.test.ts --reporter=verbose` | Wave 0 | ⬜ pending |
| 01-T2 | 13-01 | 1 | COLLAB-04 | unit | `npx vitest run src/services/__tests__/activityLog.test.ts --reporter=verbose` | Wave 0 | ⬜ pending |
| 01-T3 | 13-01 | 1 | COLLAB-04 | unit+tsc | `npx vitest run --reporter=verbose` | Wave 0 | ⬜ pending |
| 01-T4 | 13-01 | 1 | COLLAB-04 | unit+tsc | `npx vitest run --reporter=verbose` | Wave 0 | ⬜ pending |
| 02-T1 | 13-02 | 2 | COLLAB-06 | unit | `npx vitest run src/__tests__/functions/emailTemplates.test.ts src/__tests__/functions/onInvitationCreated.test.ts --reporter=verbose` | Wave 0 | ⬜ pending |
| 02-T2 | 13-02 | 2 | COLLAB-06 | unit+tsc | `npx vitest run --reporter=verbose` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/services/__tests__/activityLog.test.ts` — stubs for COLLAB-04 (buildChangeSummary, FIELD_LABELS, SCREEN_LABELS, coalesceOrCreate)
- [ ] `src/__tests__/functions/emailTemplates.test.ts` — stubs for COLLAB-06 (buildInvitationEmailHtml HTML rendering)
- [ ] `src/__tests__/functions/onInvitationCreated.test.ts` — stubs for COLLAB-06 (trigger logic, mocked Resend)
- [x] Existing vitest + Playwright infrastructure covers framework needs

**Plan:** 13-00-PLAN.md (Wave 0)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email delivery via Resend | COLLAB-06 | Requires external email service | Send test invitation, verify email arrives with correct deep link |
| Activity badge count real-time update | COLLAB-04 | Real-time Firestore listener behavior | Open two browser tabs, make changes in one, verify badge updates in other |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready (pending Wave 0 execution)
