# Phase 11: RBAC & Project Access Control - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Role-based access control with 4 roles (productor, line_producer, abogado, director), project invitation flow via email, Firestore security rules enforcement for per-project membership, and access denied UX. Phase 10 provides authentication and project ownership. Phase 12 adds real-time collaboration with section-level locking.

</domain>

<decisions>
## Implementation Decisions

### Role Permission Matrix
- **D-01:** Screen-level permissions, not field-level. A role can access an entire wizard screen or not — no per-field granularity. 4 roles × ~10 screens/actions is manageable. Field-level would be 4 roles × ~200 fields.
- **D-02:** Permission matrix:

| Action/Screen | productor | line_producer | abogado | director |
|---|---|---|---|---|
| Screen 1: Project Setup | ✅ edit | 👁 view | 👁 view | 👁 view |
| Screen 2: Screenplay | ✅ edit | 👁 view | 👁 view | ✅ edit |
| Screen 3: Creative Team | ✅ edit | 👁 view | 👁 view | ✅ edit |
| Screen 4: Financials | ✅ edit | ✅ edit | 👁 view | 👁 view |
| Screen 5: Uploads | ✅ edit | ✅ edit | ✅ edit | ✅ edit |
| Budget editor | ✅ edit | ✅ edit | 👁 view | 👁 view |
| Generated docs (view) | ✅ | ✅ | ✅ | ✅ |
| Generated docs (edit) | ✅ edit | ✅ edit (own pass) | ✅ edit (legal) | 👁 view |
| Trigger generation | ✅ all | ✅ all | ❌ | ❌ |
| Validation dashboard | ✅ | ✅ | ✅ | ✅ |
| Export carpeta | ✅ | ✅ | ❌ | ❌ |
| Project settings | ✅ | ❌ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ | ❌ |

- **D-03:** Role-scoped regeneration: each role can regenerate passes containing documents within their edit scope. Abogado can trigger Pass 4 (Legal). Line producer can trigger Passes 2 and 3. Productor can trigger any pass or the full pipeline. Defined by edit scope, not hardcoded pass numbers.
- **D-04:** View-only screens show a read-only banner: "Solo lectura — contacta a [Productor Name] para editar." Shows the productor's actual name, not a generic label. All data visible, no fields disabled/greyed out.
- **D-05:** Actions outside a user's role are hidden, not disabled. If the director can't export, the export button doesn't appear. Don't show disabled buttons — hidden UI is cleaner and consistent with the read-only banner approach.

### Invitation Flow
- **D-06:** In-app invitation by email address with role selection. Productor opens project settings, types email, selects role from dropdown (line_producer / abogado / director), clicks "Invitar." Simple and direct for a 4-person team.
- **D-07:** Cloud Function sends notification email via Resend (simpler API, better DX than SendGrid for single-template use case). Email says: "[Productor name] te invitó al proyecto '[Título]' como [role] en Carpetify. Haz clic para aceptar." with link to app.
- **D-08:** Accept/decline flow: clicking the email link opens the app, shows invitation details (project name, role, inviter) with "Aceptar" and "Rechazar" buttons. Accepting adds user to project with assigned role and redirects to project dashboard. Declining deletes the invitation record.
- **D-09:** Email matching safeguard: if someone clicks an invite link but is signed in with a different email than the one invited, show "Esta invitación fue enviada a [invited@email.com]. Inicia sesión con esa cuenta para aceptar." Never auto-apply invitations to a different account than the one the productor invited.
- **D-10:** Invitations expire after 7 days. Project settings shows: active team members (with role + "Revocar acceso"), pending invitations (with "Reenviar" + "Cancelar"), and expired invitations (with "Reenviar"). No invitation hangs forever.

### Firestore Data Model
- **D-11:** `members` map field on the project document: `members: { "userId123": { role: "line_producer", email: "lp@email.com", name: "María", joinedAt: timestamp } }`. Firestore security rules check `resource.data.members[request.auth.uid] != null` in a single read. Max 4-5 team members — map is tiny.
- **D-12:** Pending invitations stored in `projects/{projectId}/invitations/{invitationId}` subcollection. Fields: email, role, inviterId, inviterName, projectTitle, createdAt, expiresAt, status (pending/accepted/declined/expired). Accepted invitations become `members` map entries; declined/expired ones get deleted.
- **D-13:** Denormalized `userProjects` index at `users/{userId}/projects/{projectId}` with `{ role, projectTitle, joinedAt }`. Dashboard queries this for fast "my projects" listing. Maintained via batched writes in a Cloud Function — NEVER client-side dual writes. Atomic or nothing.
- **D-14:** Firestore security rules MUST be implemented in this phase. Rules enforce: authenticated users can only read/write projects where they appear in the `members` map. The current wide-open rules (`allow read, write: if true`) are replaced with membership-based rules.
- **D-15:** Role changes and access revocation update both the `members` map AND the `userProjects` index atomically via Cloud Function batch write. Role changes take effect immediately — permissions checked against Firestore data on every operation, not cached. Revocation removes the member from both locations — project disappears from their dashboard on next load.

### Access Denied UX
- **D-16:** No-access to project shows a clean page: "No tienes acceso a este proyecto" with the productor's name and a "Solicitar acceso" button. Button creates an in-app notification for the productor (stored in Firestore, visible in project settings). No email for access requests — in-app nudge only.
- **D-17:** Firestore `permission-denied` errors caught in the service layer, shown as toast: "No tienes permiso para realizar esta acción." Raw Firebase errors never exposed. Incidents logged to a `security_events` collection (userId, action, projectId, timestamp) for audit trail.

### Claude's Discretion
- Firestore security rules syntax for the `members` map pattern
- Resend email template design and API integration
- Invitation link URL structure (deep link with invitation ID)
- How to handle invitation for someone who hasn't signed up yet (lazy account creation on first sign-in)
- Project settings UI layout for team management panel
- `security_events` collection structure and retention policy
- How to surface access requests to the productor (badge on settings, notification indicator)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication (Phase 10 foundation)
- `src/contexts/AuthContext.tsx` — Auth state management, Google sign-in flow
- `src/lib/firebase.ts` — Firebase init (Auth already configured)
- `src/components/auth/ProtectedRoute.tsx` — Route protection pattern

### Project data model
- `src/services/projects.ts` — CRUD operations. `createProject()` needs to set `members` map with creator as productor. `listProjects()` replaced by `userProjects` index query.
- `src/schemas/project.ts` — Project metadata schema. Add `members` map type.

### Cloud Functions
- `functions/src/index.ts` — All 7 callables need membership check (currently only check `request.auth` exists). Extend to verify `members[uid]` exists AND role has permission for the action.

### Security Rules
- `firestore.rules` — Currently wide open (`allow read, write: if true`). Replace entirely with membership-based rules.
- `storage.rules` — Currently wide open. Replace with membership-based access.

### UI Components
- `src/components/dashboard/DashboardPage.tsx` — Filter to show only member projects via `userProjects` index
- `src/components/layout/AppHeader.tsx` — User menu already exists from Phase 10

### Prior phase decisions
- `.planning/phases/10-authentication-identity/10-CONTEXT.md` — D-02: any Google account can sign in. D-05: org-based structure. D-10: non-owners see empty dashboard. D-14/D-15: Cloud Function auth checks (extend from ownership to membership).

### Language policy
- `directives/politica_idioma.md` — All invitation emails, access denied messages, role labels, and team management UI in Mexican Spanish.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/contexts/AuthContext.tsx` — Auth state with `user` object (has `uid`, `email`, `displayName`)
- `src/stores/appStore.ts` — Zustand store pattern (has unused `currentUserId` field — repurpose or remove)
- `src/locales/es.ts` — All new UI strings (role labels, invitation text, access denied messages) go here
- `functions/src/index.ts` — `onCall` pattern with `HttpsError` for all 7 callables

### Established Patterns
- Zustand for client state, React Query for server state
- Cloud Functions use `onCall` with `HttpsError('unauthenticated')` and `HttpsError('permission-denied')`
- All UI strings from `src/locales/es.ts`
- Batched writes via `writeBatch()` in Cloud Functions

### Integration Points
- Phase 10 `ownerId` field on projects → becomes `members` map with owner as `productor` role
- Phase 10 org structure (`organizations/{orgId}`) → invitations scoped to org
- Phase 12 needs `members` map to implement section-level locking per role
- Phase 13 needs `members` data for activity log attribution
- Dashboard filters change from `ownerId == uid` to `userProjects/{uid}/projects` query

</code_context>

<specifics>
## Specific Ideas

- The permission matrix is designed around how a real Mexican film production team works: the productor runs the show, the line producer handles money and logistics, the abogado handles legal, the director handles creative. Everyone can upload their own documents (IDs, signed contracts) and everyone can see everything — transparency within the team.
- Role-scoped regeneration prevents the director from accidentally burning API money on a full pipeline run. Each role can only regenerate the passes they're responsible for editing.
- Email matching on invitations prevents a common mistake: the productor invites maria@lemon.com, but María clicks the link while signed in with her personal maria@gmail.com. Without the safeguard, she'd join the project with the wrong account and the productor's intended recipient never gets access.
- The `security_events` collection is not paranoia — it's audit hygiene for a tool handling $25M MXN funding applications.

</specifics>

<deferred>
## Deferred Ideas

- Section-level locking based on roles — Phase 12 (real-time collaboration)
- Activity log with field-level change attribution — Phase 13
- Email notification when access is revoked — v2.1 (currently revocation is silent)
- Bulk invitation (invite entire team at once) — v2.1 if team size grows beyond 4-5
- Custom roles beyond the 4 predefined — v2.1 if role flexibility is needed

</deferred>

---

*Phase: 11-rbac-access-control*
*Context gathered: 2026-03-25*
