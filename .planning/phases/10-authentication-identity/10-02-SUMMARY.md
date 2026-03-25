---
phase: 10-authentication-identity
plan: 02
subsystem: auth
tags: [firebase-auth, organization, data-migration, firestore, ownership, erpi]

# Dependency graph
requires:
  - phase: 10-authentication-identity plan 01
    provides: "Firebase Auth with Google sign-in, AuthProvider, ProtectedRoute, LoginPage"
provides:
  - "Organization schema, service, and creation page (OrgSetupPage)"
  - "v1.0 data migration Cloud Function (migrateV1Data) with ownerId/orgId stamps"
  - "ERPI settings migrated from singleton to org-scoped path"
  - "Project listing filtered by ownerId"
  - "Pipeline orchestrator reads ERPI from org-scoped path with legacy fallback"
  - "AuthContext extended with orgId, needsOrgSetup, setOrgComplete"
  - "/setup route with OrgSetupRoute guard"
affects: [10-03, 11-rbac, 12-collaboration]

# Tech tracking
tech-stack:
  added: []
  patterns: [org-scoped Firestore paths, ownership-based query filtering, data migration Cloud Function]

key-files:
  created:
    - src/schemas/organization.ts
    - src/services/organizations.ts
    - src/components/auth/OrgSetupPage.tsx
    - functions/src/migration/migrateV1Data.ts
  modified:
    - src/contexts/AuthContext.tsx
    - src/App.tsx
    - src/components/auth/ProtectedRoute.tsx
    - src/services/projects.ts
    - src/services/erpi.ts
    - src/components/dashboard/DashboardPage.tsx
    - src/components/erpi/ERPISettingsPage.tsx
    - functions/src/pipeline/orchestrator.ts
    - functions/src/index.ts
    - src/locales/es.ts
    - src/hooks/useValidation.ts

key-decisions:
  - "AuthContext org state added in Task 1 (not Task 2) because OrgSetupPage needs setOrgComplete to compile"
  - "Orchestrator uses legacy singleton fallback for pre-migration projects without orgId"
  - "Migration is non-fatal: if Cloud Function fails, org creation still succeeds and data can be migrated later"
  - "useValidation ERPI subscription updated from singleton to org-scoped path to maintain real-time validation"

patterns-established:
  - "Org-scoped Firestore paths: organizations/{orgId}/erpi_settings/default"
  - "ownerId + orgId on all project documents for ownership-based access"
  - "OrgSetupRoute guard: redirects authenticated users without org to /setup"
  - "needsOrgSetup flag in AuthContext drives route-level flow control"

requirements-completed: [AUTH-08, AUTH-09]

# Metrics
duration: 8min
completed: 2026-03-25
---

# Phase 10 Plan 02: Organization + Data Migration Summary

**Organization creation flow, v1.0 data migration (ownerId/orgId on projects + ERPI to org scope), ownership-filtered project queries, and org-scoped ERPI across frontend, validation, and Cloud Functions orchestrator**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T23:24:15Z
- **Completed:** 2026-03-25T23:31:52Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Organization schema + CRUD service with createOrganization, getOrganization, getUserOrganization, createUserProfile
- OrgSetupPage with user avatar, org name form (RHF + Zod), migration trigger via httpsCallable, dark mode toggle
- v1.0 migration Cloud Function: stamps ownerId/orgId on unowned projects, copies ERPI settings to org-scoped path, fully idempotent
- AuthContext extended with orgId, needsOrgSetup, setOrgComplete for complete org-aware auth flow
- /setup route with OrgSetupRoute guard; ProtectedRoute redirects to /setup when needsOrgSetup
- projects.ts: createProject/cloneProject accept userId+orgId, listProjects filters by ownerId via Firestore where clause
- erpi.ts: migrated from singleton doc(db, 'erpi_settings', 'default') to org-scoped organizations/{orgId}/erpi_settings/default
- useValidation ERPI subscription updated to org-scoped path
- Pipeline orchestrator reads ERPI from org-scoped path with legacy singleton fallback for pre-migration safety
- 11 new Spanish strings added to es.ts for org setup and migration feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Organization schema + service + creation page + migration Cloud Function** - `8be1d190` (feat)
2. **Task 2: Update service layer + orchestrator + wire org flow into auth context** - `cf8c853e` (feat)

## Files Created/Modified
- `src/schemas/organization.ts` - Zod schema for organization (name, createdBy, members, createdAt)
- `src/services/organizations.ts` - CRUD for organizations collection (create, get, getUserOrganization, createUserProfile)
- `src/components/auth/OrgSetupPage.tsx` - Organization creation form with user avatar, dark mode, migration trigger
- `functions/src/migration/migrateV1Data.ts` - Cloud Function handler: stamps ownerId/orgId on projects, copies ERPI to org scope
- `functions/src/index.ts` - Registered migrateV1Data callable with auth check
- `src/locales/es.ts` - 11 new auth strings for org setup and migration
- `src/contexts/AuthContext.tsx` - Added orgId, needsOrgSetup, setOrgComplete; org membership check on auth state change
- `src/App.tsx` - Added /setup route with OrgSetupRoute guard
- `src/components/auth/ProtectedRoute.tsx` - Added needsOrgSetup redirect to /setup
- `src/services/projects.ts` - createProject/cloneProject accept userId+orgId; listProjects filters by ownerId
- `src/services/erpi.ts` - Migrated from singleton to org-scoped path
- `src/components/dashboard/DashboardPage.tsx` - Queries use user.uid; mutations pass userId+orgId
- `src/components/erpi/ERPISettingsPage.tsx` - Passes orgId to ERPI service functions
- `src/hooks/useValidation.ts` - ERPI subscription updated to org-scoped path
- `functions/src/pipeline/orchestrator.ts` - Reads ERPI from org-scoped path with legacy fallback

## Decisions Made
- AuthContext org state added in Task 1 (not Task 2) because OrgSetupPage needs setOrgComplete to compile -- moved forward to avoid TypeScript errors
- Orchestrator uses legacy singleton fallback when project has no orgId, ensuring backward compatibility during deployment window
- Migration failure is non-fatal: org creation still succeeds, toast shows error, data can be retried
- useValidation hook updated to read ERPI from org-scoped path, keeping real-time validation consistent with the new data model

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AuthContext org state moved to Task 1**
- **Found during:** Task 1 (OrgSetupPage creation)
- **Issue:** OrgSetupPage imports `setOrgComplete` from AuthContext, which the plan deferred to Task 2. TypeScript would fail without it.
- **Fix:** Added orgId, needsOrgSetup, setOrgComplete to AuthContext in Task 1 along with the org membership check effect
- **Files modified:** src/contexts/AuthContext.tsx
- **Verification:** npx tsc --noEmit passes with zero errors
- **Committed in:** 8be1d190 (Task 1 commit)

**2. [Rule 3 - Blocking] useValidation ERPI subscription updated to org-scoped path**
- **Found during:** Task 2 (ERPI service migration)
- **Issue:** useValidation.ts subscribed directly to `erpi_settings/default` Firestore path, bypassing the erpi service. After migration, ERPI data lives at org-scoped path -- validation would read stale/empty data.
- **Fix:** Updated onSnapshot in useValidation to read from `organizations/{orgId}/erpi_settings/default` using orgId from useAuth()
- **Files modified:** src/hooks/useValidation.ts
- **Verification:** npx tsc --noEmit and npm run build both succeed
- **Committed in:** cf8c853e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for correctness -- without them, TypeScript compilation would fail and validation would read stale ERPI data. No scope creep.

## Issues Encountered

None.

## Next Phase Readiness
- Auth foundation + organization + data migration complete
- Ready for Plan 03 (Cloud Functions auth enforcement on existing callables)
- All service layers scoped to user ownership
- Pipeline orchestrator uses org-scoped ERPI with legacy fallback for safe deployment

## Self-Check: PASSED

- All 15 created/modified files verified present on disk
- Both task commits verified in git history (8be1d190, cf8c853e)
- npm run build succeeds with zero TypeScript errors
- functions npx tsc --noEmit succeeds with zero errors

---
*Phase: 10-authentication-identity*
*Completed: 2026-03-25*
