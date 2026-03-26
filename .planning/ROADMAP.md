# Roadmap: Carpetify

## Milestones

- ✅ **v1.0 EFICINE Carpeta Generator** — Phases 1-9 (shipped 2026-03-25)
- 🚧 **v2.0 Multi-User & Extended Modalities** — Phases 10-15 (in progress)

## Phases

<details>
<summary>✅ v1.0 EFICINE Carpeta Generator (Phases 1-9) — SHIPPED 2026-03-25</summary>

- [x] Phase 1: Scaffold + Intake Wizard (4/4 plans) — completed 2026-03-22
- [x] Phase 2: Screenplay Processing (2/2 plans) — completed 2026-03-23
- [x] Phase 3: AI Document Generation Pipeline (6/6 plans) — completed 2026-03-24
- [x] Phase 4: Validation Engine + Dashboard (8/8 plans) — completed 2026-03-24
- [x] Phase 5: Export Manager (3/3 plans) — completed 2026-03-24
- [x] Phase 6: Validation Data Wiring Fix (3/3 plans) — completed 2026-03-25
- [x] Phase 7: Document Completeness & Export Gate Fix (2/2 plans) — completed 2026-03-25
- [x] Phase 8: Score Estimation & Accuracy Fix (2/2 plans) — completed 2026-03-25
- [x] Phase 9: Validation Stub Completion (1/1 plan) — completed 2026-03-25

**Full details:** [milestones/v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

</details>

### 🚧 v2.0 Multi-User & Extended Modalities (In Progress)

**Milestone Goal:** Transform Carpetify from a single-user tool into a collaborative platform with multi-user auth, role-based access, real-time collaboration, document versioning, and AI pre-submission review.

- [x] **Phase 10: Authentication & Identity** - Firebase Auth with Google sign-in, session persistence, route protection, Cloud Function auth validation, and v1.0 data migration (completed 2026-03-26)
- [x] **Phase 11: RBAC & Project Access Control** - Role-based permissions, project invitations, and Firestore security rules enforcement (completed 2026-03-26)
- [ ] **Phase 12: Real-Time Collaboration** - Simultaneous project editing with section-level locking, presence indicators, role-based screen access, and conflict notification
- [ ] **Phase 13: Activity Tracking & Invitation Flow** - Field-level change attribution log and email-based project invitation with accept/decline
- [ ] **Phase 14: Document Versioning** - Version history for generated documents with inline diff comparison and one-click revert
- [ ] **Phase 15: AI Pre-Submission Review** - IMCINE evaluator simulation producing per-section scores, improvement suggestions, and readiness assessment

## Phase Details

### Phase 10: Authentication & Identity
**Goal**: Users can securely sign in and the app knows who they are, with all existing v1.0 data preserved under proper ownership
**Depends on**: Nothing (first phase of v2.0, builds on v1.0 shipped codebase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-07, AUTH-08, AUTH-09
**Success Criteria** (what must be TRUE):
  1. User can sign in with their Google account and see the project dashboard
  2. Closing and reopening the browser restores the authenticated session and last-viewed project
  3. Visiting any app URL while signed out redirects to the sign-in page with no flash of app content
  4. All 7 existing Cloud Functions reject calls from unauthenticated clients with a clear error
  5. Existing v1.0 projects appear in the dashboard after migration, owned by the first user who signs in
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — Firebase Auth init, AuthContext, LoginPage, ProtectedRoute, CLAUDE.md update
- [x] 10-02-PLAN.md — Organization creation, v1.0 data migration, service layer updates (projects + ERPI)
- [x] 10-03-PLAN.md — Cloud Functions auth enforcement, Firestore/Storage security rules, E2E verification

### Phase 11: RBAC & Project Access Control
**Goal**: Project owners can invite team members with specific roles, and Firestore enforces that users only access projects they belong to
**Depends on**: Phase 10
**Requirements**: AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Project owner can assign one of 4 roles (productor, line_producer, abogado, director) when inviting a team member
  2. Users see only projects they own or have been invited to on the dashboard — no access to other projects
  3. Directly navigating to a project URL the user has no access to shows an "access denied" message rather than loading project data
**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md — Permissions model, data migration (collaborators/memberUIDs), Firestore security rules rewrite, Cloud Function membership guard
- [x] 11-02-PLAN.md — Invitation Cloud Functions (invite/accept/decline/revoke), client invitation service, team management UI
- [x] 11-03-PLAN.md — Access control UX: useProjectAccess hook, AccessDenied page, WizardShell role gating, read-only banners, dashboard role badges

### Phase 12: Real-Time Collaboration
**Goal**: Multiple team members can work on the same project simultaneously with clear visibility into who is editing what
**Depends on**: Phase 11
**Requirements**: COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-05, COLLAB-07
**Success Criteria** (what must be TRUE):
  1. Two users viewing the same project see each other's changes appear in real-time without manual refresh
  2. When one user is editing a wizard screen, other users see that screen marked as locked with the editor's name displayed
  3. Avatar indicators show which team members are currently in the project and which screen each is viewing
  4. A line_producer can edit the financial structure screen but cannot edit the creative team screen; an abogado can edit contracts but not financials
  5. A user attempting to edit a section already being edited by someone else sees an "en uso por [nombre]" conflict message
**Plans**: TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD
- [ ] 12-03: TBD

### Phase 13: Activity Tracking & Invitation Flow
**Goal**: Team members can trace who changed what and when, and new collaborators join projects through a proper invitation flow
**Depends on**: Phase 12
**Requirements**: COLLAB-04, COLLAB-06
**Success Criteria** (what must be TRUE):
  1. An activity log shows timestamped entries of which user changed which field, viewable by any project member
  2. Inviting a team member sends an email with a link that, when clicked, adds them to the project with the assigned role
  3. An invited user can accept or decline the invitation from the link, and declining does not grant project access
**Plans**: TBD

Plans:
- [ ] 13-01: TBD
- [ ] 13-02: TBD

### Phase 14: Document Versioning
**Goal**: Users can track how generated documents evolve over time and recover previous versions
**Depends on**: Phase 10 (needs user identity for version attribution)
**Requirements**: AIGEN-V2-03, AIGEN-V2-04, AIGEN-V2-05
**Success Criteria** (what must be TRUE):
  1. Each time a document is regenerated, the previous version is preserved with timestamp, trigger reason, and who triggered it
  2. User can select any two versions of a document and see an inline diff with additions highlighted in green and deletions in red
  3. User can revert to any previous version with one click, and the reverted content becomes the current active version
**Plans**: TBD

Plans:
- [ ] 14-01: TBD
- [ ] 14-02: TBD

### Phase 15: AI Pre-Submission Review
**Goal**: Users get an AI-powered assessment of their complete carpeta from the perspective of IMCINE evaluators before submitting
**Depends on**: Phase 10 (needs authenticated Cloud Function calls)
**Requirements**: AIGEN-V2-01, AIGEN-V2-02
**Success Criteria** (what must be TRUE):
  1. User can trigger a pre-submission review from the validation dashboard and see progress while it runs
  2. Review results show per-section scores, specific improvement suggestions in Spanish, and an overall readiness assessment
  3. Review results appear alongside the existing score estimation on the validation dashboard, giving users both deterministic and AI-assessed views
**Plans**: TBD

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15
Note: Phases 14 and 15 depend only on Phase 10 (not on 12/13), so they could theoretically parallelize with 12/13. However, sequential execution is simpler for a solo developer.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Scaffold + Intake Wizard | v1.0 | 4/4 | Complete | 2026-03-22 |
| 2. Screenplay Processing | v1.0 | 2/2 | Complete | 2026-03-23 |
| 3. AI Document Generation Pipeline | v1.0 | 6/6 | Complete | 2026-03-24 |
| 4. Validation Engine + Dashboard | v1.0 | 8/8 | Complete | 2026-03-24 |
| 5. Export Manager | v1.0 | 3/3 | Complete | 2026-03-24 |
| 6. Validation Data Wiring Fix | v1.0 | 3/3 | Complete | 2026-03-25 |
| 7. Document Completeness & Export Gate Fix | v1.0 | 2/2 | Complete | 2026-03-25 |
| 8. Score Estimation & Accuracy Fix | v1.0 | 2/2 | Complete | 2026-03-25 |
| 9. Validation Stub Completion | v1.0 | 1/1 | Complete | 2026-03-25 |
| 10. Authentication & Identity | v2.0 | 3/3 | Complete    | 2026-03-26 |
| 11. RBAC & Project Access Control | v2.0 | 3/3 | Complete    | 2026-03-26 |
| 12. Real-Time Collaboration | v2.0 | 0/? | Not started | - |
| 13. Activity Tracking & Invitation Flow | v2.0 | 0/? | Not started | - |
| 14. Document Versioning | v2.0 | 0/? | Not started | - |
| 15. AI Pre-Submission Review | v2.0 | 0/? | Not started | - |
