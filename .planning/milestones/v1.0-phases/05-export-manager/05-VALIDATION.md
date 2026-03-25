---
phase: 05
slug: export-manager
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/export/ -x` |
| **Full suite command** | `npx vitest run src/__tests__/export/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/export/ -x`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-T1 | 05-01 | 1 | EXPRT-01, EXPRT-05 | unit (TDD) | `npx vitest run src/__tests__/export/fileNaming.test.ts --reporter=verbose` | src/__tests__/export/fileNaming.test.ts | ⬜ pending |
| 05-01-T2 | 05-01 | 1 | LANG-05 | unit (TDD) | `npx vitest run src/__tests__/export/languageCheck.test.ts --reporter=verbose` | src/__tests__/export/languageCheck.test.ts | ⬜ pending |
| 05-02-T1 | 05-02 | 2 | EXPRT-01, EXPRT-05 | typecheck | `npx tsc --noEmit src/components/pdf/templates/ProseDocument.tsx src/components/pdf/templates/BudgetSummary.tsx src/components/pdf/templates/ContractDocument.tsx` | N/A (12 template files) | ⬜ pending |
| 05-02-T2 | 05-02 | 2 | EXPRT-03 | typecheck | `npx tsc --noEmit src/components/pdf/templates/ValidationReport.tsx src/components/pdf/templates/ScoreEstimate.tsx src/components/pdf/templates/SubmissionGuide.tsx src/lib/export/pdfRenderer.ts` | N/A (4 files) | ⬜ pending |
| 05-03-T1 | 05-03 | 3 | EXPRT-01..05, LANG-05 | typecheck | `npx tsc --noEmit src/hooks/useExport.ts src/services/export.ts src/lib/export/zipCompiler.ts src/lib/export/contentAdapters.ts src/stores/wizardStore.ts` | N/A (8 files) | ⬜ pending |
| 05-03-T2 | 05-03 | 3 | EXPRT-02, EXPRT-04 | typecheck | `npx tsc --noEmit src/components/export/ExportScreen.tsx` | N/A (10 component files) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/export/` — test directory for export manager (created by Plan 01 Task 1)
- [x] `src/__tests__/export/fileNaming.test.ts` — file naming tests (created by Plan 01 Task 1, TDD)
- [x] `src/__tests__/export/languageCheck.test.ts` — language check tests (created by Plan 01 Task 2, TDD)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF visual quality and formatting | EXPRT-01 | Visual rendering | Open generated PDFs, verify layout/typography |
| ZIP folder structure matches SHCP convention | EXPRT-02 | File system inspection | Extract ZIP, verify folder/file names |
| Language check catches English strings | LANG-05 | AI output variance | Generate docs with mixed content, verify detection |
| Export progress UI feedback | EXPRT-04 | Visual interaction | Click export, verify step-by-step progress |
| Uploaded doc rename per D-04 | EXPRT-01 | File system inspection | Extract ZIP, verify uploaded files have IMCINE names |
| Content adapters produce correct template data | EXPRT-05 | Visual rendering | Open exported PDFs, verify data populated correctly |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
