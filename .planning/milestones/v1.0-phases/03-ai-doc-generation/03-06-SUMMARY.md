---
phase: 03-ai-doc-generation
plan: 06
subsystem: ui
tags: [react, budget-editor, spreadsheet, imcine-accounts, downstream-warnings, word-export, shadcn-table]

# Dependency graph
requires:
  - phase: 03-ai-doc-generation
    plan: 04
    provides: "GenerationScreen, DocumentList, generation service, useGeneration hook, useGeneratedDocs hook"
provides:
  - "BudgetEditor spreadsheet-like component for A9b with IMCINE account structure (100-1200)"
  - "BudgetAccountRow with collapsible subconcepts and editable quantity/unit cost cells"
  - "DownstreamWarning alert showing affected documents on budget edit (D-16)"
  - "useBudgetEditor hook with 1500ms debounce auto-save to both generated/A9b and meta/budget_output"
  - "A9b routing in GenerationScreen to BudgetEditor instead of DocumentViewer"
  - "A4 Word export template handler in DocumentViewer (D-07)"
  - "shadcn Table and DropdownMenu components"
affects: [04-validation-engine, 05-export-manager]

# Tech tracking
tech-stack:
  added: [shadcn-table, shadcn-dropdown-menu]
  patterns: [Inline editable cell pattern (focus raw / blur formatted matching MXNInput), Budget account expand/collapse with subconcept rows, Downstream document impact tracking on financial data changes]

key-files:
  created:
    - src/components/generation/BudgetEditor.tsx
    - src/components/generation/BudgetAccountRow.tsx
    - src/components/generation/DownstreamWarning.tsx
    - src/hooks/useBudgetEditor.ts
    - src/components/ui/table.tsx
    - src/components/ui/dropdown-menu.tsx
  modified:
    - src/components/generation/GenerationScreen.tsx
    - src/components/generation/DocumentViewer.tsx
    - src/locales/es.ts

key-decisions:
  - "Inline editable cell pattern for budget: raw number on focus, formatted $X,XXX,XXX MXN on blur (same pattern as MXNInput from Phase 1)"
  - "Auto-save writes FULL BudgetOutput including all partidas arrays to meta/budget_output for downstream pass compatibility"
  - "A4 Word export generates .txt template (lightweight approach per CONTEXT.md Claude discretion on library choice)"
  - "Budget editor strings added to es.ts generation section by parallel Plan 05 agent (no duplication needed)"

patterns-established:
  - "Inline editable spreadsheet cell: input with focus/blur formatting for financial data"
  - "Downstream impact warning: tracking changed accounts and listing affected documents in real time"
  - "Budget auto-save to dual locations: generated/{docId} for display AND meta/{output} for downstream pipeline compatibility"

requirements-completed: [AIGEN-07, AIGEN-08, AIGEN-09]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 03 Plan 06: Budget Editor & Downstream Warnings Summary

**Spreadsheet-like budget editor with IMCINE account structure (100-1200), auto-recalculating subtotals, downstream inconsistency warnings (D-16), dual-location auto-save for pipeline compatibility, and A4 Word export template**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T19:46:31Z
- **Completed:** 2026-03-23T19:52:04Z
- **Tasks:** 1 of 1 auto tasks completed (Task 2 is checkpoint:human-verify)
- **Files modified:** 9

## Accomplishments

- BudgetEditor displays IMCINE 100-1200 account structure as an editable spreadsheet with collapsible subconcept rows
- Editable cells show raw numbers on focus and formatted $X,XXX,XXX MXN on blur (matching MXNInput pattern)
- Subtotals auto-recalculate on cell blur; grand total updates as sum of all account subtotals
- DownstreamWarning lists affected documents when budget changes (Flujo de Efectivo, Esquema Financiero, Contrato Productor, Contrato Director)
- Auto-save with 1500ms debounce writes FULL BudgetOutput (including all partidas arrays) to both generated/A9b and meta/budget_output
- GenerationScreen routes A9b selection to BudgetEditor instead of DocumentViewer
- DocumentViewer handles A4 with centered empty state and "Exportar plantilla Word" button (D-07)
- shadcn Table and DropdownMenu components installed

## Task Commits

Each task was committed atomically:

1. **Task 1: Budget editor with IMCINE account structure, auto-calculation, and downstream warnings** - `f9d89b59` (feat)

## Files Created/Modified

- `src/components/generation/BudgetEditor.tsx` - Spreadsheet-like editor for A9b with IMCINE accounts, loading skeleton, ScrollArea horizontal scroll
- `src/components/generation/BudgetAccountRow.tsx` - Single IMCINE account row with collapsible subconcepts, inline editable cells
- `src/components/generation/DownstreamWarning.tsx` - Alert with yellow warning border listing affected downstream documents
- `src/hooks/useBudgetEditor.ts` - Hook managing budget state, auto-save to dual Firestore locations, downstream impact tracking
- `src/components/ui/table.tsx` - shadcn Table component (installed via CLI)
- `src/components/ui/dropdown-menu.tsx` - shadcn DropdownMenu component (installed via CLI)
- `src/components/generation/GenerationScreen.tsx` - Added BudgetEditor import and A9b routing
- `src/components/generation/DocumentViewer.tsx` - Added A4 Word export special handling with Download icon
- `src/locales/es.ts` - Budget editor strings already present from parallel Plan 05 agent

## Decisions Made

1. **Inline editable cell pattern**: Reused MXNInput's focus/blur formatting approach for budget cells (raw number on focus, formatted on blur) rather than introducing a separate input component, maintaining UI consistency.
2. **FULL BudgetOutput dual-write**: Auto-save writes the complete BudgetOutput structure (cuentas with all partidas, totalCentavos, totalFormatted) to meta/budget_output -- not just account totals. This ensures loadBudgetOutput() returns the same structure downstream passes expect.
3. **A4 export as .txt template**: Used a simple text file export rather than a full .docx library, per CONTEXT.md's Claude discretion on Word export library choice. The template provides structured sections for the director to fill externally.
4. **Parallel es.ts coordination**: Plan 05 agent added budget editor locale strings proactively. No duplicate strings were added.

## Deviations from Plan

None - plan executed exactly as written. All locale strings were already present from the parallel Plan 05 agent.

## Known Stubs

None - all components are fully wired with real data paths to Firestore.

## Issues Encountered

- **Parallel execution overlap**: Plan 05 modified shared files (es.ts, GenerationScreen.tsx, DocumentViewer.tsx) concurrently. Plan 05's incomplete work (missing locale strings for RegenerateButton and StalenessIndicator) causes build errors in Plan 05's files, but Plan 06's files compile cleanly. Plan 05 will resolve these when it completes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Budget editor ready for financial data display and editing
- Downstream warning system ready for integration with validation engine (Phase 4)
- A4 Word export template functional for director workflow
- Task 2 (checkpoint:human-verify) awaits user verification of the complete Phase 3 pipeline end-to-end

## Self-Check: PASSED

- 6/6 created files verified present
- 3/3 modified files verified present
- 1/1 task commits verified in git history (f9d89b59)

---
*Phase: 03-ai-doc-generation*
*Completed: 2026-03-23*
