---
phase: 12-realtime-collaboration
plan: 03
subsystem: collaboration
tags: [presence-wiring, section-locking, idle-detection, lock-aware-autosave, rtdb-cleanup]

# Dependency graph
requires:
  - phase: 12-realtime-collaboration
    plan: 01
    provides: "usePresence, useProjectPresence, useSectionLock, useIdleDetection hooks"
  - phase: 12-realtime-collaboration
    plan: 02
    provides: "PresenceAvatarRow, SidebarPresenceDot, LockBanner, ForceBreakDialog UI components"
  - phase: 11-rbac-access-control
    provides: "canEditScreen, role-based access, ReadOnlyBanner"
provides:
  - "Lock-aware useAutoSave with flushAndWait for save-before-release coordination"
  - "WizardShell wired with presence, section lock, idle detection, and edit mode toggling"
  - "WizardSidebar with per-screen presence dots showing who is on which screen"
  - "AppHeader presence avatar row showing all online project members"
  - "Sign-out RTDB cleanup preventing ghost presence entries"
  - "Complete real-time collaboration feature: presence, locking, idle release, force-break"
affects: [13-activity-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns: [lock-owned autosave gating, flush-before-release, edit-intent locking, idle-triggered lock release]

key-files:
  created: []
  modified:
    - src/hooks/useAutoSave.ts
    - src/components/wizard/WizardShell.tsx
    - src/components/wizard/WizardSidebar.tsx
    - src/components/layout/AppHeader.tsx
    - src/locales/es.ts

key-decisions:
  - "Lock acquired on edit intent (button click), not on page open -- prevents phantom locks"
  - "Auto-save flushes pending data before releasing lock to prevent data loss"
  - "Role restriction takes visual priority over lock banner per D-14"
  - "Sign-out performs best-effort RTDB presence removal before Firebase signOut"

patterns-established:
  - "Edit-intent lock pattern: user clicks Editar to acquire lock, Terminar edicion to release"
  - "flushAndWait before releaseLock: always persist pending changes before giving up write access"
  - "Lock ownership gates auto-save: lockOwned=false skips doSave entirely"
  - "Idle cascade: 30s dims presence, 60s auto-releases lock and stops editing"

requirements-completed: [COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-05, COLLAB-07]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 12 Plan 03: Shell Integration Summary

**WizardShell/Sidebar/AppHeader wired with presence hooks, section lock on edit intent, idle auto-release, lock-aware auto-save with flush-before-release, and RTDB sign-out cleanup**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T14:30:29Z
- **Completed:** 2026-03-26T14:35:29Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 6

## Accomplishments
- Extended useAutoSave with lockOwned gating, onSaveComplete callback, and flushAndWait for lock coordination (D-12, Pitfall 5)
- Wired WizardShell with usePresence, useSectionLock, useIdleDetection, LockBanner, ForceBreakDialog, and edit mode state management (D-01, D-02, D-03, D-14)
- Added presence dots to WizardSidebar via SidebarPresenceDot component (D-05)
- Added PresenceAvatarRow to AppHeader for online team member visibility (D-05)
- Implemented sign-out RTDB cleanup in handleSignOut to prevent ghost presence entries (Pitfall 2)
- All 7 collaboration features verified by human: presence avatars, sidebar dots, lock flow, role badge, force break, idle release, sign-out cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend useAutoSave + wire WizardShell with presence/lock/idle** - `f9a59b8d` (feat)
2. **Task 2: AppHeader presence avatar row and sign-out RTDB cleanup** - `dba67332` (feat)
3. **Task 3: Verify real-time collaboration flow** - checkpoint:human-verify (no code commit -- user approved all 7 features)

**Deferred items:** `9d6cb03c` (chore: log pre-existing build errors)

## Files Created/Modified
- `src/hooks/useAutoSave.ts` - Added lockOwned parameter, onSaveComplete callback, flushAndWait method for lock coordination
- `src/components/wizard/WizardShell.tsx` - Wired usePresence, useSectionLock, useIdleDetection; added edit mode state, LockBanner, ForceBreakDialog, and lock release on screen change
- `src/components/wizard/WizardSidebar.tsx` - Added presenceList prop and SidebarPresenceDot rendering per screen
- `src/components/layout/AppHeader.tsx` - Added PresenceAvatarRow display and RTDB presence cleanup in handleSignOut
- `src/locales/es.ts` - Additional collaboration strings for edit mode buttons (added in Task 1)
- `.planning/phases/12-realtime-collaboration/deferred-items.md` - Pre-existing build errors documented

## Decisions Made
- Lock acquired on explicit edit intent (Editar button click), not automatically on page open -- this prevents phantom locks when users are just viewing
- Auto-save performs flushAndWait before releasing lock to ensure no pending data is lost when edit mode ends
- Role restriction (ReadOnlyBanner) takes visual priority over lock banner per D-14 -- users who cannot edit a screen never see lock-related UI
- Sign-out RTDB cleanup is best-effort with try/catch: if RTDB removal fails, sign-out still proceeds and the 2-minute onDisconnect timeout handles cleanup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing TypeScript errors in unrelated files**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** `useProjectAccess.ts` missing return type properties and `scroll-area.tsx` unused React import -- both pre-existing, not caused by Plan 12-03
- **Fix:** Documented in deferred-items.md as out-of-scope (shadcn files must not be manually edited per CLAUDE.md)
- **Files modified:** `.planning/phases/12-realtime-collaboration/deferred-items.md`
- **Committed in:** `9d6cb03c`

---

**Total deviations:** 1 documented (pre-existing errors logged to deferred-items, not fixed)
**Impact on plan:** No scope creep. Pre-existing errors do not affect collaboration functionality.

## Issues Encountered

Pre-existing TypeScript errors in `useProjectAccess.ts` and `scroll-area.tsx` caused `tsc --noEmit` to report failures unrelated to this plan's changes. These were documented in deferred-items.md rather than fixed, per the scope boundary rule.

## Known Stubs

None. All modified files are fully wired with live data sources. No placeholder data, no TODO markers, no hardcoded empty values.

## Next Phase Readiness
- Real-time collaboration feature is complete: presence, locking, idle detection, force-break, and RTDB cleanup all verified
- Phase 12 is fully finished (3/3 plans complete)
- Phase 13 (Activity Tracking & Invitation Flow) can begin -- it depends on Phase 12 collaboration infrastructure
- Deferred items (pre-existing TS errors) should be addressed in a maintenance pass but do not block Phase 13

## Self-Check: PASSED

All 6 files verified present. All 3 task commits verified in git log.

---
*Phase: 12-realtime-collaboration*
*Completed: 2026-03-26*
