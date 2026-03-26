---
phase: 12-realtime-collaboration
plan: 02
subsystem: collaboration
tags: [presence-avatar, lock-banner, force-break, ui-components, spanish-locale]

# Dependency graph
requires:
  - phase: 12-realtime-collaboration
    plan: 01
    provides: "PresenceEntry type from useProjectPresence, LockHolder/LockState from useSectionLock, forceBreakLock Cloud Function"
  - phase: 11-rbac-access-control
    provides: "ProjectRole type, es.rbac.roles for role name display"
provides:
  - "PresenceAvatar component with colored ring (green/orange/dimmed) and photo/initials"
  - "PresenceAvatarRow component for horizontal header display"
  - "SidebarPresenceDot component for sidebar screen indicators"
  - "LockBanner component with Spanish conflict message and force-break action"
  - "ForceBreakDialog component calling forceBreakLock Cloud Function"
  - "collaboration section in es.ts with lock, force-break, and presence strings"
affects: [12-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [props-based collaboration components consuming Plan 01 hook types, es.rbac.roles for role display names]

key-files:
  created:
    - src/components/collaboration/PresenceAvatar.tsx
    - src/components/collaboration/PresenceAvatarRow.tsx
    - src/components/collaboration/SidebarPresenceDot.tsx
    - src/components/collaboration/LockBanner.tsx
    - src/components/collaboration/ForceBreakDialog.tsx
  modified:
    - src/locales/es.ts

key-decisions:
  - "Used title attribute for avatar tooltip (simple, no external tooltip library needed)"
  - "Overlapping avatar style (-space-x-1) activates at 3+ users for compact display"
  - "ForceBreakDialog uses shadcn Dialog (not AlertDialog which does not exist in this project)"
  - "Role name resolution via es.rbac.roles with raw string fallback for unknown roles"

patterns-established:
  - "getRoleName() helper pattern: cast to ProjectRole and fall back to raw string"
  - "Collaboration components are pure props-based, no hook calls -- hooks wired in Plan 03 shell integration"

requirements-completed: [COLLAB-03, COLLAB-07]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 12 Plan 02: Collaboration UI Components Summary

**5 presence/lock UI components (avatar ring colors, lock banner, force-break dialog) plus Spanish collaboration strings in es.ts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T02:42:49Z
- **Completed:** 2026-03-26T02:45:49Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added collaboration section to es.ts with lock messages (D-16), force-break strings (D-04), and presence labels (D-05/D-06/D-07)
- Created PresenceAvatar with colored ring system: green (viewing), orange (editing), dimmed (idle), plus Google photo or initials fallback
- Created PresenceAvatarRow for horizontal header display with overlapping style at 3+ users
- Created SidebarPresenceDot with tiny colored circles for per-screen user indicators (max 3 + overflow)
- Created LockBanner with Spanish conflict message, Lock icon, and optional force-break button
- Created ForceBreakDialog with confirmation dialog calling forceBreakLock Cloud Function via httpsCallable

## Task Commits

Each task was committed atomically:

1. **Task 1: Spanish locale strings for collaboration** - `766a69f0` (feat)
2. **Task 2: Collaboration UI components** - `babe03e7` (feat)

## Files Created/Modified
- `src/locales/es.ts` - Added collaboration section with lock, force-break, and presence strings
- `src/components/collaboration/PresenceAvatar.tsx` - Single avatar with colored ring, photo/initials, idle dot
- `src/components/collaboration/PresenceAvatarRow.tsx` - Horizontal avatar row with overlap for 3+ users
- `src/components/collaboration/SidebarPresenceDot.tsx` - Tiny colored dots for sidebar screen items
- `src/components/collaboration/LockBanner.tsx` - Orange conflict banner with lock icon and force-break action
- `src/components/collaboration/ForceBreakDialog.tsx` - Confirmation dialog for force-breaking locks via Cloud Function

## Decisions Made
- Used `title` attribute for avatar tooltip instead of an external tooltip library -- simple and sufficient for initial implementation
- Overlapping avatar style (`-space-x-1`) activates at 3+ users for compact display in the header
- ForceBreakDialog uses shadcn Dialog (AlertDialog component does not exist in this project)
- Role name resolution uses `es.rbac.roles` with raw string fallback for any roles not in the map

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None. All components are fully implemented with their props interfaces. No placeholder data, no TODO markers.

## Next Phase Readiness
- All 5 components ready for Plan 03 (shell integration) to wire into WizardShell, WizardSidebar, and AppHeader
- Components are pure props-based: Plan 03 will connect them to useProjectPresence and useSectionLock hooks
- es.ts collaboration strings ready for lock lifecycle toasts in Plan 03

## Self-Check: PASSED

All 6 files verified present. Both task commits verified in git log.

---
*Phase: 12-realtime-collaboration*
*Completed: 2026-03-26*
