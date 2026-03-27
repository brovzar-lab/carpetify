---
phase: 12-realtime-collaboration
plan: 01
subsystem: collaboration
tags: [firebase-rtdb, presence, locking, realtime, hooks, idle-detection]

# Dependency graph
requires:
  - phase: 10-auth-identity
    provides: "Firebase Auth, useAuth hook, requireAuth Cloud Function helper"
  - phase: 11-rbac-access-control
    provides: "ProjectRole type, requireProjectAccess, requireRole, appStore.currentProjectRole"
provides:
  - "RTDB client export (rtdb) in firebase.ts"
  - "Path helpers (presencePath, lockPath, projectPresencePath) in rtdb.ts"
  - "usePresence hook for writing/cleaning presence with onDisconnect"
  - "useProjectPresence hook for reading all project user presence"
  - "useSectionLock hook for atomic lock acquire/release/renew"
  - "useIdleDetection hook for idle dimming and lock timeout"
  - "forceBreakLock Cloud Function for productor-only lock removal"
  - "RTDB security rules for auth-gated presence and lock paths"
affects: [12-02-PLAN, 12-03-PLAN]

# Tech tracking
tech-stack:
  added: [firebase/database (RTDB client)]
  patterns: [RTDB presence with onDisconnect, transactional locking, idle detection callbacks]

key-files:
  created:
    - src/lib/rtdb.ts
    - src/hooks/usePresence.ts
    - src/hooks/useProjectPresence.ts
    - src/hooks/useSectionLock.ts
    - src/hooks/useIdleDetection.ts
    - functions/src/collaboration/forceBreakLock.ts
    - database.rules.json
  modified:
    - src/lib/firebase.ts
    - firebase.json
    - .env.example
    - functions/src/index.ts

key-decisions:
  - "onDisconnect queued before set() to prevent orphaned presence entries on race conditions (Pitfall 1)"
  - "Server time offset used for lock timestamps to handle clock skew between client and Firebase"
  - "Lock duration is 2 minutes with 30s idle threshold and 60s lock timeout"

patterns-established:
  - "RTDB path helpers centralized in rtdb.ts for consistent path construction"
  - "Presence data written with onDisconnect safety for automatic cleanup"
  - "Lock acquisition via runTransaction for atomic compare-and-set semantics"
  - "Idle detection via activity events + visibilitychange with configurable thresholds"

requirements-completed: [COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-07]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 12 Plan 01: RTDB Collaboration Infrastructure Summary

**RTDB presence/lock plumbing with 4 hooks (usePresence, useProjectPresence, useSectionLock, useIdleDetection), forceBreakLock Cloud Function, and auth-gated security rules**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T01:45:39Z
- **Completed:** 2026-03-26T01:48:39Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- RTDB client initialized and exported from firebase.ts with databaseURL config and path helpers in rtdb.ts
- Four collaboration hooks: presence writing/reading, atomic section locking with transaction-based acquire/release/renew, and idle detection with configurable thresholds
- forceBreakLock Cloud Function with productor-only guard using Admin RTDB SDK
- RTDB security rules enforcing auth, ownership, and lock expiry validation

## Task Commits

Each task was committed atomically:

1. **Task 1: RTDB infrastructure and configuration** - `f2215330` (feat)
2. **Task 2: Presence and lock hooks with idle detection** - `3e955064` (feat)
3. **Task 3: Force-break lock Cloud Function and registration** - `910e52dc` (feat)

## Files Created/Modified
- `src/lib/firebase.ts` - Added getDatabase import, databaseURL config, rtdb export, RTDB emulator comment
- `src/lib/rtdb.ts` - New: RTDB path helpers (presencePath, lockPath, projectPresencePath)
- `src/hooks/usePresence.ts` - New: Presence writing hook with onDisconnect cleanup and idle/active status methods
- `src/hooks/useProjectPresence.ts` - New: Presence reading hook returning PresenceEntry[] for all online users
- `src/hooks/useSectionLock.ts` - New: Atomic lock acquire/release/renew via runTransaction with server time offset
- `src/hooks/useIdleDetection.ts` - New: Idle (30s) and lock timeout (60s) detection via activity events and visibilitychange
- `functions/src/collaboration/forceBreakLock.ts` - New: Productor-only Cloud Function to force-remove RTDB locks
- `functions/src/index.ts` - Registered forceBreakLock export
- `database.rules.json` - New: RTDB security rules for presence and locks paths
- `firebase.json` - Added database section pointing to rules file
- `.env.example` - Added VITE_FIREBASE_DATABASE_URL variable

## Decisions Made
- onDisconnect is queued BEFORE set() per Firebase Pitfall 1 to prevent orphaned presence entries if connection drops between set and onDisconnect
- Server time offset (.info/serverTimeOffset) used in lock acquisition to handle clock skew between client and Firebase server
- Lock duration set to 120,000ms (2 min) with idle threshold at 30,000ms (30s) and lock timeout at 60,000ms (60s) per plan spec
- Expired locks cleaned up opportunistically when observed via onValue subscription (client-side garbage collection)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**VITE_FIREBASE_DATABASE_URL must be added to `.env`** with the project's Realtime Database URL (e.g., `https://carpetify-mx-default-rtdb.firebaseio.com`). This is required for the RTDB client to connect. The Realtime Database must be created in the Firebase Console if it does not already exist.

## Known Stubs

None. All hooks export their full API. No UI components are created in this plan (they ship in Plan 02).

## Next Phase Readiness
- All 4 hooks ready for consumption by Plan 02 (UI components: presence avatars, lock indicators, idle overlay)
- forceBreakLock callable ready for Plan 02 force-break UI
- Plan 03 (shell integration) will wire usePresence and useIdleDetection into WizardShell
- RTDB security rules ready for deployment alongside Firestore rules

## Self-Check: PASSED

All 11 files verified present. All 3 task commits verified in git log.

---
*Phase: 12-realtime-collaboration*
*Completed: 2026-03-26*
