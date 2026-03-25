---
phase: 01-scaffold-intake-wizard
plan: 02
subsystem: ui
tags: [react, tanstack-query, shadcn, dashboard, erpi, crud]

# Dependency graph
requires:
  - phase: 01-scaffold-intake-wizard/01
    provides: "React scaffold, Firebase config, Firestore schemas, services, locales, format utils"
provides:
  - "Dashboard page with period-grouped project cards and CRUD"
  - "ERPI settings page with company form and prior projects list"
  - "AppHeader with dark mode system preference detection"
  - "QueryClientProvider and Toaster wired globally"
affects: [01-scaffold-intake-wizard/03, 01-scaffold-intake-wizard/04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["useQuery/useMutation for Firestore data", "auto-save with 1500ms debounce", "es.ts locale references for all UI text"]

key-files:
  created:
    - src/components/dashboard/DashboardPage.tsx
    - src/components/dashboard/ProjectCard.tsx
    - src/components/dashboard/PeriodGroup.tsx
    - src/components/dashboard/EmptyState.tsx
    - src/components/erpi/ERPISettingsPage.tsx
    - src/components/erpi/ERPICompanyForm.tsx
    - src/components/erpi/PriorProjectsList.tsx
    - src/components/layout/AppHeader.tsx
  modified:
    - src/App.tsx
    - src/main.tsx

key-decisions:
  - "Custom useAutoSaveERPI hook for ERPI singleton instead of project-scoped useAutoSave"
  - "QueryClientProvider and Toaster placed in main.tsx wrapping App"

patterns-established:
  - "useQuery/useMutation pattern: all Firestore reads via useQuery, writes via useMutation with invalidation"
  - "Locale-first UI: all strings from es.ts, grep for es.dashboard.* or es.erpi.* to find text"
  - "Period grouping: projects grouped by PERIODOS_EFICINE key, unassigned under 'Sin periodo asignado'"

requirements-completed: [INTK-01, INTK-02, INTK-03, INTK-07, INTK-09, INTK-10]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 01 Plan 02: Dashboard and ERPI Settings Summary

**Project dashboard with period-grouped cards, CRUD operations, and ERPI company settings page with auto-save**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T01:04:59Z
- **Completed:** 2026-03-22T01:08:58Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Dashboard at `/` with "Mis Proyectos" title, period-grouped project cards, skeleton loading, and empty state
- Project CRUD: quick create (no modal, no limit per D-07), delete with Spanish confirmation dialog, clone with toast
- Card click navigates to `/project/{id}/datos` serving as project selector (INTK-03) with data isolated by projectId
- ERPI settings page at `/erpi` with company form (razon social, RFC, representante legal, domicilio fiscal) and prior projects dynamic list
- Dark mode via system preference detection (D-13)
- QueryClientProvider and Toaster wired globally in main.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Dashboard page with project cards, period grouping, and CRUD operations** - `68b4e76b` (feat)
2. **Task 2: Build ERPI Settings page with company form and prior projects list** - `11cbf6a6` (feat)

## Files Created/Modified
- `src/components/dashboard/DashboardPage.tsx` - Main dashboard with period-grouped cards, skeleton loading, CRUD mutations
- `src/components/dashboard/ProjectCard.tsx` - Card with budget display (formatMXN), delete dialog, clone, navigation
- `src/components/dashboard/PeriodGroup.tsx` - Period header + responsive grid (1/2/3 columns)
- `src/components/dashboard/EmptyState.tsx` - Zero-project state with create CTA
- `src/components/erpi/ERPISettingsPage.tsx` - ERPI settings with auto-save, back navigation, save status
- `src/components/erpi/ERPICompanyForm.tsx` - Company data form with react-hook-form and zod resolver
- `src/components/erpi/PriorProjectsList.tsx` - Dynamic prior projects list with add/remove/estatus select
- `src/components/layout/AppHeader.tsx` - Dark mode system preference detection
- `src/App.tsx` - Routes updated for DashboardPage and ERPISettingsPage
- `src/main.tsx` - QueryClientProvider and Toaster added

## Decisions Made
- Created a custom `useAutoSaveERPI` hook for ERPI settings since the existing `useAutoSave` hook is scoped to project paths (`projects/{projectId}/{path}`). ERPI is a global singleton at `erpi_settings/default`.
- Placed QueryClientProvider in main.tsx (wrapping App) rather than inside App.tsx to keep provider hierarchy clean and accessible from all routes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
- `ProjectCard.tsx` completion percentage hardcoded to 0% - will be computed from filled fields in future plans
- `ProjectCard.tsx` readiness defaults to `blockers(0)` - will be driven by validation engine (Phase 3)

## Next Phase Readiness
- Dashboard and ERPI pages functional, ready for wizard screens (Plan 03/04)
- All CRUD operations wired through Firestore services
- React Query caching and mutations established as the data-fetching pattern

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (68b4e76b, 11cbf6a6) found in git log.
