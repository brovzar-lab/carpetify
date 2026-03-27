# Phase 13: Activity Tracking & Invitation Flow - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Field-level activity log tracking who changed what and when, plus implementation of the invitation email flow designed in Phase 11. Activity log covers data saves, significant actions (generation, export, team changes), and dismissed validation warnings. Invitation flow implements Phase 11 decisions D-06 through D-10 (Resend email, accept/decline, email matching, 7-day expiry). Phase 12 provides real-time sync and locking. Phase 14 adds document versioning with full diffs.

</domain>

<decisions>
## Implementation Decisions

### What Gets Logged
- **D-01:** Log per-save, not per-field. One activity entry per auto-save with a list of changed field names (e.g., "María actualizó Estructura financiera: costo_total, aportantes, monto_eficine"). Not one entry per field — auto-save fires on every debounce and per-field logging creates noise.
- **D-02:** Log significant actions only, not routine navigation. Logged events:
  - Data saves (per-save with changed field names)
  - Document generation triggered (who, which pass, outcome, duration)
  - Export triggered (who)
  - Document manually edited (who, which doc)
  - Screenplay uploaded/re-uploaded (who)
  - Team member invited/accepted/removed (who did what to whom)
  - Role changed (who changed whose role)
  - Project created/cloned/deleted (who)
  - Validation warning dismissed at export time (who, which warning, full text)
  - NOT logged: screen views, dashboard opens, login/logout, validation runs
- **D-03:** AI generation logged as one event per pass with outcome: "Leo triggered Pasada 2 (Line Producer) — 4 documentos generados en 45s." Not one event per document within the pass. Failed generation logged with error: "María triggered Pasada 3 (Finanzas) — error: timeout."
- **D-04:** Validation runs NOT logged (they run constantly in real time, would flood the log). Exception: dismissed validation warnings at export time are logged with the specific warning text: "Carlos descartó advertencia: 'catering' es término técnico aceptado."

### Log Presentation
- **D-05:** Dedicated "Actividad" tab in the project view, alongside wizard screens and validation dashboard. Full-width, not sidebar. Badge count of new entries since last viewed: "Actividad (7)".
- **D-06:** `lastViewedActivity` timestamp stored per-user on the `userProjects/{userId}/projects/{projectId}` denormalized doc (NOT as a map on the project doc). Badge count = events with timestamp > lastViewedActivity.
- **D-07:** Chronological feed, newest first, grouped by day. Day headers: "Hoy", "Ayer", "20 de marzo de 2026". Each entry shows: avatar + name + role, action description in Spanish, timestamp (relative for today: "hace 2 horas", absolute for older: "14:30"). Flat feed, no nesting or tree structure.
- **D-08:** Pill toggle filters above the feed for two dimensions: team member ("Todos | María | Carlos | Leo") and event type ("Todos | Ediciones | Generación | Equipo | Exportación"). No dropdown menus.
- **D-09:** Load last 7 days initially. "Cargar más" button loads previous 7-day increments. If no recent activity: "Sin actividad reciente."

### Data Model & Retention
- **D-10:** Activity events stored in subcollection: `projects/{projectId}/activity/{eventId}`. Each event document: `userId`, `userName`, `userRole`, `type` (edit/generation/team/export), `description` (Spanish), `changedFields` (array, for edit events), `timestamp`, `metadata` (pass number, doc ID, invited email, etc.).
- **D-11:** ~~Cloud Functions write activity events, not the client.~~ **OVERRIDDEN (2026-03-26):** Client-side activity logging. The client writes activity entries directly after auto-save, since it has auth context (user identity), both old and new field values for diffing, and avoids Cloud Function cold-start latency. Server-side actions (generation, export) still log from their respective Cloud Functions. Rationale: RESEARCH.md analysis showed client-side approach is simpler, cheaper, and the client already has all necessary context.
- **D-12:** No auto-purge. Activity persists for the lifetime of the project, deleted only when the project itself is deleted or archived. Rationale: events are <1KB each, a full submission cycle is ~300 events (~300KB), storage cost is negligible. EFICINE allows resubmission of shortlisted-but-unfunded projects in subsequent periods — producers need project history when picking up a dormant project months later.
- **D-13:** Each event document under 1KB. Store changed field names, not values (old/new). "María actualizó costo_total, aportantes" not "María changed costo_total from $12,000,000 to $13,000,000." Field values are in Firestore already — the activity log is an index of what happened, not a full diff. Full diffs belong in Phase 14 (Document Versioning).

### Invitation Flow (implementing Phase 11 decisions)
- **D-14:** This phase implements the invitation flow designed in Phase 11 (D-06 through D-10): in-app email invitation via Resend, accept/decline UI, email matching safeguard, 7-day expiration, resend/revoke from project settings. No new design decisions — Phase 11 locked these.

### Claude's Discretion
- Resend API integration (API key in Secret Manager, email template, sender domain)
- Invitation deep link URL structure with invitation ID
- How auto-save Cloud Functions receive and log changed field names (diff detection)
- Activity event description generation (Spanish text templates)
- Badge count query efficiency (composite index on projectId + timestamp)
- "Cargar más" pagination cursor implementation
- Invitation acceptance Cloud Function (batch write: update invitation status + add to members map + create userProjects entry)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Invitation flow design
- `.planning/phases/11-rbac-access-control/11-CONTEXT.md` — D-06 through D-10: complete invitation flow design (email via Resend, accept/decline, email matching, 7-day expiry, resend/revoke). Phase 13 implements these decisions.

### Authentication & roles
- `src/contexts/AuthContext.tsx` — User object (uid, email, displayName, photoURL) for activity entries
- `.planning/phases/11-rbac-access-control/11-CONTEXT.md` — D-11: `members` map provides team roster. D-13: `userProjects` denormalized index (add `lastViewedActivity` here).

### Cloud Functions
- `functions/src/index.ts` — All callable functions need activity event writes added inside their execution flow

### Real-time collaboration
- `.planning/phases/12-realtime-collaboration/12-CONTEXT.md` — D-10: Firestore onSnapshot for real-time updates (activity tab auto-updates when new events arrive). D-01: lock events can trigger activity entries.

### Auto-save
- `src/hooks/useAutoSave.ts` — Debounce pattern. Cloud Function receiving the save needs to detect which fields changed and write the activity event.

### Language policy
- `directives/politica_idioma.md` — All activity descriptions, invitation emails, filter labels in Mexican Spanish

### Prior phase decisions
- `.planning/phases/01-scaffold-intake-wizard/01-CONTEXT.md` — D-03: auto-save with debounce (activity event per save, not per keystroke)
- `.planning/phases/03-ai-doc-generation/03-CONTEXT.md` — D-01: pipeline trigger events. D-03: mid-pipeline failure events.
- `.planning/phases/05-export-manager/05-CONTEXT.md` — D-07: dismissed validation warnings at export (logged in activity).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/locales/es.ts` — All new UI strings (activity descriptions, filter labels, invitation email text)
- `src/contexts/AuthContext.tsx` — User object has displayName, photoURL, uid for activity entries
- Cloud Function `onCall` pattern with `HttpsError` — extend for invitation and activity functions
- Phase 11 `members` map — provides team member names and roles for filter pills

### Established Patterns
- Zustand for client state, React Query for server state
- Cloud Functions use `onCall` with batch writes (`writeBatch()`)
- All UI strings from `src/locales/es.ts`
- Firestore subcollections for per-project data

### Integration Points
- Auto-save Cloud Functions → add activity write inside same invocation
- Generation Cloud Functions → add per-pass activity write with outcome
- Export Cloud Function → add export event + dismissed warning events
- Phase 11 invitation Cloud Functions → add team change events (invited, accepted, removed, role changed)
- Phase 12 `onSnapshot` → activity tab auto-refreshes when new events arrive
- `userProjects/{userId}/projects/{projectId}` → add `lastViewedActivity` timestamp for badge count
- Phase 14 needs activity events for version attribution ("who triggered this regeneration")

</code_context>

<specifics>
## Specific Ideas

- The activity log is the productor's "what happened while I was asleep" tool. During EFICINE crunch (2-3 weeks before submission), the LP and abogado might be working in the evening while the productor is offline. Next morning, the productor opens the Actividad tab, sees 15 entries, filters to "Generación" — "ah, María ran the pipeline last night and the legal pass failed. I'll follow up."
- Per-save logging with field names (not values) is the sweet spot. The productor sees "María actualizó costo_total, aportantes" and knows the budget changed — if they want to see the actual numbers, they open Screen 4. The log tells them WHAT happened, the data tells them the details.
- The 7-day activity window as default load is calibrated to the team's work rhythm. Nobody scrolls back 3 months in an activity log. But the data persists forever because EFICINE resubmissions happen.

</specifics>

<deferred>
## Deferred Ideas

- Push notifications (email/Slack) when specific events occur (generation complete, export ready) — v2.1
- Activity log export as PDF for internal reporting — v2.1
- @mentions in activity comments — v2.1 (requires comment system, which is out of scope)
- Aggregated activity summary email (daily digest) — v2.1

</deferred>

---

*Phase: 13-activity-tracking*
*Context gathered: 2026-03-25*
