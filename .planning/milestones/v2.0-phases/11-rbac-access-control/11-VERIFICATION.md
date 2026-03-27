---
phase: 11-rbac-access-control
verified: 2026-03-25T00:00:00Z
re_verification: true
re_verified: 2026-03-27T05:45:00Z
status: passed
score: 3/3 success criteria verified
human_verification:
  - test: "Accept/decline invitation flow end-to-end"
    expected: "Invited user signs in, sees PendingInvitations banner, clicks Aceptar, gets added to project, can navigate to it"
    why_human: "Requires two authenticated accounts and a live Firebase deployment to verify Firestore transaction and Cloud Function execution"
  - test: "Access denied for non-member URL"
    expected: "Navigating to /project/{unownedId} shows 'No tienes acceso a este proyecto' with back button"
    why_human: "Requires an actual Firebase project with two user accounts to verify the Firestore read and access gate at runtime"
---

# Phase 11: RBAC Access Control — Verification Report

**Phase Goal:** Project owners can invite team members with specific roles, and Firestore enforces that users only access projects they belong to.
**Verified:** 2026-03-25 (initial), 2026-03-27 (re-verification)
**Status:** PASSED
**Re-verification:** Yes -- gap resolved in Phase 12-03 (TeamMembers wired into WizardShell)

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Project owner can assign one of 4 roles (productor, line_producer, abogado, director) when inviting a team member | ✓ VERIFIED | TeamMembers imported at WizardShell.tsx line 33 and rendered at line 283 with projectId, collaborators, ownerId props. InviteModal reachable via TeamMembers invite button. Productor can now access the full invitation flow from the datos screen. |
| 2 | Users see only projects they own or have been invited to on the dashboard | ✓ VERIFIED | `listProjects` uses `where('memberUIDs', 'array-contains', userId)` (line 131 of `src/services/projects.ts`). Firestore rules enforce membership read at `match /projects/{projectId}` with `isProjectMember()`. |
| 3 | Directly navigating to a project URL the user has no access to shows an access denied message | ✓ VERIFIED | `WizardShell.tsx` calls `useProjectAccess(projectId)` and returns `<AccessDenied />` when `!hasAccess` (lines 61-63). `AccessDenied.tsx` renders the Spanish message from `es.rbac.accessDenied` with a back-to-dashboard link. |

**Score: 3/3 success criteria verified**

---

## Required Artifacts

### Plan 11-01 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/lib/permissions.ts` | ✓ VERIFIED | Exports `ProjectRole`, `ROLE_PERMISSIONS` with 4 roles matching D-02 matrix, and all 6 helper functions. WizardSidebar, WizardShell, GenerationScreen, ExportScreen, ProjectCard all import from it. |
| `functions/src/migrations/addCollaboratorsField.ts` | ✓ VERIFIED | `migrateProjectsAddCollaborators()` exported; batched writes, idempotent, skips projects already having `collaborators`. Registered as `migrateAddCollaborators` callable in `functions/src/index.ts`. |
| `firestore.rules` | ✓ VERIFIED | `isProjectMember()` checks both `ownerId` and `collaborators` map. Invitations collection uses invitee email match. `security_events` is client-deny. Subcollections use `get()` for parent project membership. |
| `storage.rules` | ✓ VERIFIED | Auth-gate only with documented explanation of Firebase Storage limitation. |
| `src/services/projects.ts` | ✓ VERIFIED | `createProject` and `cloneProject` write `collaborators` and `memberUIDs`. `listProjects` queries `where('memberUIDs', 'array-contains', userId)`. Return type includes `ownerId` and `collaborators`. |
| `functions/src/auth/requireAuth.ts` | ✓ VERIFIED | `requireProjectAccess` checks both `ownerId` and `collaborators` map, returns `{ role, projectData }`. `requireRole` helper present. |

### Plan 11-02 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `functions/src/invitations/inviteToProject.ts` | ✓ VERIFIED | Email normalized, duplicate-invite check, 7-day expiry, `security_events` logging. Role validated against `['line_producer', 'abogado', 'director']`. |
| `functions/src/invitations/acceptInvitation.ts` | ✓ VERIFIED | `runTransaction` atomically updates invitation status AND adds to `collaborators`/`memberUIDs`. D-09 email matching safeguard implemented. Expiration check present. |
| `functions/src/invitations/revokeAccess.ts` | ✓ VERIFIED | `FieldValue.delete()` removes from collaborators map, `arrayRemove` from memberUIDs. Owner-only restriction enforced. Audit log present. |
| `src/services/invitations.ts` | ✓ VERIFIED | All 7 operations exported: `getPendingInvitations`, `inviteToProject`, `acceptInvitation`, `declineInvitation`, `revokeAccess`, `getProjectTeamMembers`, `getProjectInvitations`. Each calls the correct Cloud Function via `httpsCallable`. |
| `src/components/project/InviteModal.tsx` | ✓ VERIFIED | Substantive -- full form with Zod validation, role dropdown (line_producer/abogado/director), success/error toasts, locale strings. Reachable via TeamMembers invite button, which is rendered in WizardShell.tsx at line 283. |
| `src/components/project/TeamMembers.tsx` | ✓ VERIFIED | Renders member list with role badges, invite button (productor only), revoke with confirmation, pending invitations section. Imported at WizardShell.tsx line 33 and rendered at line 283 within the datos screen section. |
| `src/components/project/PendingInvitations.tsx` | ✓ VERIFIED | Imported and rendered in `DashboardPage.tsx` (line 144: `<PendingInvitations />`). Queries by user email, renders accept/decline per invitation. |

### Plan 11-03 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/hooks/useProjectAccess.ts` | ✓ VERIFIED | React Query with 30s staleTime, checks `ownerId` then `collaborators` map. Syncs role to appStore via `useEffect`. Returns `{ hasAccess, role, loading, ownerName }`. |
| `src/components/auth/AccessDenied.tsx` | ✓ VERIFIED | `ShieldAlert` icon, `es.rbac.accessDenied.title/description/backButton` locale strings. Back link uses `render={<Link to="/" />}` pattern. |
| `src/components/common/ReadOnlyBanner.tsx` | ✓ VERIFIED | Amber styling with lock icon. Uses `es.rbac.readOnly.banner(productorName)` locale function. Fallback "al productor" when name unavailable. |
| `src/stores/appStore.ts` | ✓ VERIFIED | `currentProjectRole: ProjectRole | null`, `setCurrentProjectRole` setter, cleared in `resetStore`. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/permissions.ts` | `src/stores/wizardStore.ts` | `WizardScreen` type import | ✓ WIRED | Line 1: `import type { WizardScreen } from '@/stores/wizardStore'` |
| `functions/src/auth/requireAuth.ts` | `functions/src/index.ts` | `requireProjectAccess` used in Cloud Functions | ✓ WIRED | Lines 464, 543: `requireProjectAccess(uid, projectId)` called in `inviteToProject` and `revokeProjectAccess` |
| `src/services/projects.ts` | `firestore.rules` | `collaborators`/`memberUIDs` must match rules | ✓ WIRED | `createProject` writes `collaborators: { [userId]: 'productor' }` and `memberUIDs: [userId]`. Rules check `request.auth.uid in projectData.collaborators`. |
| `src/hooks/useProjectAccess.ts` | `src/components/wizard/WizardShell.tsx` | `useProjectAccess` called at WizardShell top | ✓ WIRED | Line 40: `const { hasAccess, role, loading: accessLoading, ownerName } = useProjectAccess(projectId)` |
| `src/lib/permissions.ts` | `src/components/wizard/WizardShell.tsx` | `canEditScreen` determines read-only banner | ✓ WIRED | Line 66: `const isReadOnly = role !== null && !canEditScreen(role, activeScreen)` |
| `src/stores/appStore.ts` | `src/components/generation/GenerationScreen.tsx` | `currentProjectRole` gates pipeline controls | ✓ WIRED | Line 33-34: `useAppStore((s) => s.currentProjectRole)` + `canRunPipeline(currentProjectRole)`. `showPipelineControls` guards `PipelineControl` render. |
| `src/services/invitations.ts` | `functions/src/index.ts` | `httpsCallable` for all 4 invitation functions | ✓ WIRED | `inviteToProject`, `acceptInvitation`, `declineInvitation`, `revokeProjectAccess` all registered in `functions/src/index.ts` (lines 443, 477, 499, 523). |
| `src/components/project/InviteModal.tsx` | `src/services/invitations.ts` | calls `inviteToProject` | ✓ WIRED | Line 24: `import { inviteToProject } from '@/services/invitations'`. Called in `onSubmit`. |
| `src/components/project/TeamMembers.tsx` | `src/components/wizard/WizardShell.tsx` | renders invite flow for productor | ✓ WIRED | Imported at WizardShell.tsx line 33 and rendered at line 283 within the datos screen section with projectId, collaborators, and ownerId props. |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| AUTH-04 | 11-01, 11-03 | Custom claims RBAC with 4 roles: each with defined permission set | ✓ SATISFIED | `ROLE_PERMISSIONS` constant defines all 4 roles with complete D-02 matrix. UI enforces role permissions via `canEditScreen`, `canRunPipeline`, `canExport`, `canDeleteProject` across WizardShell, GenerationScreen, ExportScreen, ProjectCard. |
| AUTH-05 | 11-02 | Project owner can invite team members by email and assign roles | ✓ SATISFIED | Cloud Functions, service layer, and UI components all exist and are correct. TeamMembers is rendered in WizardShell.tsx at line 283 (datos screen), providing the productor with a reachable path to the invite flow via InviteModal. |
| AUTH-06 | 11-01, 11-03 | Firestore security rules enforce per-project access | ✓ SATISFIED | `firestore.rules` uses `isProjectMember()` checking both `ownerId` and `collaborators` map. `listProjects` uses `array-contains` on `memberUIDs`. `WizardShell` enforces client-side access gate showing `AccessDenied` for non-members. `useProjectAccess` verifies membership before showing project data. |

**AUTH-04: SATISFIED** -- 4 roles defined, permission matrix implemented, UI gating active.
**AUTH-05: SATISFIED** -- invitation infrastructure complete and TeamMembers rendered in WizardShell datos screen (line 283), providing UI entry point for productor invite flow.
**AUTH-06: SATISFIED** -- Firestore rules membership-based, client-side access gate functional, dashboard filtered to member projects.

---

## Anti-Patterns Found

| File | Pattern | Severity | Status |
|------|---------|----------|--------|
| `src/components/project/TeamMembers.tsx` | Component exported but never rendered anywhere in app | Blocker | RESOLVED -- imported and rendered in WizardShell.tsx at line 33 (import) and line 283 (render) |
| `src/components/project/InviteModal.tsx` | Reachable only through orphaned `TeamMembers` | Blocker | RESOLVED -- now reachable via TeamMembers which is rendered in WizardShell datos screen |

All anti-patterns from the initial verification have been resolved. No remaining blockers.

---

## Human Verification Required

### 1. Accept/decline invitation flow end-to-end

**Test:** With two authenticated Google accounts (Lemon Studios domain), have account A create a project, then (once TeamMembers is wired into the UI) invite account B as `line_producer`. Sign in as account B, verify PendingInvitations banner appears, click "Aceptar", verify the project appears in account B's dashboard with "Line Producer" badge.
**Expected:** Firestore transaction atomically updates invitation status to `accepted` and adds account B's UID to project `collaborators` and `memberUIDs`. Project appears in account B's dashboard.
**Why human:** Requires live Firebase project with two authenticated sessions and Cloud Function execution.

### 2. Access denied page for non-member project URL

**Test:** Sign in as any user, navigate directly to `/project/{projectId}` where that project was created by a different account and the current user is not a collaborator.
**Expected:** "No tienes acceso a este proyecto" page with ShieldAlert icon and "Volver a Mis Proyectos" back link. Project data should not load.
**Why human:** Requires two authenticated accounts and a deployed Firebase project to verify Firestore rules block the read, and the React Query result triggers the AccessDenied render.

### 3. Read-only banner on non-editable screens

**Test:** Once invite flow is wired, invite account B as `director`. Sign in as account B, navigate to the `financiera` (financial) screen. Verify the amber "Solo lectura" banner appears.
**Expected:** Banner displays "Solo lectura — contacta a [Productor Name] para editar." with a lock icon. Pipeline controls on `generacion` screen should be hidden. Export card on `exportar` screen should be hidden.
**Why human:** Requires multi-user session and deployed app to observe UI state for a collaborator role.

---

## Gaps Summary

**No remaining gaps.** The single gap identified in the initial verification (TeamMembers/InviteModal orphaned components) was resolved during Phase 12-03 shell integration, where TeamMembers was imported and rendered in WizardShell.tsx within the datos screen section.

- **Original gap:** TeamMembers never imported or rendered -- productor had no path to invite flow
- **Resolution:** WizardShell.tsx line 33 imports TeamMembers, line 283 renders it with projectId, collaborators, and ownerId props
- **Resolved by:** Phase 12-03 Plan execution (commit f9a59b8d)
- **Re-verified:** 2026-03-27 during Phase 16 milestone gap closure

---

*Initial verification: 2026-03-25 by Claude (gsd-verifier)*
*Re-verification: 2026-03-27 by Claude (gsd-executor, gap closure)*
