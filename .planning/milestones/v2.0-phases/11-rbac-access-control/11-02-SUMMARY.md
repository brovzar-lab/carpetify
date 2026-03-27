---
phase: 11-rbac-access-control
plan: 02
subsystem: auth
tags: [rbac, invitations, cloud-functions, firestore-transactions, team-management, firebase]

# Dependency graph
requires:
  - phase: 11-rbac-access-control plan 01
    provides: "ProjectRole type, ROLE_PERMISSIONS, canManageTeam, requireProjectAccess returning role+projectData, requireRole, membership-based Firestore rules, RBAC locale strings"
provides:
  - "4 Cloud Functions: inviteToProject, acceptInvitation, declineInvitation, revokeProjectAccess"
  - "Client invitation service with 7 operations (getPending, invite, accept, decline, revoke, getTeamMembers, getProjectInvitations)"
  - "InviteModal component with email + role form and Zod validation"
  - "TeamMembers panel showing project members with roles and revoke capability"
  - "PendingInvitations dashboard banner for actionable invitations"
  - "Deep link route /invitation/:invitationId for future email integration"
affects: [11-03-ui-enforcement, 12-collaboration, 13-activity-log]

# Tech tracking
tech-stack:
  added: []
  patterns: [Firestore transaction for atomic invitation acceptance, email normalization on both server and client, security_events audit logging, httpsCallable service pattern for invitation operations]

key-files:
  created:
    - functions/src/invitations/inviteToProject.ts
    - functions/src/invitations/acceptInvitation.ts
    - functions/src/invitations/revokeAccess.ts
    - src/services/invitations.ts
    - src/components/project/InviteModal.tsx
    - src/components/project/TeamMembers.tsx
    - src/components/project/PendingInvitations.tsx
  modified:
    - functions/src/index.ts
    - src/components/dashboard/DashboardPage.tsx
    - src/App.tsx
    - src/locales/es.ts

key-decisions:
  - "Email normalization (toLowerCase + trim) applied on both server (inviteToProject, acceptInvitation) and client (getPendingInvitations) for consistent matching"
  - "Invitation acceptance uses Firestore runTransaction to atomically update invitation status AND add user to collaborators + memberUIDs (Pitfall 1 prevention)"
  - "Security events logged outside transaction in acceptInvitation for simplicity -- transaction scope kept minimal for reliability"
  - "Deep link route /invitation/:invitationId redirects to dashboard (PendingInvitations banner handles the UX) -- future Phase 13 will wire email notifications"

patterns-established:
  - "Invitation Cloud Function pattern: requireAuth -> requireProjectAccess -> requireRole -> handler"
  - "Team management UI pattern: TeamMembers component with InviteModal and revoke confirmation dialog"
  - "Pending invitations pattern: dashboard banner that auto-queries by user email and shows accept/decline"

requirements-completed: [AUTH-05]

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 11 Plan 02: Invitation Flow Summary

**Complete project invitation flow with 4 Cloud Functions (invite/accept/decline/revoke), client service, and team management UI with pending invitations banner**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T00:58:00Z
- **Completed:** 2026-03-26T01:06:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Built 4 Cloud Functions for invitation lifecycle: inviteToProject (with email normalization, duplicate checks, 7-day expiry), acceptInvitation (with Firestore transaction for atomic collaborator addition), declineInvitation (with email matching safeguard), revokeProjectAccess (with owner-only restriction)
- Created client-side invitation service with 7 exported operations covering the full invitation and team management flow
- Built 3 UI components: InviteModal (email + role form with Zod validation), TeamMembers (member list with roles + revoke), PendingInvitations (dashboard banner with accept/decline)
- All 4 Cloud Functions log to security_events collection for audit trail (D-17)
- Email matching safeguard prevents wrong-account acceptance (D-09)
- Wired PendingInvitations into DashboardPage and added /invitation/:invitationId deep link route

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invitation Cloud Functions (invite, accept, decline, revoke)** - `cb38280b` (feat)
2. **Task 2: Create client invitation service and team management UI components** - `b5c7a91c` (feat)

## Files Created/Modified
- `functions/src/invitations/inviteToProject.ts` - Cloud Function handler: validates role, normalizes email, checks duplicates, creates invitation with 7-day expiry, logs to security_events
- `functions/src/invitations/acceptInvitation.ts` - Cloud Function handlers: acceptInvitation (transactional collaborator addition) and declineInvitation (status update only)
- `functions/src/invitations/revokeAccess.ts` - Cloud Function handler: removes collaborator from project, owner-only restriction
- `functions/src/index.ts` - Registered 4 new callables (inviteToProject, acceptInvitation, declineInvitation, revokeProjectAccess)
- `src/services/invitations.ts` - Client invitation service with 7 operations using httpsCallable and Firestore queries
- `src/components/project/InviteModal.tsx` - Modal dialog with email + role form, Zod validation, all labels from es.ts
- `src/components/project/TeamMembers.tsx` - Team members panel with avatar, role badges, invite button (productor only), revoke with confirmation
- `src/components/project/PendingInvitations.tsx` - Dashboard banner showing pending invitations with accept/decline buttons
- `src/components/dashboard/DashboardPage.tsx` - Added PendingInvitations import and render above project list
- `src/App.tsx` - Added /invitation/:invitationId route (redirects to dashboard)
- `src/locales/es.ts` - Added removeCancel, removing, pendingStatus locale keys to rbac.team

## Decisions Made
- Email normalization applied on both server and client sides for consistent matching across the stack
- Invitation acceptance uses Firestore runTransaction to atomically update both the invitation status and the project's collaborators/memberUIDs (prevents sync drift)
- Security events are logged outside the transaction for simplicity; the transaction scope is kept minimal for reliability
- Deep link route redirects to dashboard where PendingInvitations banner handles the UX; future Phase 13 will add email notifications

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed base-ui Select onValueChange type mismatch**
- **Found during:** Task 2 (InviteModal component)
- **Issue:** base-ui Select's `onValueChange` passes `string | null`, but the handler expected `string`
- **Fix:** Added null guard (`if (val)`) before calling setValue
- **Files modified:** src/components/project/InviteModal.tsx
- **Verification:** `npm run build` passes with zero errors
- **Committed in:** b5c7a91c (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added missing locale keys for team management UI**
- **Found during:** Task 2 (TeamMembers component)
- **Issue:** TeamMembers needed locale strings for cancel button, revoking state, and pending status badge that were not in Plan 01's locale additions
- **Fix:** Added `removeCancel`, `removing`, `pendingStatus` to `es.rbac.team` section
- **Files modified:** src/locales/es.ts
- **Verification:** No hardcoded Spanish strings in project components
- **Committed in:** b5c7a91c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None.

## Known Stubs

None -- all code is functional. The invitation flow is complete from Cloud Function creation through client service to UI components. The /invitation/:invitationId deep link redirects to dashboard where PendingInvitations handles the UX.

## User Setup Required

For production deployment, the new Cloud Functions need deployment:
```bash
cd functions && npm run deploy
```

## Next Phase Readiness
- Invitation flow complete: productor can invite, invitee can accept/decline, productor can revoke
- TeamMembers component ready for integration into project settings (Plan 11-03 will wire it)
- PendingInvitations banner active on dashboard for any user with pending invitations
- All operations log to security_events for audit trail
- UI enforcement (Plan 11-03) can now use canManageTeam() to show/hide TeamMembers and InviteModal

## Self-Check: PASSED

- All 11 created/modified files verified present on disk
- Both task commits verified in git history (cb38280b, b5c7a91c)
- npm run build succeeds with zero TypeScript errors
- functions npx tsc --noEmit succeeds with zero errors

---
*Phase: 11-rbac-access-control*
*Completed: 2026-03-26*
