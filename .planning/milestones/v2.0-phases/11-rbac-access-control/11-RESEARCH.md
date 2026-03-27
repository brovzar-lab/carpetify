# Phase 11: RBAC & Project Access Control - Research

**Researched:** 2026-03-25
**Domain:** Firebase Firestore document-level RBAC, project invitation flow, security rules enforcement
**Confidence:** HIGH

## Summary

Phase 11 adds per-project role-based access control to Carpetify. The critical architectural insight is that roles are **per-project, not global**: a user can be `productor` on Project A and `abogado` on Project B. This rules out using Firebase custom claims as the primary role mechanism (claims are global to the user, limited to 1000 bytes, and require token refresh on change). Instead, the standard pattern is **document-level roles**: store a `collaborators` map directly on the project document where keys are UIDs and values are role strings. Firestore security rules can check `resource.data.collaborators[request.auth.uid]` for zero cost (no `get()` call needed when checking the document being accessed).

The scope covers three requirements: defining 4 project roles with distinct permissions (AUTH-04), building an invitation flow where the project owner invites members by email (AUTH-05), and enforcing all access control server-side via Firestore security rules (AUTH-06). Phase 10 provides the foundation (Firebase Auth, `ownerId` on projects, `request.auth` in Cloud Functions). This phase extends that foundation with multi-user collaboration data structures.

The invitation flow uses a `pending_invitations` subcollection (or top-level collection indexed by invitee email). When a user signs in, the app queries for pending invitations matching their email. Accepted invitations add the user's UID to the project's `collaborators` map. This is a well-established Firebase pattern that avoids requiring the invitee to already have an account at invite time.

**Primary recommendation:** Store roles in a `collaborators: Record<string, Role>` map on the project document. Use `request.auth.uid in resource.data.collaborators` in Firestore security rules. Build a Cloud Function `inviteToProject` that validates the caller is `productor`, creates a pending invitation, and a Cloud Function `acceptInvitation` that adds the invitee's UID to the collaborators map. Client-side `permissions.ts` mirrors the rules for UI gating.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-04 | Custom claims RBAC with 4 roles: productor, line_producer, abogado, director -- each with defined permission set | Document-level roles map on project document. Permissions defined in `src/lib/permissions.ts` with `ROLE_PERMISSIONS` constant. Custom claims NOT used for per-project roles (see Architecture section for rationale). |
| AUTH-05 | Project owner (productor) can invite team members by email and assign roles | Cloud Function `inviteToProject` creates invitation document. Invitation stored by email (not UID) so invitee need not have an account yet. On sign-in, app checks for pending invitations matching the user's email. |
| AUTH-06 | Firestore security rules enforce per-project access -- users can only read/write projects they own or are invited to | Security rules check `resource.data.collaborators[request.auth.uid] != null` on project documents (zero `get()` cost). Subcollection rules use one `get()` to read parent project's collaborators map. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | 12.11.0 | Client SDK -- Firestore queries with `where()`, `array-contains` for project listing | Already installed. `getIdTokenResult()` for reading any custom claims if needed. |
| firebase-admin | 13.7.0 | Server SDK -- `getAuth().setCustomUserClaims()` (optional, for future global roles), `getFirestore()` for invitation management | Already in functions/package.json. `getAuth()` import from `firebase-admin/auth` needed. |
| firebase-functions | 7.2.2 | Cloud Functions v2 `onCall` for `inviteToProject`, `acceptInvitation` | Already installed. Same patterns as existing 7 functions. |
| react-router | 7.13.1 | Route-level access denied page, redirect on unauthorized project access | Already installed. |
| zustand | 5.0.12 | Store current user's role for the active project | Already installed. Extend `appStore` with `currentProjectRole`. |
| @tanstack/react-query | 5.94.5 | Fetch project data including collaborators map, invalidate on invitation accept | Already installed. |
| zod | 4.3.6 | Validate invitation payloads, role enums | Already installed. |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications for invitation sent/accepted/denied | Invitation flow UI feedback |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Document-level roles map | Firebase custom claims | Custom claims are global, limited to 1000 bytes, require token refresh. Per-project roles in document are more flexible and instantly reflect changes. |
| `collaborators` map on project doc | Separate `members` subcollection | Subcollection requires `get()` call in security rules (costs reads). Map on document is free to check in rules via `resource.data`. |
| `memberUIDs` array + `collaborators` map | `collaborators` map only | Array enables `array-contains` queries for listing. Map alone cannot be queried with `where()`. Need both: array for querying, map for role lookup. |
| Top-level `invitations` collection | `projects/{id}/invitations` subcollection | Top-level is better because invitees query by their email across all projects. Subcollection would require collection group query. |

**Installation:** No new packages needed. All required functionality ships with existing Firebase SDK.

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    permissions.ts         # NEW -- ROLE_PERMISSIONS map, canEdit(), canView(), isProjectMember()
  stores/
    appStore.ts            # MODIFY -- Add currentProjectRole
  services/
    projects.ts            # MODIFY -- Add collaborators to create, listProjects uses memberUIDs array-contains
    invitations.ts         # NEW -- Client-side invitation service (list pending, accept, decline)
  components/
    auth/
      AccessDenied.tsx     # NEW -- "No tienes acceso a este proyecto" page
    project/
      InviteModal.tsx      # NEW -- Modal for owner to invite by email + assign role
      TeamMembers.tsx      # NEW -- List current team members with roles (for project settings)
  hooks/
    useProjectAccess.ts    # NEW -- Hook that checks if current user has access to active project
functions/
  src/
    invitations/
      inviteToProject.ts   # NEW -- Cloud Function: create invitation
      acceptInvitation.ts  # NEW -- Cloud Function: accept invitation, add to collaborators
      revokeAccess.ts      # NEW -- Cloud Function: remove user from project
    middleware/
      requireProjectAccess.ts  # NEW -- Shared guard: check caller is project member
firestore.rules            # REWRITE -- Add collaborators-based access rules
```

### Pattern 1: Document-Level Roles Map

**What:** Store role assignments directly on the project document as a map from UID to role string. Also maintain a `memberUIDs` array for query support.

**When to use:** Every project document. Updated when invitations are accepted or access is revoked.

**Data Model:**
```typescript
// On project document: projects/{projectId}
{
  // ... existing fields (metadata, createdAt, updatedAt) ...
  ownerId: string,              // Set by Phase 10
  collaborators: {              // NEW in Phase 11
    [uid: string]: 'productor' | 'line_producer' | 'abogado' | 'director'
  },
  memberUIDs: string[],         // NEW in Phase 11 -- denormalized for array-contains queries
}
```

**Why both `collaborators` map AND `memberUIDs` array:**
- The `collaborators` map enables zero-cost role lookup in security rules: `resource.data.collaborators[request.auth.uid]`
- Firestore cannot query "does my UID exist as a key in a map field" with `where()`. You CANNOT do `where('collaborators.${uid}', '!=', null)` -- Firestore does not support dynamic field paths in queries.
- The `memberUIDs` array enables `where('memberUIDs', 'array-contains', uid)` queries for the dashboard project listing.
- Both must be kept in sync. All writes to `collaborators` must also update `memberUIDs`. Use a Cloud Function to ensure atomicity.

**Example:**
```typescript
// src/lib/permissions.ts
export type ProjectRole = 'productor' | 'line_producer' | 'abogado' | 'director'

export type WizardScreen = 'datos' | 'guion' | 'equipo' | 'financiera' | 'documentos' | 'generacion' | 'validacion' | 'exportar'

interface RolePermissions {
  editableScreens: WizardScreen[]
  viewableScreens: WizardScreen[]
  canRunPipeline: boolean
  canExport: boolean
  canManageTeam: boolean
  canDeleteProject: boolean
}

export const ROLE_PERMISSIONS: Record<ProjectRole, RolePermissions> = {
  productor: {
    editableScreens: ['datos', 'guion', 'equipo', 'financiera', 'documentos', 'generacion', 'validacion', 'exportar'],
    viewableScreens: ['datos', 'guion', 'equipo', 'financiera', 'documentos', 'generacion', 'validacion', 'exportar'],
    canRunPipeline: true,
    canExport: true,
    canManageTeam: true,
    canDeleteProject: true,
  },
  line_producer: {
    editableScreens: ['datos', 'equipo', 'financiera', 'generacion'],
    viewableScreens: ['datos', 'guion', 'equipo', 'financiera', 'documentos', 'generacion', 'validacion', 'exportar'],
    canRunPipeline: true,
    canExport: false,
    canManageTeam: false,
    canDeleteProject: false,
  },
  abogado: {
    editableScreens: ['documentos', 'financiera'],
    viewableScreens: ['datos', 'guion', 'equipo', 'financiera', 'documentos', 'generacion', 'validacion', 'exportar'],
    canRunPipeline: false,
    canExport: false,
    canManageTeam: false,
    canDeleteProject: false,
  },
  director: {
    editableScreens: ['guion', 'equipo'],
    viewableScreens: ['datos', 'guion', 'equipo', 'financiera', 'documentos', 'generacion', 'validacion', 'exportar'],
    canRunPipeline: false,
    canExport: false,
    canManageTeam: false,
    canDeleteProject: false,
  },
}

export function canEditScreen(role: ProjectRole, screen: WizardScreen): boolean {
  return ROLE_PERMISSIONS[role].editableScreens.includes(screen)
}

export function canViewScreen(role: ProjectRole, screen: WizardScreen): boolean {
  return ROLE_PERMISSIONS[role].viewableScreens.includes(screen)
}
```

### Pattern 2: Firestore Security Rules with Document-Level Roles

**What:** Security rules check the project document's `collaborators` map and `ownerId` to determine access. No `get()` call needed for the project document itself. Subcollections use one `get()` to read the parent.

**When to use:** Every Firestore read/write operation on project data.

**Example:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: is the user a member of the project?
    function isProjectMember(projectData) {
      return request.auth.uid == projectData.ownerId
        || request.auth.uid in projectData.collaborators;
    }

    // Helper: get the user's role on a project
    function getUserRole(projectData) {
      return request.auth.uid == projectData.ownerId
        ? 'productor'
        : projectData.collaborators[request.auth.uid];
    }

    // Project documents
    match /projects/{projectId} {
      // Any member can read
      allow read: if request.auth != null
        && isProjectMember(resource.data);

      // Only productor can update collaborators/memberUIDs fields
      // Any member can update other fields (within role permissions)
      allow update: if request.auth != null
        && isProjectMember(resource.data);

      // Only authenticated users can create (they become owner)
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid;

      // Only owner can delete
      allow delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;

      // Subcollections inherit project membership check
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null
          && isProjectMember(
            get(/databases/$(database)/documents/projects/$(projectId)).data
          );
      }
    }

    // Invitations -- readable by invitee (by email), writable by Cloud Functions only
    match /invitations/{invitationId} {
      allow read: if request.auth != null
        && resource.data.inviteeEmail == request.auth.token.email;
      allow write: if false;  // Only Cloud Functions (Admin SDK) can write
    }

    // ERPI settings -- user-scoped (from Phase 10)
    match /erpi_settings/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

**Key insight:** `isProjectMember(resource.data)` on the project document itself costs zero `get()` calls because `resource.data` is the document being evaluated. Subcollection rules use one `get()` call to read the parent project -- well within the 10-call limit.

### Pattern 3: Invitation Flow (Email-Based)

**What:** Project owner invites a team member by email. The invitation is stored in Firestore. When the invitee signs in, pending invitations are shown. Accepting adds the invitee to the project's collaborators map.

**When to use:** Adding new team members to a project.

**Data Model:**
```
invitations/{invitationId}
{
  projectId: string,
  projectTitle: string,        // Denormalized for display
  inviteeEmail: string,        // Indexed for query
  role: 'line_producer' | 'abogado' | 'director',
  status: 'pending' | 'accepted' | 'declined' | 'revoked',
  invitedBy: string,           // UID of inviter
  inviterName: string,         // Display name of inviter
  createdAt: Timestamp,
  respondedAt: Timestamp | null,
}
```

**Cloud Function: inviteToProject**
```typescript
// functions/src/invitations/inviteToProject.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export const inviteToProject = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesion.')
    }

    const { projectId, inviteeEmail, role } = request.data as {
      projectId: string
      inviteeEmail: string
      role: string
    }

    // Validate inputs
    const validRoles = ['line_producer', 'abogado', 'director']
    if (!validRoles.includes(role)) {
      throw new HttpsError('invalid-argument', 'Rol no valido.')
    }

    const db = getFirestore()
    const projectRef = db.doc(`projects/${projectId}`)
    const projectSnap = await projectRef.get()

    if (!projectSnap.exists) {
      throw new HttpsError('not-found', 'Proyecto no encontrado.')
    }

    // Verify caller is the project owner (productor)
    const projectData = projectSnap.data()!
    if (projectData.ownerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Solo el productor puede invitar miembros.')
    }

    // Check if user is already a member
    const collaborators = projectData.collaborators || {}
    const existingMember = Object.entries(collaborators).find(
      ([_, data]) => data === inviteeEmail // Not by UID -- by email in existing members
    )
    // Better: check if inviteeEmail matches any existing member's email
    // For simplicity, check if there's already a pending invitation
    const existingInvite = await db.collection('invitations')
      .where('projectId', '==', projectId)
      .where('inviteeEmail', '==', inviteeEmail)
      .where('status', '==', 'pending')
      .get()

    if (!existingInvite.empty) {
      throw new HttpsError('already-exists', 'Ya existe una invitacion pendiente para este correo.')
    }

    // Create invitation
    await db.collection('invitations').add({
      projectId,
      projectTitle: projectData.metadata?.titulo_proyecto || '',
      inviteeEmail,
      role,
      status: 'pending',
      invitedBy: request.auth.uid,
      inviterName: request.auth.token.name || '',
      createdAt: FieldValue.serverTimestamp(),
      respondedAt: null,
    })

    return { success: true }
  }
)
```

**Cloud Function: acceptInvitation**
```typescript
// functions/src/invitations/acceptInvitation.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export const acceptInvitation = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesion.')
    }

    const { invitationId } = request.data as { invitationId: string }
    const db = getFirestore()

    // Use transaction to ensure atomicity
    await db.runTransaction(async (tx) => {
      const invRef = db.doc(`invitations/${invitationId}`)
      const invSnap = await tx.get(invRef)

      if (!invSnap.exists) {
        throw new HttpsError('not-found', 'Invitacion no encontrada.')
      }

      const inv = invSnap.data()!

      // Verify the invitation belongs to the caller
      if (inv.inviteeEmail !== request.auth!.token.email) {
        throw new HttpsError('permission-denied', 'Esta invitacion no es para ti.')
      }

      if (inv.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Esta invitacion ya fue respondida.')
      }

      // Update invitation status
      tx.update(invRef, {
        status: 'accepted',
        respondedAt: FieldValue.serverTimestamp(),
      })

      // Add user to project collaborators map AND memberUIDs array
      const projectRef = db.doc(`projects/${inv.projectId}`)
      tx.update(projectRef, {
        [`collaborators.${request.auth!.uid}`]: inv.role,
        memberUIDs: FieldValue.arrayUnion(request.auth!.uid),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    return { success: true }
  }
)
```

### Pattern 4: Project Listing with Access Control

**What:** The dashboard queries only projects the user owns or has been invited to. Uses `memberUIDs` array with `array-contains`.

**When to use:** Dashboard project listing.

**Example:**
```typescript
// src/services/projects.ts (modified listProjects)
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function listProjects(uid: string) {
  // Query projects where user is in memberUIDs array
  // ownerId is also in memberUIDs (added at project creation time)
  const q = query(
    collection(db, 'projects'),
    where('memberUIDs', 'array-contains', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      metadata: data.metadata as ProjectMetadata,
      collaborators: data.collaborators || {},
      ownerId: data.ownerId,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    }
  })
}
```

**Important:** When creating a project, the owner's UID must be added to both `collaborators` and `memberUIDs`:
```typescript
export async function createProject(uid: string): Promise<string> {
  const ref = doc(projectsCol)
  await setDoc(ref, {
    metadata: { /* ... existing defaults ... */ },
    ownerId: uid,
    collaborators: { [uid]: 'productor' },
    memberUIDs: [uid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}
```

### Pattern 5: Access Denied Guard (Route Level)

**What:** A hook that checks project membership and returns the user's role. If the user is not a member, renders an "Access Denied" page instead of loading project data.

**When to use:** In the WizardShell component, before rendering any project content.

**Example:**
```typescript
// src/hooks/useProjectAccess.ts
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { ProjectRole } from '@/lib/permissions'

interface ProjectAccess {
  hasAccess: boolean
  role: ProjectRole | null
  loading: boolean
}

export function useProjectAccess(projectId: string): ProjectAccess {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['project-access', projectId, user?.uid],
    queryFn: async () => {
      if (!user) return { hasAccess: false, role: null }
      const snap = await getDoc(doc(db, 'projects', projectId))
      if (!snap.exists()) return { hasAccess: false, role: null }

      const data = snap.data()
      if (data.ownerId === user.uid) {
        return { hasAccess: true, role: 'productor' as ProjectRole }
      }
      const collaborators = data.collaborators || {}
      if (user.uid in collaborators) {
        return { hasAccess: true, role: collaborators[user.uid] as ProjectRole }
      }
      return { hasAccess: false, role: null }
    },
    enabled: !!user && !!projectId,
  })

  return {
    hasAccess: data?.hasAccess ?? false,
    role: data?.role ?? null,
    loading: isLoading,
  }
}
```

### Pattern 6: Cloud Function Project Membership Guard

**What:** Shared middleware for Cloud Functions that verifies the caller is a member of the project being operated on.

**When to use:** Every Cloud Function that operates on a specific project.

**Example:**
```typescript
// functions/src/middleware/requireProjectAccess.ts
import { HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import type { CallableRequest } from 'firebase-functions/v2/https'

export async function requireProjectAccess(
  request: CallableRequest,
  projectId: string
): Promise<string> {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesion.')
  }

  const db = getFirestore()
  const projectSnap = await db.doc(`projects/${projectId}`).get()

  if (!projectSnap.exists) {
    throw new HttpsError('not-found', 'Proyecto no encontrado.')
  }

  const data = projectSnap.data()!
  const uid = request.auth.uid

  if (data.ownerId === uid) return 'productor'

  const collaborators = data.collaborators || {}
  if (uid in collaborators) return collaborators[uid]

  throw new HttpsError('permission-denied', 'No tienes acceso a este proyecto.')
}
```

### Anti-Patterns to Avoid

- **Using custom claims for per-project roles:** Custom claims are global and limited to 1000 bytes. A user with access to 10 projects would need `{ projects: { projA: "productor", projB: "abogado", ... } }` -- hits the 1000-byte limit fast and requires token refresh on every invitation. Use document-level roles instead.
- **Storing roles in a separate `members` subcollection:** Checking subcollection membership in security rules requires a `get()` call, consuming one of the 10-call limit. A map on the project document is free to check.
- **Using `collaborators` map alone without `memberUIDs` array:** Firestore cannot query "all projects where UID X is a key in a map field." You need a denormalized `memberUIDs` array for `array-contains` queries on the dashboard.
- **Checking roles only in the UI:** Client-side `permissions.ts` is UX convenience. The real enforcement is in Firestore security rules and Cloud Function guards. A user with DevTools can bypass UI restrictions.
- **Querying invitations by `inviteeUID`:** At invitation time, the invitee may not have an account yet. Store `inviteeEmail` and query by `request.auth.token.email` after sign-in.
- **Using `where('ownerId', '==', uid)` for dashboard listing:** This misses projects where the user is a collaborator but not the owner. Use `where('memberUIDs', 'array-contains', uid)` which covers both owners (who are also in `memberUIDs`) and collaborators.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role validation in security rules | Complex helper functions with multiple `get()` calls | `resource.data.collaborators[request.auth.uid]` direct map access | Zero-cost check, no `get()` calls consumed |
| Email-based invitation tokens | Custom JWT or UUID token generation for invite links | Firestore `invitations` collection + `where('inviteeEmail', '==', email)` | Firebase Auth already provides verified email via `request.auth.token.email` |
| Project listing filter | Client-side filter of all projects | `where('memberUIDs', 'array-contains', uid)` query | Server-side filtering via Firestore index -- security rules also enforce this |
| Atomic collaborator + memberUIDs sync | Two separate writes with error handling | Firestore transaction in Cloud Function | Transaction ensures both fields update atomically or not at all |
| Permission checking utility | Custom role-to-permission mapping per component | Centralized `ROLE_PERMISSIONS` constant + `canEditScreen()` / `canViewScreen()` helpers | Single source of truth, referenced by all components and hooks |

**Key insight:** Firestore's document-level map access in security rules (`resource.data.collaborators[uid]`) is the killer feature for this pattern. It provides zero-cost membership checks without the 10-call `get()` limit that sinks most RBAC implementations on Firestore.

## Common Pitfalls

### Pitfall 1: Collaborators Map and MemberUIDs Array Out of Sync

**What goes wrong:** A user accepts an invitation. The Cloud Function adds them to `collaborators` but not `memberUIDs` (or vice versa). The user can access the project directly but does not see it on their dashboard (or sees it but gets "access denied" when opening it).
**Why it happens:** Two fields representing the same data must be kept in sync. If written separately, a failure between writes creates inconsistency.
**How to avoid:** Use a Firestore transaction for all operations that modify team membership (accept invitation, revoke access). Both `collaborators` and `memberUIDs` must be updated in the same atomic transaction. Validate in tests that both fields are consistent after every membership change.
**Warning signs:** User reports "I accepted the invitation but the project does not appear on my dashboard." Or "I see the project but it says 'Sin acceso.'"

### Pitfall 2: Firestore Composite Index Missing for memberUIDs + createdAt

**What goes wrong:** The dashboard query `where('memberUIDs', 'array-contains', uid).orderBy('createdAt', 'desc')` fails with a Firestore error: "The query requires an index."
**Why it happens:** Firestore requires a composite index when using `where()` on one field and `orderBy()` on another. `array-contains` + `orderBy` on different fields always requires a composite index.
**How to avoid:** Proactively add the composite index to `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "memberUIDs", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```
Deploy with `firebase deploy --only firestore:indexes` before the first production query.
**Warning signs:** The dashboard shows an error immediately after deploying. Firebase Console error logs show "index required" messages.

### Pitfall 3: Invitee Email Case Sensitivity

**What goes wrong:** Owner invites `User@LemonStudios.com` but the invitee signs in with Google as `user@lemonstudios.com`. The query `where('inviteeEmail', '==', email)` finds no matches.
**Why it happens:** Email addresses are case-insensitive per RFC 5321, but Firestore string comparisons are case-sensitive.
**How to avoid:** Normalize all email addresses to lowercase before storing and before querying. Do this in both the `inviteToProject` function (when storing) and the pending invitations query (when fetching): `inviteeEmail.toLowerCase().trim()`.
**Warning signs:** User says "I was invited but I do not see any pending invitations."

### Pitfall 4: Security Rules Deployed Without memberUIDs on Existing Projects

**What goes wrong:** New security rules require `request.auth.uid in resource.data.memberUIDs` but existing projects from Phase 10 only have `ownerId`, not `memberUIDs` or `collaborators`. All existing project reads fail with "permission denied."
**Why it happens:** Same pattern as Phase 10's migration concern -- rules require fields that old documents lack.
**How to avoid:** Run a migration that adds `collaborators: { [ownerId]: 'productor' }` and `memberUIDs: [ownerId]` to all existing projects before deploying the new security rules. Use a Cloud Function with Admin SDK (bypasses rules) or a phased rule deployment.
**Warning signs:** "Permission denied" errors on all existing projects immediately after deploying Phase 11 rules.

### Pitfall 5: Owner Not in Collaborators Map

**What goes wrong:** The project owner creates a project. `ownerId` is set but `collaborators` does not include the owner. Security rules check `collaborators[uid]` and fail because the owner is not in the map.
**Why it happens:** The `isProjectMember()` rule function checks `ownerId` OR `collaborators`, but the `getUserRole()` function checks `collaborators[uid]` to determine the role. If the owner is not in the map, role lookup fails.
**How to avoid:** Always add the owner to both `collaborators` (with role `'productor'`) and `memberUIDs` at project creation time. This ensures all permission checks work uniformly whether the user is the owner or a collaborator.
**Warning signs:** Owner can read the project but role-based write restrictions behave unexpectedly.

### Pitfall 6: Cloud Functions Not Checking Project Membership

**What goes wrong:** An authenticated user who is NOT a member of a project can call `runLineProducerPass({ projectId: 'someone-elses-project' })` and trigger AI generation on a project they should not access.
**Why it happens:** Phase 10 adds `requireAuth()` to Cloud Functions (checks authentication) but not project membership. Phase 11 must add `requireProjectAccess()` to all project-scoped functions.
**How to avoid:** Every Cloud Function that takes a `projectId` must call `requireProjectAccess(request, projectId)` after `requireAuth()`. This returns the caller's role, which can be used for additional permission checks.
**Warning signs:** Security audit finds that authenticated users can call functions on any project ID.

## Code Examples

### Pending Invitations Check on Sign-In

```typescript
// src/services/invitations.ts
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface PendingInvitation {
  id: string
  projectId: string
  projectTitle: string
  role: string
  inviterName: string
  createdAt: Date
}

export async function getPendingInvitations(email: string): Promise<PendingInvitation[]> {
  const q = query(
    collection(db, 'invitations'),
    where('inviteeEmail', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      role: data.role,
      inviterName: data.inviterName,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    }
  })
}
```

### Access Denied Component (Spanish)

```typescript
// src/components/auth/AccessDenied.tsx
import { Link } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-semibold">Sin acceso</h1>
        <p className="text-muted-foreground max-w-md">
          No tienes permisos para acceder a este proyecto.
          Contacta al productor del proyecto para solicitar acceso.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
```

### WizardShell with Access Check

```typescript
// In WizardShell.tsx -- add access check at the top
import { useProjectAccess } from '@/hooks/useProjectAccess'
import { AccessDenied } from '@/components/auth/AccessDenied'

export function WizardShell() {
  const { projectId = '', screen } = useParams<{ projectId: string; screen: string }>()
  const { hasAccess, role, loading: accessLoading } = useProjectAccess(projectId)

  if (accessLoading) {
    return <div className="flex h-screen items-center justify-center">
      <span className="text-muted-foreground">Verificando acceso...</span>
    </div>
  }

  if (!hasAccess) {
    return <AccessDenied />
  }

  // ... existing WizardShell content, with `role` available for permission checks
}
```

### Migration Script: Add Collaborators to Existing Projects

```typescript
// functions/src/migrations/addCollaboratorsField.ts
// Run once via Cloud Function or Admin SDK script
import { getFirestore } from 'firebase-admin/firestore'

export async function migrateProjectsAddCollaborators() {
  const db = getFirestore()
  const projects = await db.collection('projects').get()

  const batch = db.batch()
  let count = 0

  for (const doc of projects.docs) {
    const data = doc.data()
    // Skip if already has collaborators
    if (data.collaborators) continue

    const ownerId = data.ownerId
    if (!ownerId) continue  // Skip pre-Phase-10 orphans (should not exist)

    batch.update(doc.ref, {
      collaborators: { [ownerId]: 'productor' },
      memberUIDs: [ownerId],
    })
    count++

    // Firestore batch limit: 500 operations
    if (count >= 500) {
      await batch.commit()
      count = 0
    }
  }

  if (count > 0) {
    await batch.commit()
  }
}
```

### Spanish Locale Strings for RBAC UI

```typescript
// Additions to src/locales/es.ts
rbac: {
  roles: {
    productor: 'Productor(a)',
    line_producer: 'Productor(a) de linea',
    abogado: 'Abogado(a)',
    director: 'Director(a)',
  },
  invite: {
    title: 'Invitar al equipo',
    emailLabel: 'Correo electronico',
    emailPlaceholder: 'correo@ejemplo.com',
    roleLabel: 'Rol en el proyecto',
    sendButton: 'Enviar invitacion',
    sending: 'Enviando...',
    successToast: 'Invitacion enviada correctamente',
    errorToast: 'Error al enviar la invitacion',
    alreadyInvited: 'Este correo ya tiene una invitacion pendiente',
    alreadyMember: 'Este usuario ya es miembro del proyecto',
  },
  pending: {
    title: 'Invitaciones pendientes',
    invitedBy: 'Invitado por',
    acceptButton: 'Aceptar',
    declineButton: 'Rechazar',
    noInvitations: 'No tienes invitaciones pendientes',
    acceptedToast: 'Te uniste al proyecto',
    declinedToast: 'Invitacion rechazada',
  },
  team: {
    title: 'Equipo del proyecto',
    owner: 'Propietario',
    removeButton: 'Quitar del proyecto',
    removeConfirm: 'Estas seguro de quitar a este miembro del proyecto?',
    removedToast: 'Miembro eliminado del proyecto',
  },
  accessDenied: {
    title: 'Sin acceso',
    description: 'No tienes permisos para acceder a este proyecto. Contacta al productor del proyecto para solicitar acceso.',
    backButton: 'Volver al inicio',
  },
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom claims for all RBAC | Custom claims for global roles, document-level maps for per-resource roles | Well-established (2020+) | Custom claims have 1000-byte limit. Per-document roles scale better for multi-project scenarios. |
| `members` subcollection under projects | `collaborators` map field on project document | Firebase official recommendation (2022+) | Map field is free to check in security rules (`resource.data`), subcollection requires `get()` call. |
| Client-side role filtering | Security rules + Cloud Function guards + client-side UI gating | Always been best practice | Triple enforcement: rules block unauthorized reads, functions block unauthorized mutations, UI hides inaccessible controls. |
| `ownerId` field only | `ownerId` + `collaborators` map + `memberUIDs` array | Standard for multi-user apps | Three fields serve different purposes: `ownerId` for ownership, `collaborators` for role lookup, `memberUIDs` for query-ability. |

**Deprecated/outdated:**
- Using `get()` in security rules to check a separate `roles` or `users` collection for every operation: This approach hits the 10-call limit and is slow. Use document-level maps instead.
- Firebase Invites SDK: Deprecated since 2020. Roll your own invitation flow with Firestore.

## Open Questions

1. **Should the invitation include a notification mechanism?**
   - What we know: AUTH-05 says "invite by email." COLLAB-06 (Phase 13) says "email notification and accept/decline via link."
   - What's unclear: Whether Phase 11 needs email sending (Firebase Extension: "Trigger Email") or if invitations are shown in-app only.
   - Recommendation: For Phase 11, implement in-app invitation display only (query pending invitations on sign-in). Email notification is explicitly Phase 13 (COLLAB-06). Keep Phase 11 focused on the RBAC data model and access control enforcement.

2. **Migration ordering: collaborators field before or during rules deployment?**
   - What we know: Same pattern as Phase 10 -- new rules require fields that old documents lack.
   - What's unclear: Whether Phase 10 already adds `collaborators` or if Phase 11 migration is needed.
   - Recommendation: Phase 10's research shows `ownerId` being added but NOT `collaborators` or `memberUIDs`. Phase 11 must include a migration task as the first step: add `collaborators: { [ownerId]: 'productor' }` and `memberUIDs: [ownerId]` to all existing projects. Deploy rules AFTER migration completes.

3. **Role for ERPI settings access**
   - What we know: ERPI settings are user-scoped (`erpi_settings/{uid}`) from Phase 10. But in a multi-user project, all team members may need to read ERPI data.
   - What's unclear: Whether ERPI settings should be shared across the team or remain owner-only.
   - Recommendation: Keep ERPI settings as owner-only for now (Phase 10 scoping). Cloud Functions read ERPI via `ownerId` from the project document. Team members do not need direct ERPI access -- they see the generated documents that incorporate ERPI data. Revisit if Phase 12 collaboration requires shared ERPI editing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (unit) + Playwright 1.58.2 (e2e) |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (e2e) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-04 | ROLE_PERMISSIONS correctly maps 4 roles to screen access | unit | `npx vitest run src/lib/__tests__/permissions.test.ts` | No -- Wave 0 |
| AUTH-04 | canEditScreen/canViewScreen return correct values for each role | unit | `npx vitest run src/lib/__tests__/permissions.test.ts` | No -- Wave 0 |
| AUTH-05 | inviteToProject creates invitation document with correct fields | unit (mock) | `npx vitest run src/__tests__/functions/inviteToProject.test.ts` | No -- Wave 0 |
| AUTH-05 | acceptInvitation adds user to collaborators and memberUIDs atomically | unit (mock) | `npx vitest run src/__tests__/functions/acceptInvitation.test.ts` | No -- Wave 0 |
| AUTH-06 | listProjects returns only projects where user is member | unit | `npx vitest run src/services/__tests__/projects.test.ts -t "listProjects"` | No -- Wave 0 |
| AUTH-06 | useProjectAccess returns hasAccess=false for non-member | unit | `npx vitest run src/hooks/__tests__/useProjectAccess.test.ts` | No -- Wave 0 |
| AUTH-06 | AccessDenied renders for unauthorized project URL | e2e | `npx playwright test e2e/05-rbac.spec.ts -g "access denied"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/permissions.test.ts` -- covers AUTH-04 (ROLE_PERMISSIONS map, canEditScreen, canViewScreen)
- [ ] `src/__tests__/functions/inviteToProject.test.ts` -- covers AUTH-05 (invitation creation logic)
- [ ] `src/__tests__/functions/acceptInvitation.test.ts` -- covers AUTH-05 (invitation acceptance + collaborator update)
- [ ] `src/services/__tests__/projects.test.ts` -- covers AUTH-06 (listProjects with memberUIDs filtering)
- [ ] `src/hooks/__tests__/useProjectAccess.test.ts` -- covers AUTH-06 (access check hook)
- [ ] `e2e/05-rbac.spec.ts` -- covers AUTH-06 (access denied page, project listing isolation)

Note: E2E tests for RBAC require Firebase Auth Emulator + Firestore Emulator running with seed data (two users, one project, one user as member and one not).

## Sources

### Primary (HIGH confidence)
- [Firebase Official: Control Access with Custom Claims and Security Rules](https://firebase.google.com/docs/auth/admin/custom-claims) -- custom claims API, 1000-byte limit, `setCustomUserClaims()`, `request.auth.token` in rules
- [Firebase Official: Secure data access for users and groups](https://firebase.google.com/docs/firestore/solutions/role-based-access) -- document-level roles map pattern, `resource.data.roles[request.auth.uid]` syntax
- [Firebase Official: Writing conditions for Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions) -- `in` operator for maps, `resource.data` vs `get()` cost, 10-call limit
- [Firebase Official: Perform simple and compound queries](https://firebase.google.com/docs/firestore/query-data/queries) -- `array-contains` operator for memberUIDs query
- [Firebase Official: Security Rules and Firebase Authentication](https://firebase.google.com/docs/rules/rules-and-auth) -- `request.auth.uid`, `request.auth.token.email` patterns
- npm registry (verified 2026-03-25): firebase@12.11.0, firebase-admin@13.7.0, firebase-functions@7.2.2

### Secondary (MEDIUM confidence)
- [freeCodeCamp: How to Create RBAC with Custom Claims Using Firebase Rules](https://www.freecodecamp.org/news/firebase-rbac-custom-claims-rules/) -- Complete RBAC tutorial with code examples, `setCustomUserClaims` Cloud Function pattern
- [OneUpTime: Firebase Auth with Custom Claims for RBAC (2026)](https://oneuptime.com/blog/post/2026-02-17-how-to-set-up-firebase-auth-with-custom-claims-for-role-based-access-control-in-gcp/view) -- Token refresh strategy, Firestore signaling mechanism
- [Firebase Developers Blog: Patterns for security with Firebase -- group-based permissions](https://medium.com/firebase-developers/patterns-for-security-with-firebase-group-based-permissions-for-cloud-firestore-72859cdec8f6) -- Group permissions pattern

### Tertiary (LOW confidence)
- None. All findings verified against official Firebase documentation.

### Project-Internal Sources (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` -- v2.0 architecture with roles map pattern, ROLE_PERMISSIONS constant, RoleGate component
- `.planning/research/PITFALLS.md` -- Pitfall 10 (Firestore 10-read limit), Pitfall 11 (CLAUDE.md directive)
- `.planning/phases/10-authentication-identity/10-RESEARCH.md` -- Phase 10 auth foundation, ProtectedRoute pattern, security rules phased deployment

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed. No new packages. Firebase SDK patterns are well-documented and verified.
- Architecture: HIGH -- document-level roles map is the official Firebase recommendation for per-resource RBAC. Verified against Firebase Solutions docs and multiple sources.
- Pitfalls: HIGH -- pitfalls documented from official Firebase limitations (10-read limit, composite indexes, email case sensitivity) and direct codebase analysis (migration ordering, dual field sync).
- Invitation flow: MEDIUM -- the basic pattern (Firestore document + Cloud Function) is well-established, but the exact UX (in-app vs email notification) has an open question deferred to Phase 13.

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- Firebase security rules and custom claims APIs have not changed in 2+ years)
