# Phase 12: Real-Time Collaboration - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time collaboration for a 4-5 person team: section-level locking on wizard screens and generated documents, presence indicators (who's online, where they are), real-time data sync via Firestore onSnapshot, and role-aware conflict messaging. NOT CRDTs or Google Docs-style co-editing — section locking is sufficient for form-based data entry with a small team. Phase 11 provides the permission matrix. Phase 13 adds activity tracking.

</domain>

<decisions>
## Implementation Decisions

### Section Locking
- **D-01:** Lock acquires on edit intent (user clicks into a field or clicks "Editar" on a generated doc), not on page open. Viewing a screen does not lock it. Multiple users can view the same screen simultaneously without blocking each other.
- **D-02:** Lock granularity: per wizard screen (5 independent zones) + per generated document in the document viewer. Locking the entire project is too aggressive. Per-field locking is CRDTs in disguise (out of scope). Screen-level allows real parallel work — LP edits budget while abogado edits a contract.
- **D-03:** Three lock release mechanisms: (1) explicit — user navigates away or clicks "Terminar edición," (2) idle — lock releases automatically after 60 seconds of inactivity following auto-save, (3) disconnect timeout — lock expires after 2 minutes if browser disconnects. Prevents stale locks from blocking the team.
- **D-04:** Productor can force-break any lock from project settings. Confirmation dialog: "María (line_producer) tiene esta sección bloqueada. ¿Desbloquear? Los cambios no guardados de María se perderán." Only the productor role has force-break power. Other roles wait for timeout.

### Presence Indicators
- **D-05:** Avatar row in project header (who's online) + per-screen avatar dot in sidebar (where they are). Header shows small circular avatars of all team members currently in the project. Sidebar shows avatar dot next to screen name if someone is on that screen.
- **D-06:** Google profile photo in a colored ring. Green ring = viewing (read-only). Orange ring = editing (has a lock). Hover shows name + role: "María — Line Producer." No photo = initials in colored circle.
- **D-07:** Presence lifecycle: user is "present" when project is open in active browser tab. "Viewing" a screen when that screen is rendered. Presence dims after 30 seconds of tab inactivity (switched tab, minimized). Presence removed after 2-minute disconnect timeout (matching lock timeout).
- **D-08:** Presence and lock data stored in Firebase Realtime Database (RTDB), NOT Firestore. RTDB has built-in `.info/connected` and `onDisconnect()` for automatic cleanup on disconnect. Store at `presence/{projectId}/{userId}` and `locks/{projectId}/{screenId}`.
- **D-09:** **HARD LINE: RTDB is for presence and locks ONLY. Everything else stays in Firestore.** No data creep into RTDB. Two databases, strict separation of concerns.

### Real-Time Data Sync
- **D-10:** Firestore `onSnapshot` listeners on active project document and subcollections. Changes pushed within 1-2 seconds. Extend existing React Query + Firestore pattern to real-time instead of fetch-on-mount. No polling, no custom WebSocket layer.
- **D-11:** Read-only viewers see incoming changes immediately. No conflict possible — they can't have unsaved edits. Data updates under them transparently.
- **D-12:** Lock holder works in isolation — does NOT see incoming changes to the locked screen until they release the lock. Prevents jarring mid-edit data shifts. When they save and release, their changes overwrite. Safe because locks prevent simultaneous editing of the same screen.
- **D-13:** No special stale data notification needed. `onSnapshot` keeps local cache current at all times. Navigating to a screen always shows latest data because the listener is already running.

### Lock + Role Interaction
- **D-14:** Role restriction takes priority over lock in the UI. If a user can't edit a screen due to their role, they see only the role-based banner ("Solo lectura — contacta a [Productor Name] para editar"), never the lock message. Showing "En uso por María" to someone who can't edit anyway is misleading — implies they could edit once María finishes.
- **D-15:** Standard lock behavior for users with overlapping edit permissions — first editor wins. If productor and LP both can edit Screen 4 and LP locks it first, productor sees "En uso por María (Line Producer)." Productor's force-break power (D-04) still applies.
- **D-16:** Two distinct messages for two distinct situations: (1) Locked screen (temporary, you could edit): "Esta sección está siendo editada por María (Line Producer). Puedes ver los datos pero no editarlos hasta que termine." (2) Role-restricted screen (permanent, you can't edit): "Solo lectura — contacta a [Productor Name] para editar." User understands: locked = wait, role = ask for access.
- **D-17:** Generated documents follow the same pattern. Role restriction hides the edit button entirely (Phase 11 D-05). Lock message appears only when the edit button would normally be visible but someone else has the lock.

### Claude's Discretion
- RTDB security rules for presence and lock paths
- Lock acquisition race condition handling (two users click edit at the same millisecond)
- onSnapshot listener management (subscribe/unsubscribe lifecycle, memory cleanup)
- Presence heartbeat interval for detecting idle/inactive tabs
- How auto-save interacts with lock release (save completes before lock drops)
- Avatar rendering component (photo loading, fallback initials, ring colors)
- Force-break lock Cloud Function implementation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication & roles
- `src/contexts/AuthContext.tsx` — Auth state, user object (uid, email, displayName, photoURL)
- `.planning/phases/11-rbac-access-control/11-CONTEXT.md` — D-02: permission matrix (who can edit which screens). D-04: read-only banner pattern. D-05: hidden buttons for unauthorized actions. D-11: `members` map on project document.

### Project data model
- `src/services/projects.ts` — Project CRUD, auto-save pattern
- `src/schemas/project.ts` — Project metadata schema
- `src/hooks/useAutoSave.ts` — Debounce + save pattern (lock must be held during save)

### Firebase setup
- `src/lib/firebase.ts` — Firebase client init (add RTDB import)
- `functions/src/index.ts` — Cloud Functions (add force-break lock function)

### UI components
- `src/components/layout/AppHeader.tsx` — Add presence avatar row
- Wizard sidebar — Add per-screen presence dots
- `src/locales/es.ts` — Lock messages, presence labels in Mexican Spanish

### Prior phase decisions
- `.planning/phases/01-scaffold-intake-wizard/01-CONTEXT.md` — D-01: free navigation, all screens accessible. D-03: auto-save with debounce.
- `.planning/phases/03-ai-doc-generation/03-CONTEXT.md` — D-05: read-only preview with "Editar" button (lockable unit for generated docs).
- `.planning/phases/10-authentication-identity/10-CONTEXT.md` — D-11: AuthProvider wraps app. D-13: session persistence.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/useAutoSave.ts` — Debounce + retry pattern. Extend to acquire/release locks around save operations.
- `src/contexts/AuthContext.tsx` — User object has `photoURL` and `displayName` for presence avatars.
- `src/locales/es.ts` — All new collaboration UI strings go here.
- `src/lib/firebase.ts` — Firebase client SDK already initialized. Add `getDatabase()` for RTDB.

### Established Patterns
- Zustand for client state, React Query for server state
- Auto-save with debounce to Firestore (Phase 1 D-03)
- `onCall` Cloud Functions with `HttpsError` for error handling
- Phase 11 `members` map provides team roster for presence display

### Integration Points
- Phase 11 permission matrix → determines whether to show lock message or role banner
- Phase 11 `members` map → provides team member names and roles for presence indicators
- Phase 1 auto-save → must acquire lock before saving, release after save completes
- Phase 3 document viewer "Editar" button → lock acquisition point for generated docs
- RTDB `presence/{projectId}/{userId}` → feeds header avatars and sidebar dots
- RTDB `locks/{projectId}/{screenId}` → feeds lock status checks before edit
- Phase 13 needs lock/unlock events for activity log attribution

</code_context>

<specifics>
## Specific Ideas

- The 2-minute disconnect timeout is the most critical implementation detail. Without it, a crashed browser holds a lock until someone force-breaks it. With it, the worst case is a 2-minute wait — annoying but not blocking. RTDB's `onDisconnect()` handler makes this reliable.
- The green/orange ring on avatars gives instant visual information without text. Green dots in the sidebar tell the productor "someone is reviewing the screenplay right now" without opening that screen.
- Lock isolation for the editing user (D-12) prevents a specific nightmare: LP is entering budget numbers, auto-save fires, but in the 500ms between debounce triggers, the productor's changes to project metadata update the Firestore snapshot and overwrite the LP's in-progress form state. Isolation prevents this.
- RTDB for presence/locks + Firestore for data is the Firebase-recommended architecture. Mixing them invites bugs. The hard line (D-09) prevents future scope creep.

</specifics>

<deferred>
## Deferred Ideas

- Field-level cursors showing where each user is typing — Google Docs-style, out of scope per REQUIREMENTS.md
- Conflict resolution UI for overlapping edits — not needed with section locking
- Notification when someone joins/leaves the project — v2.1 nice-to-have
- Lock queue (second editor automatically gets lock when first releases) — v2.1 if teams complain about lock contention

</deferred>

---

*Phase: 12-realtime-collaboration*
*Context gathered: 2026-03-25*
