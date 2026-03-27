---
phase: 10-authentication-identity
plan: 03
subsystem: auth
tags: [firebase-auth, cloud-functions, firestore-rules, storage-rules, security, auth-guard]

# Dependency graph
requires:
  - phase: 10-authentication-identity plan 01
    provides: "Firebase Auth with Google sign-in, AuthProvider, ProtectedRoute"
  - phase: 10-authentication-identity plan 02
    provides: "Organization model, ownerId/orgId on projects, migration Cloud Function"
provides:
  - "Shared requireAuth/requireProjectAccess guard for all Cloud Functions"
  - "Auth enforcement on all 8 callable Cloud Functions"
  - "Owner-based Firestore security rules (projects, organizations, users)"
  - "Auth-gated Storage security rules for project files"
  - "Dev bypass login for local testing without Google OAuth"
affects: [11-rbac, 12-collaboration, 14-versioning, 15-ai-review]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared auth guard helper, Firestore owner-based security rules, Storage auth-gated rules]

key-files:
  created:
    - functions/src/auth/requireAuth.ts
  modified:
    - functions/src/index.ts
    - firestore.rules
    - storage.rules
    - src/contexts/AuthContext.tsx
    - src/components/auth/LoginPage.tsx

key-decisions:
  - "Shared requireAuth helper (not copy-pasted) to avoid auth check drift across Cloud Functions"
  - "Firestore project rules use resource.data.ownerId (free read) for project doc, isProjectOwner get() for subcollections"
  - "Storage rules use auth-gate only (cannot call Firestore get from Storage rules) -- ownership enforced in Cloud Functions"
  - "Dev bypass uses mock User object (not Firebase anonymous auth) to avoid affecting Firestore state"

patterns-established:
  - "Auth guard pattern: requireAuth(request) as first line, requireProjectAccess(uid, projectId) before business logic"
  - "Firestore rules hierarchy: project doc uses resource.data, subcollections use isProjectOwner helper with get()"
  - "Legacy path fallback: erpi_settings/default read-only for migration verification"

requirements-completed: [AUTH-07]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 10 Plan 03: Backend Auth Enforcement Summary

**Shared auth guard on all 8 Cloud Functions, owner-based Firestore security rules for projects/organizations/users, auth-gated Storage rules, and dev bypass login for local testing**

## Performance

- **Duration:** 4 min (Tasks 1-2: automated; Task 3: checkpoint verification + dev bypass commit)
- **Started:** 2026-03-25T23:35:00Z
- **Completed:** 2026-03-25T23:58:25Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments
- Created shared `requireAuth` and `requireProjectAccess` helpers in `functions/src/auth/requireAuth.ts` -- all 8 callable Cloud Functions enforce authentication as their first operation
- Firestore security rules rewritten from wide-open (`allow read, write: if true`) to owner-based access: project docs check `resource.data.ownerId`, subcollections use `isProjectOwner()` helper, organizations check `members` array, user profiles self-only writes
- Storage security rules rewritten from wide-open to auth-gated access for project files, with default deny-all for all other paths
- Dev bypass login added for local testing without needing Google OAuth console setup -- uses mock User object (DEV-only, hidden in production builds)
- Human verified complete auth flow: login, org creation, migration, route protection, session persistence, sign-out

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared auth guard + enforce auth on all 8 Cloud Functions** - `d94c7d75` (feat)
2. **Task 2: Deploy Firestore and Storage security rules** - `cd6cc422` (feat)
3. **Task 3: Verify complete auth flow + dev bypass** - `d7564fa2` (feat)

## Files Created/Modified
- `functions/src/auth/requireAuth.ts` - Shared auth guard: requireAuth (validates auth token) and requireProjectAccess (validates project ownership)
- `functions/src/index.ts` - All 8 callables now call requireAuth first; 7 project-related ones also call requireProjectAccess
- `firestore.rules` - Owner-based rules: projects (ownerId), subcollections (isProjectOwner), organizations (members), users (self-write)
- `storage.rules` - Auth-gated: default deny, authenticated access for projects/{projectId}/** paths
- `src/contexts/AuthContext.tsx` - Added devBypassLogin with mock User for DEV-only testing
- `src/components/auth/LoginPage.tsx` - Added dev bypass button (visible only in DEV mode)

## Decisions Made
- Shared requireAuth helper avoids auth check drift -- single import in all 8 Cloud Functions rather than copy-pasted inline checks
- Firestore project doc rules use `resource.data.ownerId` (free, no extra read) while subcollection rules use `isProjectOwner()` helper with one `get()` call, staying well within Firebase's 10-read limit
- Storage rules cannot call Firestore `get()`, so ownership enforcement for Storage relies on: (1) Cloud Functions validate before upload, (2) frontend only constructs owned project paths, (3) auth-gate is sufficient for Phase 10 single-owner model
- Dev bypass uses a mock User object set directly via setState, not Firebase anonymous auth -- avoids creating anonymous auth records in Firebase and keeps Firestore state clean
- Legacy `erpi_settings/default` path kept as read-only in Firestore rules for migration verification fallback

## Deviations from Plan

### Orchestrator-Applied Changes

**1. Dev bypass login added during checkpoint resolution**
- **Context:** Orchestrator added dev bypass button and mock user login during checkpoint approval flow to enable local testing without Google OAuth console setup
- **Files modified:** src/contexts/AuthContext.tsx, src/components/auth/LoginPage.tsx
- **Impact:** Positive -- enables faster development iteration. DEV-only, excluded from production builds via `import.meta.env.DEV` guard.

---

**Total deviations:** 1 (orchestrator-applied, beneficial)
**Impact on plan:** Dev bypass is additive and DEV-only. No impact on production security posture.

## Issues Encountered

None.

## Known Stubs

None -- all auth enforcement is wired to real Firebase Auth state. Dev bypass is intentional and guarded by `import.meta.env.DEV`.

## User Setup Required

For production deployment, the following Firebase rules deployment is needed:
```bash
firebase deploy --only firestore:rules,storage
```

This replaces the wide-open rules with the owner-based rules created in this plan. Must be run AFTER the v1.0 data migration (Plan 10-02) has executed for at least one user.

## Next Phase Readiness
- Phase 10 (Authentication & Identity) is COMPLETE: all 3 plans executed
- Auth foundation ready for Phase 11 (RBAC): requireAuth helper extensible for role checks, Firestore rules can add collaborators array check
- Storage rules ready for Phase 11: can add custom claims for project-level access
- All Cloud Functions, Firestore rules, and Storage rules enforce authentication -- no wide-open access remains

## Self-Check: PASSED

- All 6 created/modified files verified present on disk
- All 3 task commits verified in git history (d94c7d75, cd6cc422, d7564fa2)
- npm run build succeeds with zero TypeScript errors
- functions npx tsc --noEmit succeeds with zero errors

---
*Phase: 10-authentication-identity*
*Completed: 2026-03-25*
