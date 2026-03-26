# Requirements: Carpetify v2.0

**Defined:** 2026-03-25
**Core Value:** Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents.

## v2.0 Requirements

### Authentication & Authorization

- [x] **AUTH-01**: User can sign in with Google (Lemon Studios domain) via Firebase Auth
- [x] **AUTH-02**: User session persists across browser refresh and restores project context
- [x] **AUTH-03**: Unauthenticated users are redirected to sign-in page — no app content accessible without login
- [x] **AUTH-04**: Custom claims RBAC with 4 roles: productor (owner), line_producer, abogado, director — each with defined permission set
- [x] **AUTH-05**: Project owner (productor) can invite team members by email and assign roles
- [x] **AUTH-06**: Firestore security rules enforce per-project access — users can only read/write projects they own or are invited to
- [x] **AUTH-07**: All Cloud Functions validate caller authentication and project membership before executing
- [x] **AUTH-08**: Existing v1.0 projects are migrated with ownerId field assigned to the first authenticated user
- [x] **AUTH-09**: ERPI settings migrated from global singleton to per-organization path with user ownership

### Collaboration

- [x] **COLLAB-01**: Multiple team members can view and edit the same project simultaneously
- [x] **COLLAB-02**: Section-level locking — when a user is editing a wizard screen, other users see it as locked with the editor's name
- [x] **COLLAB-03**: Real-time presence indicators show which team members are currently viewing the project and which screen they're on
- [ ] **COLLAB-04**: Activity log tracks who changed what and when (field-level change attribution)
- [ ] **COLLAB-05**: Role-based screen access — line_producer can edit financials and budget, abogado can edit contracts, director can edit creative team and screenplay analysis
- [ ] **COLLAB-06**: Project invitation flow with email notification and accept/decline via link
- [x] **COLLAB-07**: Conflict notification when two users attempt to edit the same section — second user sees "en uso por [nombre]" message

### AI Enhancement

- [ ] **AIGEN-V2-01**: AI pre-submission review simulating 3 IMCINE evaluator personas reviewing the complete carpeta — produces per-section scores, specific improvement suggestions, and an overall readiness assessment
- [ ] **AIGEN-V2-02**: User can trigger pre-submission review from the validation dashboard and see results alongside existing score estimation
- [ ] **AIGEN-V2-03**: Document version history — each regeneration creates a version entry with timestamp, trigger reason, and content snapshot
- [ ] **AIGEN-V2-04**: User can compare any two versions of a generated document with inline diff highlighting (additions in green, deletions in red)
- [ ] **AIGEN-V2-05**: User can revert to a previous document version with one click

## v2.1+ Requirements (Deferred)

### Co-Production Engine

- **COPROD-01**: Full international co-production rules engine (territorial budget split, exchange rates, IMCINE recognition)
- **COPROD-02**: Multi-currency support with exchange rate tracking via Banxico SIE API

### Extended Modalities

- **MODAL-01**: EFICINE Postproduccion modality — different document requirements, different scoring rubric (65 pts filmed material vs 40 pts screenplay), different FORMATO structures
- **MODAL-02**: Previously-authorized project resubmission modality — updated documentation for re-approval

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email/password authentication | Google-only simplifies onboarding for Lemon Studios team |
| CRDTs / real-time co-editing | Overkill for 4-person team editing form fields — section locking is sufficient |
| Mobile responsive UI | 30-document dossier requires desktop screen |
| SaaS multi-tenancy | Internal tool for one studio, not a product |
| Direct SHCP portal integration | No API; scraping tax portal is legally risky |
| AI-powered document editing | AI generates documents; humans edit — no AI rewriting of user edits |
| Offline mode | Real-time collaboration requires connectivity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 10 | Complete |
| AUTH-02 | Phase 10 | Complete |
| AUTH-03 | Phase 10 | Complete |
| AUTH-04 | Phase 11 | Complete |
| AUTH-05 | Phase 11 | Complete |
| AUTH-06 | Phase 11 | Complete |
| AUTH-07 | Phase 10 | Complete |
| AUTH-08 | Phase 10 | Complete |
| AUTH-09 | Phase 10 | Complete |
| COLLAB-01 | Phase 12 | Complete |
| COLLAB-02 | Phase 12 | Complete |
| COLLAB-03 | Phase 12 | Complete |
| COLLAB-04 | Phase 13 | Pending |
| COLLAB-05 | Phase 12 | Pending |
| COLLAB-06 | Phase 13 | Pending |
| COLLAB-07 | Phase 12 | Complete |
| AIGEN-V2-01 | Phase 15 | Pending |
| AIGEN-V2-02 | Phase 15 | Pending |
| AIGEN-V2-03 | Phase 14 | Pending |
| AIGEN-V2-04 | Phase 14 | Pending |
| AIGEN-V2-05 | Phase 14 | Pending |

**Coverage:**
- v2.0 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation*
