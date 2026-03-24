---
phase: 04-validation-dashboard
plan: 05
subsystem: validation
tags: [typescript, react-hooks, firestore-subscriptions, real-time-validation, tiered-execution, wizard-navigation, shadcn]

# Dependency graph
requires:
  - phase: 04-validation-dashboard
    plan: 04
    provides: runInstantRules (12), runMediumRules (2), runAllRules (14), INSTANT_RULE_IDS, MEDIUM_RULE_IDS
  - phase: 04-validation-dashboard
    plan: 03
    provides: computeViabilityScore, generateImprovementSuggestions, ScoreCategory, ImprovementSuggestion types
provides:
  - useValidation hook with tiered rule execution (instant 300ms debounce + medium on timestamp change)
  - ValidationDashboard component wired to useValidation hook with summary display
  - WizardScreen type updated with 'validacion'
  - Wizard sidebar with Validacion navigation entry and traffic light
  - Full-width layout for validation screen in WizardShell
  - shadcn accordion and collapsible components installed
affects: [04-06, 04-07, 05-export-manager]

# Tech tracking
tech-stack:
  added: [shadcn-accordion, shadcn-collapsible]
  patterns: [tiered-hook-execution, multi-source-firestore-assembly, debounced-validation]

key-files:
  created:
    - src/hooks/useValidation.ts
    - src/components/validation/ValidationDashboard.tsx
    - src/components/ui/accordion.tsx
    - src/components/ui/collapsible.tsx
  modified:
    - src/stores/wizardStore.ts
    - src/components/wizard/WizardSidebar.tsx
    - src/components/wizard/WizardShell.tsx
    - src/locales/es.ts

key-decisions:
  - "useValidation assembles ProjectDataSnapshot from 7 independent Firestore real-time subscriptions (project doc, team subcollection, documents subcollection, ERPI singleton, budget_output meta, A9d generated, E1 generated)"
  - "Medium rules persist in state between instant re-runs -- combined report merges fresh instant results with last medium results"
  - "ValidationDashboard created with functional summary display (counts, rule list, viability preview) as Plan 06 route target rather than empty stub"
  - "Validacion screen uses same full-width layout pattern as generation screen (sidebar + full-width main)"

patterns-established:
  - "Tiered hook pattern: separate state for instant and medium results, merged via useMemo for combined report"
  - "Multi-source Firestore assembly: parallel onSnapshot subscriptions with independent loading states, validation only runs when all have loaded"
  - "Timestamp comparison via useRef for detecting generatedDocs timestamp changes without causing re-renders"

requirements-completed: [VALD-14, VALD-16]

# Metrics
duration: 13min
completed: 2026-03-24
---

# Phase 04 Plan 05: useValidation Hook + Wizard Navigation Summary

**Real-time useValidation hook with tiered execution (instant 300ms debounce + medium on document timestamp change) wiring 7 Firestore sources, integrated into wizard sidebar with full-width ValidationDashboard route**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-24T15:08:21Z
- **Completed:** 2026-03-24T15:21:34Z
- **Tasks:** 2
- **Files created:** 4
- **Files modified:** 4

## Accomplishments
- Created useValidation hook that assembles ProjectDataSnapshot from 7 parallel Firestore real-time subscriptions and runs validation rules in two tiers per D-11
- Instant tier (12 rules) fires on every data change with 300ms debounce; medium tier (VALD-10, VALD-11) fires only when generatedDocs timestamps change
- Financial totals read from exact Firestore paths: budget_output.totalCentavos, A9d content.structured.grandTotal, E1 content.structured.total_centavos
- Added 'validacion' to WizardScreen type, sidebar navigation with traffic light, and full-width layout in WizardShell
- Created functional ValidationDashboard with summary banner, severity counts, viability score preview, and rule status list
- Installed shadcn accordion and collapsible components for Plan 06 dashboard UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useValidation hook with tiered execution and Firestore financial data wiring** - `7e0f58f6` (feat)
2. **Task 2: Install shadcn components and update wizard navigation for validation screen** - `b06abe5d` (feat)

## Files Created/Modified
- `src/hooks/useValidation.ts` - Real-time validation hook with tiered rule execution, 7 Firestore subscriptions, 300ms debounce, merged report output
- `src/components/validation/ValidationDashboard.tsx` - Validation screen component with summary banner, severity counts, viability preview, rule list
- `src/components/ui/accordion.tsx` - shadcn accordion component (for rule detail expansion in Plan 06)
- `src/components/ui/collapsible.tsx` - shadcn collapsible component (for severity sections in Plan 06)
- `src/stores/wizardStore.ts` - Added 'validacion' to WizardScreen type union
- `src/components/wizard/WizardSidebar.tsx` - Added Validacion navigation entry with traffic light below Generacion
- `src/components/wizard/WizardShell.tsx` - Added validacion case to renderScreen, full-width layout handling, ValidationDashboard import
- `src/locales/es.ts` - Added screen7: 'Validacion' to wizard section

## Decisions Made
- useValidation hook manages 7 independent Firestore subscriptions with separate loading states per source, only running validation when all have loaded -- prevents partial/incorrect validation results
- Medium rule results persist in React state between instant re-runs. The combined report always merges the freshest instant results with the last medium results, so medium-tier rules are never lost when data changes trigger instant re-runs
- Created ValidationDashboard as a functional component (not empty stub) that wires useValidation and renders a summary view with severity counts and rule list -- this serves as the Plan 06 route target and provides immediate visual feedback even before the full dashboard UI is built
- Validacion screen uses the same full-width layout pattern established for the generation screen (sidebar + flex-1 main without max-width constraint)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Created ValidationDashboard component as import target for WizardShell**
- **Found during:** Task 2 (WizardShell integration)
- **Issue:** Plan specified adding `import ValidationDashboard` to WizardShell and the validacion case, but no ValidationDashboard component existed. Plan 06 covers the full dashboard UI. WizardShell cannot import a non-existent module.
- **Fix:** Created `src/components/validation/ValidationDashboard.tsx` with functional summary display (loading state, summary banner, severity counts grid, viability preview, rule status list) that wires the useValidation hook. This is not a stub -- it renders real validation data.
- **Files created:** src/components/validation/ValidationDashboard.tsx
- **Verification:** TypeScript compiles, component renders all hook data
- **Committed in:** b06abe5d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality)
**Impact on plan:** The plan implicitly required a component to exist for the import. Created a functional version that Plan 06 will extend into the full accordion-based dashboard. No scope creep.

## Known Stubs

The following data extraction functions in useValidation.ts return undefined because GeneratedDocClient only contains metadata (docId, docName, generatedAt), not full document content:

- `extractFeesFromContracts()` (line ~453) -- returns undefined; needs full C2b/B3 content to extract fee amounts
- `extractFeesFromBudget()` (line ~464) -- returns undefined; needs full A9b content to extract fee line items
- `extractFeesFromCashFlow()` (line ~475) -- returns undefined; needs full A9d content to extract fee line items

These stubs do NOT prevent the plan's goal from being achieved. The fee cross-match rule (VALD-03) gracefully returns 'skip' when fee data is undefined. These will be resolved when the validation hook gains access to full document content (either by extending useGeneratedDocs to include content or by adding dedicated Firestore subscriptions for fee-bearing documents).

## Issues Encountered
None.

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- useValidation hook ready for consumption by Plan 06 dashboard components (accordion-based rule rows, severity sections, score estimation panel)
- ValidationDashboard component provides a working route target that Plan 06 will enhance with full UI per UI-SPEC
- shadcn accordion, collapsible, and tabs components installed and ready for Plan 06 dashboard layout
- All 122 validation tests continue to pass
- TypeScript compiles without errors

## Self-Check: PASSED

All 4 created files verified present. Commits 7e0f58f6 and b06abe5d verified in git log.

---
*Phase: 04-validation-dashboard*
*Completed: 2026-03-24*
