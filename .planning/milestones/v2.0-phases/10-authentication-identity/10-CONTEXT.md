# Phase 10: Authentication & Identity - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely sign in with Google, the app knows who they are, existing v1.0 data is preserved under proper ownership, and all Cloud Functions reject unauthenticated calls. This phase adds Firebase Auth, route protection, data migration, and CLAUDE.md updates. RBAC roles and project invitations are Phase 11.

</domain>

<decisions>
## Implementation Decisions

### Sign-in page
- **D-01:** Branded landing page with Lemon Studios branding, brief Carpetify description, and "Iniciar sesión con Google" button
- **D-02:** Any Google account can sign in (no domain restriction) — access controlled at project level, not login level
- **D-03:** All UI text on sign-in page in Mexican Spanish per language policy
- **D-04:** Dark mode support on sign-in page (matches existing app toggle)

### First login and org creation
- **D-05:** After first Google sign-in, user must create an organization (e.g., "Lemon Studios") before accessing the dashboard — explicit org creation step, not auto-created
- **D-06:** Organization stored in Firestore at `organizations/{orgId}` with `name`, `createdBy`, `createdAt` fields
- **D-07:** ERPI settings migrate from `erpi_settings/default` to `organizations/{orgId}/erpi_settings/default` — shared at org level, not per-user

### v1.0 data migration
- **D-08:** First person to sign in automatically becomes owner of all existing v1.0 projects (no manual script, no per-project claiming)
- **D-09:** Migration runs on first login: adds `ownerId` and `orgId` to all existing `projects/{id}` documents
- **D-10:** Second and subsequent users see an empty dashboard until invited to projects (Phase 11)

### Route protection
- **D-11:** AuthProvider context wraps BrowserRouter in App.tsx — single source of auth state
- **D-12:** ProtectedRoute component redirects to sign-in page if unauthenticated — no flash of app content
- **D-13:** Session persists across browser close/reopen via Firebase Auth persistence (browserLocalPersistence)

### Cloud Functions
- **D-14:** All 7 existing callable functions require authentication — reject with `HttpsError('unauthenticated')` if no `request.auth`
- **D-15:** Functions verify caller owns the project (query `ownerId` field) before proceeding — reject with `HttpsError('permission-denied')` if not owner

### Firestore & Storage rules
- **D-16:** Deploy Firestore security rules AFTER data migration completes (deploying before would lock out unmigrated projects)
- **D-17:** Rules enforce: authenticated users can only read/write projects where `ownerId == request.auth.uid`
- **D-18:** Storage rules enforce: authenticated users can only access files under `projects/{projectId}/` where they own the project

### CLAUDE.md update
- **D-19:** Remove "Add Firebase Auth (single-user by design)" from Never list
- **D-20:** Update comments about "NO Auth" to reflect auth is now required
- **D-21:** Add to Always: "Validate user authentication before any Firestore or Cloud Function operation"

### Claude's Discretion
- Auth token refresh strategy (silent vs prompt)
- Loading skeleton during auth state resolution
- Exact organization creation form layout
- Firebase emulator configuration for testing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication
- `src/lib/firebase.ts` — Firebase init (add getAuth here)
- `src/App.tsx` — Route structure (wrap with AuthProvider)
- `src/stores/appStore.ts` — Zustand store pattern (add AuthState)

### Cloud Functions
- `functions/src/index.ts` — All 7 callables need auth enforcement (lines 32-348)

### Security Rules
- `firestore.rules` — Currently wide open (replace entirely)
- `storage.rules` — Currently wide open (replace entirely)

### Data Services
- `src/services/projects.ts` — CRUD operations need ownerId (lines 21-119)
- `src/services/erpi.ts` — Singleton path needs migration to org-scoped (line 5)
- `functions/src/pipeline/orchestrator.ts` — Backend ERPI read needs org path (line 146)

### UI Components
- `src/components/layout/AppHeader.tsx` — Add user menu + logout (lines 18-66)
- `src/components/dashboard/DashboardPage.tsx` — Filter projects by ownership (lines 45-159)

### CLAUDE.md
- `CLAUDE.md` — Lines 52, 132, 173 need auth directive updates

### Research
- `.planning/research/ARCHITECTURE.md` — Auth integration architecture
- `.planning/research/PITFALLS.md` — 6 critical migration pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/appStore.ts` — Zustand store pattern for auth state
- `src/hooks/useAutoSave.ts` — Debounce + retry pattern adaptable for auth operations
- `src/locales/es.ts` — All new auth UI strings go here

### Established Patterns
- Zustand stores for client state, React Query for server state
- All UI strings from `src/locales/es.ts` (never hardcode Spanish)
- Firebase SDK already bundled (just add `getAuth` import)
- Cloud Functions use `onCall` with `HttpsError` for error handling

### Integration Points
- `src/lib/firebase.ts` — Add `getAuth()` export
- `src/App.tsx` — Wrap with AuthProvider
- `functions/src/index.ts` — Add auth checks to all 7 callables
- `src/services/projects.ts` — Add `ownerId` to create, filter to list
- `src/services/erpi.ts` — Change path from global to org-scoped

</code_context>

<deferred>
## Deferred Ideas

- Role-based access control (RBAC with 4 roles) — Phase 11
- Project invitation by email — Phase 11
- Firestore security rules for project membership (beyond ownership) — Phase 11
- Section-level locking — Phase 12
- Activity log — Phase 13

</deferred>

---

*Phase: 10-authentication-identity*
*Context gathered: 2026-03-25*
