---
phase: 11-rbac-access-control
plan: 03
subsystem: ui
tags: [rbac, react, zustand, permissions, access-control, read-only, dashboard]

# Dependency graph
requires:
  - phase: 11-rbac-access-control plan 01
    provides: "ProjectRole type, ROLE_PERMISSIONS constant, 6 permission helper functions, collaborators/memberUIDs on project documents, RBAC locale strings"
provides:
  - "useProjectAccess hook returning hasAccess, role, loading, ownerName for active project"
  - "AccessDenied page with Spanish message for non-members (AUTH-06)"
  - "ReadOnlyBanner component showing productor name on view-only screens (D-04)"
  - "WizardShell access gate blocking non-members from project content"
  - "Role-aware sidebar with lock indicators on non-editable screens"
  - "GenerationScreen hides pipeline controls for unauthorized roles (D-05)"
  - "ExportScreen hides export/download actions for unauthorized roles (D-05)"
  - "Dashboard project cards show role badge and hide delete for non-owners (D-05)"
  - "currentProjectRole field in Zustand appStore synced from useProjectAccess"
affects: [12-collaboration, 13-activity-log]

# Tech tracking
tech-stack:
  added: []
  patterns: [access gate pattern with useProjectAccess at WizardShell top, role synced to Zustand for downstream components, D-05 hidden-not-disabled pattern for unauthorized actions]

key-files:
  created:
    - src/hooks/useProjectAccess.ts
    - src/components/auth/AccessDenied.tsx
    - src/components/common/ReadOnlyBanner.tsx
  modified:
    - src/stores/appStore.ts
    - src/components/wizard/WizardShell.tsx
    - src/components/wizard/WizardSidebar.tsx
    - src/components/generation/GenerationScreen.tsx
    - src/components/export/ExportScreen.tsx
    - src/components/dashboard/DashboardPage.tsx
    - src/components/dashboard/PeriodGroup.tsx
    - src/components/dashboard/ProjectCard.tsx
    - src/locales/es.ts

key-decisions:
  - "useProjectAccess hook uses React Query with 30s staleTime to avoid excessive Firestore reads during wizard navigation"
  - "Role synced to Zustand appStore via useEffect so downstream components (GenerationScreen, ExportScreen) can read role without prop drilling"
  - "Hidden-not-disabled pattern (D-05): unauthorized actions are conditionally rendered, not shown as disabled buttons"
  - "ReadOnlyBanner uses amber/warning color scheme to distinguish from error states"

patterns-established:
  - "Access gate pattern: useProjectAccess at WizardShell top, returns early with AccessDenied or loading spinner"
  - "Role-aware rendering: read currentProjectRole from appStore, conditionally render UI elements"
  - "ReadOnlyBanner above screen content when canEditScreen returns false for current role"

requirements-completed: [AUTH-04, AUTH-06]

# Metrics
duration: 6min
completed: 2026-03-26
---

# Phase 11 Plan 03: UI Enforcement Layer Summary

**RBAC access gate in WizardShell with AccessDenied page for non-members, ReadOnlyBanner on view-only screens, hidden pipeline/export/delete actions per role, and role badges on dashboard project cards**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T00:58:40Z
- **Completed:** 2026-03-26T01:05:36Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Created useProjectAccess hook that checks ownerId/collaborators via React Query and syncs role to Zustand appStore
- Built AccessDenied page with ShieldAlert icon and Spanish message for unauthorized project URLs (AUTH-06)
- Created ReadOnlyBanner component with amber styling and productor name substitution (D-04)
- Wired WizardShell as the RBAC gate: loading spinner, AccessDenied for non-members, ReadOnlyBanner on non-editable screens
- Added lock icon indicators on sidebar for screens the user cannot edit
- Hid PipelineControl in GenerationScreen and export actions in ExportScreen for unauthorized roles (D-05)
- Added role badge on dashboard project cards and hid delete button for non-owners (D-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useProjectAccess hook, AccessDenied page, and update appStore** - `488d6da8` (feat)
2. **Task 2: Wire access gate into WizardShell and role-based UI gating** - `962b30a6` (feat)

## Files Created/Modified
- `src/hooks/useProjectAccess.ts` - Hook returning hasAccess, role, loading, ownerName with 30s React Query cache
- `src/components/auth/AccessDenied.tsx` - Access denied page with ShieldAlert icon and back-to-dashboard link
- `src/components/common/ReadOnlyBanner.tsx` - Amber banner with lock icon showing "Solo lectura" message
- `src/stores/appStore.ts` - Added currentProjectRole field and setCurrentProjectRole setter
- `src/components/wizard/WizardShell.tsx` - Access gate with loading/denied states, ReadOnlyBanner on non-editable screens
- `src/components/wizard/WizardSidebar.tsx` - Lock icons on non-editable screens using canEditScreen
- `src/components/generation/GenerationScreen.tsx` - PipelineControl hidden when canRunPipeline is false
- `src/components/export/ExportScreen.tsx` - Export readiness card and download card hidden when canExport is false
- `src/components/dashboard/DashboardPage.tsx` - Passes userId to PeriodGroup for role resolution
- `src/components/dashboard/PeriodGroup.tsx` - Resolves user role per project and passes to ProjectCard
- `src/components/dashboard/ProjectCard.tsx` - Role badge display and conditional delete button
- `src/locales/es.ts` - Added rbac.loadingAccess locale string

## Decisions Made
- Used React Query with 30s staleTime for useProjectAccess to avoid redundant Firestore reads when navigating between wizard screens (each screen change re-renders WizardShell)
- Synced role to Zustand appStore rather than passing as props, because GenerationScreen and ExportScreen are deep in the component tree and need role info without prop drilling through every screen component
- Used `render={<Link to="/" />}` composition pattern for Button+Link in AccessDenied, consistent with base-ui/react Button API used across the project
- ReadOnlyBanner placed above screen content (not as overlay) to avoid interfering with form interaction in view-only mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Button composition for AccessDenied back link**
- **Found during:** Task 1 (AccessDenied component)
- **Issue:** Used `asChild` prop which doesn't exist on base-ui/react Button -- project uses `render` prop pattern
- **Fix:** Changed `<Button asChild><Link>` to `<Button render={<Link to="/" />}>` matching established project pattern
- **Files modified:** src/components/auth/AccessDenied.tsx
- **Verification:** `tsc --noEmit` passes with zero errors
- **Committed in:** 488d6da8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial API correction. No scope change.

## Issues Encountered

- Pre-existing TypeScript error in `src/components/project/InviteModal.tsx` (from parallel Plan 11-02 agent) causes `tsc -b` to fail, but `tsc --noEmit` passes cleanly confirming Plan 11-03 code is error-free. Logged to deferred-items.md.

## Known Stubs

None -- all components are fully functional with real data sources wired.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- RBAC UI enforcement layer complete: non-members see AccessDenied, collaborators see read-only banners and hidden actions per role
- Phase 12 (collaboration) can build on ReadOnlyBanner for section-level locking
- Phase 12 can pass `readOnly` prop to individual screen components for form-level disabling
- currentProjectRole in appStore available for any future component that needs role awareness

## Self-Check: PASSED

- All 12 created/modified files verified present on disk
- Both task commits verified in git history (488d6da8, 962b30a6)
- `tsc --noEmit` passes with zero errors (pre-existing InviteModal.tsx error from parallel agent only affects `tsc -b`)

---
*Phase: 11-rbac-access-control*
*Completed: 2026-03-26*
