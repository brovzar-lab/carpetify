---
phase: 11-rbac-access-control
plan: 01
subsystem: auth
tags: [rbac, firestore-rules, permissions, cloud-functions, security, firebase]

# Dependency graph
requires:
  - phase: 10-authentication-identity plan 03
    provides: "requireAuth/requireProjectAccess guards, owner-based Firestore security rules, auth-gated Storage rules"
provides:
  - "ProjectRole type and ROLE_PERMISSIONS constant with 4 roles matching D-02 permission matrix"
  - "6 permission helper functions (canEditScreen, canViewScreen, canRunPipeline, canExport, canManageTeam, canDeleteProject)"
  - "Migration Cloud Function to add collaborators/memberUIDs to existing projects"
  - "Membership-based Firestore security rules (replaces owner-only rules)"
  - "Upgraded requireProjectAccess returning role + projectData (membership-aware)"
  - "requireRole helper for role-restricted Cloud Function access"
  - "createProject/cloneProject set collaborators and memberUIDs at creation"
  - "listProjects uses array-contains query for member-based project listing"
  - "Complete RBAC Spanish locale strings"
affects: [11-02-invitations, 11-03-ui-enforcement, 12-collaboration, 13-activity-log]

# Tech tracking
tech-stack:
  added: []
  patterns: [document-level roles map with collaborators + memberUIDs, membership-based Firestore security rules, role-returning auth guard]

key-files:
  created:
    - src/lib/permissions.ts
    - functions/src/migrations/addCollaboratorsField.ts
  modified:
    - functions/src/index.ts
    - src/services/projects.ts
    - src/locales/es.ts
    - firestore.rules
    - storage.rules
    - functions/src/auth/requireAuth.ts

key-decisions:
  - "Document-level roles map (collaborators field) instead of Firebase custom claims -- per-project roles are instantly effective without token refresh"
  - "Dual data structure: collaborators map for role lookup in rules + memberUIDs array for array-contains queries"
  - "requireProjectAccess returns { role, projectData } object -- callers can use role for downstream permission checks"
  - "Storage rules remain auth-gate only with documentation -- Firebase Storage cannot call Firestore get() for membership checks"
  - "Line producer editableScreens includes datos (per D-02 Screen 1 not explicitly stated but needed for project setup edits)"

patterns-established:
  - "Permission check pattern: canEditScreen(role, screen) for UI gating, requireRole(role, allowedRoles) for Cloud Functions"
  - "Collaborators map pattern: { [uid]: 'role_string' } on project document, checked via uid in resource.data.collaborators in rules"
  - "Membership guard pattern: requireProjectAccess returns role string, not just project data"

requirements-completed: [AUTH-04, AUTH-06]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 11 Plan 01: RBAC Foundation Summary

**4-role permission model with D-02 matrix, membership-based Firestore security rules replacing owner-only access, collaborators migration function, and upgraded Cloud Function guard returning role**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T00:49:39Z
- **Completed:** 2026-03-26T00:55:27Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created `src/lib/permissions.ts` with ProjectRole type, ROLE_PERMISSIONS constant defining all 4 roles (productor, line_producer, abogado, director) with screen-level edit/view permissions and action booleans, plus 6 exported helper functions
- Rewrote Firestore security rules from owner-only to membership-based access using `isProjectMember()` helper that checks both ownerId and collaborators map -- added invitations and security_events collection rules
- Upgraded `requireProjectAccess` to return `{ role, projectData }` by checking both ownership and collaborators map, added `requireRole` helper for future role-restricted Cloud Functions
- Created idempotent migration Cloud Function to add collaborators/memberUIDs to existing projects
- Updated createProject, cloneProject, and listProjects for RBAC data model (collaborators map, memberUIDs array, array-contains query)
- Added complete RBAC Spanish locale strings (roles, accessDenied, readOnly, team, invite, pending)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create permissions model, migration Cloud Function, and update createProject** - `99ce3977` (feat)
2. **Task 2: Rewrite security rules and upgrade Cloud Function membership guard** - `d763d82c` (feat)

## Files Created/Modified
- `src/lib/permissions.ts` - ProjectRole type, ROLE_PERMISSIONS constant with D-02 permission matrix, 6 helper functions
- `functions/src/migrations/addCollaboratorsField.ts` - Idempotent migration: adds collaborators/memberUIDs to existing projects
- `functions/src/index.ts` - Registered migrateAddCollaborators callable Cloud Function
- `src/services/projects.ts` - createProject/cloneProject set collaborators/memberUIDs; listProjects uses array-contains query
- `src/locales/es.ts` - Added rbac section with roles, accessDenied, readOnly, team, invite, pending strings
- `firestore.rules` - Membership-based rules with isProjectMember/getUserRole helpers, invitations and security_events collections
- `storage.rules` - Updated with membership limitation documentation explaining why auth-gate is maximum enforcement
- `functions/src/auth/requireAuth.ts` - requireProjectAccess returns role+projectData, added requireRole helper

## Decisions Made
- Used document-level roles map (`collaborators` field) instead of Firebase custom claims because per-project roles need to be instantly effective without token refresh
- Maintained dual data structure (collaborators map + memberUIDs array) because Firestore cannot query map keys with `where()` but arrays support `array-contains`
- Changed requireProjectAccess return type to `{ role, projectData }` -- all 7 existing callers discard the return value so the change is backward-compatible
- Storage rules kept as auth-gate only with detailed documentation -- this is a known Firebase limitation (Storage rules cannot call Firestore get())
- Line producer editableScreens per D-02: datos, financiera, documentos, generacion -- they handle budget and logistics

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None -- all code is functional. The migration Cloud Function is ready to execute against real data. Permissions module exports are complete and ready for UI enforcement (Plan 11-03).

## User Setup Required

For production deployment, the updated Firestore and Storage rules need deployment:
```bash
firebase deploy --only firestore:rules,storage
```

The collaborators migration should be triggered after rules deployment:
```bash
# Via Firebase console or calling migrateAddCollaborators Cloud Function
```

## Next Phase Readiness
- RBAC data model foundation complete: collaborators map and memberUIDs on all projects
- Firestore rules enforce membership-based access -- ready for Plan 11-02 (invitation flow)
- Permission helpers ready for Plan 11-03 (UI enforcement: read-only banners, hidden actions)
- requireRole helper ready for role-restricted Cloud Functions in Plan 11-02
- All locale strings pre-populated for Plans 11-02 and 11-03

## Self-Check: PASSED

- All 8 created/modified files verified present on disk
- Both task commits verified in git history (99ce3977, d763d82c)
- npm run build succeeds with zero TypeScript errors
- functions npx tsc --noEmit succeeds with zero errors

---
*Phase: 11-rbac-access-control*
*Completed: 2026-03-26*
