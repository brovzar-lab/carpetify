---
phase: 13-activity-tracking
plan: 01
subsystem: collaboration
tags: [firestore, activity-log, real-time, onSnapshot, date-fns, zustand]

# Dependency graph
requires:
  - phase: 12-realtime-collaboration
    provides: "Presence, locking, and collaboration hooks in WizardShell"
  - phase: 11-rbac-access-control
    provides: "Role-based access, collaborators map, userProjects collection"
  - phase: 10
    provides: "Firebase Auth, useAuth hook, appStore with currentProjectRole"
provides:
  - "ActivityLogEntry type and data service (write, coalesce, field labels)"
  - "useAutoSave activity logging integration (field diff, fire-and-forget)"
  - "useActivityLog real-time subscription hook with pagination"
  - "ActivityTab UI with day-grouped feed, filter pills, badge count"
  - "Actividad screen in WizardShell with sidebar badge"
  - "Firestore composite indexes for activity_log subcollection"
  - "Complete activity locale strings in es.ts (25+ keys)"
affects: [13-activity-tracking-02, 14-document-versioning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget activity logging after successful save"
    - "Client-side field diff via JSON.stringify key comparison"
    - "30-second coalescing window to prevent activity flood"
    - "useRef for user/role in useCallback to avoid stale closures"
    - "lastViewedActivity timestamp on userProjects for badge count"

key-files:
  created:
    - src/services/activityLog.ts
    - src/hooks/useActivityLog.ts
    - src/components/collaboration/ActivityEntry.tsx
    - src/components/collaboration/ActivityFilters.tsx
    - src/components/collaboration/ActivityTab.tsx
  modified:
    - src/hooks/useAutoSave.ts
    - src/locales/es.ts
    - src/stores/wizardStore.ts
    - src/components/wizard/WizardSidebar.tsx
    - src/components/wizard/WizardShell.tsx
    - firestore.indexes.json

key-decisions:
  - "Client-side field diff using JSON.stringify per-key comparison (flat form data, no deep objects)"
  - "useRef for user and role in doSave to avoid adding to useCallback dependency array"
  - "Badge count via useActivityBadge hook inside WizardSidebar (not lifted to WizardShell)"
  - "lastViewedActivity read once on mount via getDoc, not real-time subscription (badge still updates via activity_log onSnapshot)"

patterns-established:
  - "Activity coalescing: query last entry, merge if <30s old, else create new"
  - "Fire-and-forget pattern: .catch() swallows errors, activity never blocks save"
  - "Day grouping: startOfDay → Map → isToday/isYesterday/format headers"

requirements-completed: [COLLAB-04]

# Metrics
duration: 6min
completed: 2026-03-26
---

# Phase 13 Plan 01: Activity Tracking Summary

**Field-level activity log with useAutoSave integration, 30-second coalescing, day-grouped feed with filter pills, and sidebar badge count**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T17:49:49Z
- **Completed:** 2026-03-26T17:56:08Z
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments
- Activity log data service with 21 field labels, 6 screen labels, buildChangeSummary, writeActivityEntry, and coalesceOrCreate (30-second window)
- useAutoSave now computes field diffs after every successful save and writes activity entries via fire-and-forget coalesceOrCreate
- useActivityLog hook with real-time onSnapshot subscription and cursor-based pagination (startAfter)
- Full Actividad tab UI: ActivityFilters with pill toggles (radiogroup accessibility), ActivityEntry with avatar/role/icon/timestamp, ActivityTab with day-grouped feed, client-side AND filtering, empty/loading states, lastViewedActivity badge management
- Sidebar shows Actividad link with badge count of unseen entries since last viewed

## Task Commits

Each task was committed atomically:

1. **Task 1: Activity log data service, locale strings, and Firestore index** - `0482072c` (feat)
2. **Task 2: useAutoSave activity integration and useActivityLog hook** - `d21facfa` (feat)
3. **Task 3: ActivityEntry, ActivityFilters, and ActivityTab UI components** - `6d1efe1b` (feat)
4. **Task 4: WizardShell, WizardSidebar, and wizardStore integration** - `5ee903cc` (feat)

## Files Created/Modified
- `src/services/activityLog.ts` - Activity log data service with types, labels, summary builder, write/coalesce logic
- `src/hooks/useActivityLog.ts` - Real-time activity log subscription hook with pagination
- `src/hooks/useAutoSave.ts` - Modified to add field diff and fire-and-forget activity logging after save
- `src/components/collaboration/ActivityEntry.tsx` - Single entry row with avatar, role badge, icon, summary, timestamp
- `src/components/collaboration/ActivityFilters.tsx` - Pill toggle filters for team member and event type
- `src/components/collaboration/ActivityTab.tsx` - Full activity tab with day-grouped feed, filtering, pagination, badge management
- `src/stores/wizardStore.ts` - Added 'actividad' to WizardScreen union type
- `src/components/wizard/WizardSidebar.tsx` - Added Actividad link with useActivityBadge badge count
- `src/components/wizard/WizardShell.tsx` - Added actividad case to renderScreen and isFullWidth
- `src/locales/es.ts` - Added screen9 and complete activity section (25+ locale keys)
- `firestore.indexes.json` - Added 3 composite indexes for activity_log subcollection

## Decisions Made
- Used `useRef` for user and currentProjectRole inside doSave to avoid stale closure issues without adding them to the useCallback dependency array (which would cause re-creation on every auth state change)
- Badge count logic placed inside WizardSidebar via useActivityBadge hook rather than lifting to WizardShell, keeping WizardShell clean
- lastViewedActivity read via one-time getDoc on mount, not real-time subscription -- the badge still updates in real-time because the activity_log onSnapshot provides the new entries count
- Added a third composite index (userId + screen + createdAt) for the coalesceOrCreate query which needs all three fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Activity tracking system is complete and functional for all auto-save events
- Plan 02 will add invitation email flow (Resend integration), which will also write activity entries for team events (invite/accept/decline)
- Server-side actions (generation, export) will need their own activity writes in future phases when those Cloud Functions are modified

## Self-Check: PASSED

All 5 created files verified on disk. All 4 task commit hashes verified in git log.

---
*Phase: 13-activity-tracking*
*Completed: 2026-03-26*
