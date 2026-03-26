---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Multi-User & Extended Modalities
status: unknown
stopped_at: Completed 14-01-PLAN.md
last_updated: "2026-03-26T21:54:37.387Z"
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 16
  completed_plans: 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Given a screenplay and project data, produce a complete, internally-consistent, EFICINE-compliant carpeta where every amount, title, date, and fee matches across all ~30 documents.
**Current focus:** Phase 14 — document-versioning

## Current Position

Phase: 14 (document-versioning) — EXECUTING
Plan: 3 of 4

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v2.0)
- Average duration: -
- Total execution time: 0 hours

**v1.0 reference:** 31 plans completed, ~7.5 min average, ~3.9 hours total

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 10 P01 | 4min | 2 tasks | 9 files |
| Phase 10 P02 | 8min | 2 tasks | 15 files |
| Phase 10 P03 | 4min | 3 tasks | 6 files |
| Phase 11-rbac-access-control P01 | 5min | 2 tasks | 8 files |
| Phase 11-rbac-access-control P03 | 6min | 2 tasks | 12 files |
| Phase 11-rbac-access-control P02 | 8min | 2 tasks | 11 files |
| Phase 12-realtime-collaboration P01 | 3min | 3 tasks | 11 files |
| Phase 12-realtime-collaboration P02 | 3min | 2 tasks | 6 files |
| Phase 12-realtime-collaboration P03 | 5min | 3 tasks | 6 files |
| Phase 13-activity-tracking P00 | 2min | 2 tasks | 3 files |
| Phase 13-activity-tracking P01 | 6min | 4 tasks | 11 files |
| Phase 13-activity-tracking PP02 | 4min | 2 tasks | 10 files |
| Phase 14-document-versioning PP00 | 4min | 2 tasks | 3 files |
| Phase 14-document-versioning P01 | 4min | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap v2.0]: Auth must be first phase — every v2.0 feature depends on user identity
- [Roadmap v2.0]: Data migration (AUTH-08, AUTH-09) lands in Phase 10 with auth setup — deploying security rules before migration locks out existing projects
- [Roadmap v2.0]: RBAC separated from base auth (Phase 11) to keep Phase 10 focused on "auth works at all"
- [Roadmap v2.0]: Collaboration split into core mechanics (Phase 12) and enhancements (Phase 13) — locking/presence first, activity log/invitations second
- [Roadmap v2.0]: Document versioning (Phase 14) and AI review (Phase 15) depend only on Phase 10, not on collaboration phases
- [Research]: CLAUDE.md line "Never add Firebase Auth" must be updated in Phase 10 to unblock auth-related development
- [Phase 10]: AuthProvider wraps BrowserRouter inside App.tsx, not in main.tsx -- keeps auth separate from QueryClient
- [Phase 10]: Logout clears Zustand store and React Query cache before Firebase signOut to prevent data leakage
- [Phase 10]: Auth state synced to Zustand appStore via useEffect for future cache isolation across user switches
- [Phase 10]: AuthContext org state added in Task 1 (not Task 2) to satisfy OrgSetupPage compile dependency
- [Phase 10]: Orchestrator uses legacy singleton fallback for pre-migration projects without orgId
- [Phase 10]: useValidation ERPI subscription updated to org-scoped path to maintain real-time validation consistency
- [Phase 10]: Shared requireAuth helper used across all 8 Cloud Functions to prevent auth check drift
- [Phase 10]: Storage rules use auth-gate only (no Firestore get() available) -- ownership enforced in Cloud Functions layer
- [Phase 10]: Dev bypass uses mock User object (not Firebase anonymous auth) to avoid affecting Firestore state
- [Phase 11-rbac-access-control]: Document-level roles map (collaborators field) instead of Firebase custom claims for per-project RBAC
- [Phase 11-rbac-access-control]: requireProjectAccess returns { role, projectData } for downstream permission checks in Cloud Functions
- [Phase 11-rbac-access-control]: Dual data structure: collaborators map for role lookup in rules + memberUIDs array for array-contains queries
- [Phase 11-rbac-access-control]: useProjectAccess hook syncs role to Zustand appStore for downstream component access without prop drilling
- [Phase 11-rbac-access-control]: Hidden-not-disabled pattern (D-05): unauthorized actions conditionally rendered, not shown as disabled
- [Phase 11-rbac-access-control]: Invitation acceptance uses Firestore runTransaction for atomic collaborator/memberUIDs update
- [Phase 11-rbac-access-control]: Email normalization (toLowerCase+trim) applied on both server and client for consistent invitation matching
- [Phase 12-realtime-collaboration]: onDisconnect queued before set() per Firebase Pitfall 1 to prevent orphaned RTDB presence entries
- [Phase 12-realtime-collaboration]: Server time offset (.info/serverTimeOffset) used in lock acquisition to handle client-server clock skew
- [Phase 12-realtime-collaboration]: Lock duration 2min, idle threshold 30s, lock timeout 60s -- matching plan spec and RTDB security rule expiry check
- [Phase 12-realtime-collaboration]: Used title attribute for avatar tooltip instead of external tooltip library
- [Phase 12-realtime-collaboration]: ForceBreakDialog uses shadcn Dialog (AlertDialog not available in project)
- [Phase 12-realtime-collaboration]: Collaboration UI components are pure props-based with no hook calls -- hooks wired in Plan 03
- [Phase 12-realtime-collaboration]: Lock acquired on edit intent (button click), not on page open -- prevents phantom locks
- [Phase 12-realtime-collaboration]: Auto-save flushAndWait before releaseLock ensures no pending data is lost when edit mode ends
- [Phase 12-realtime-collaboration]: Role restriction takes visual priority over lock banner per D-14
- [Phase 12-realtime-collaboration]: Sign-out RTDB cleanup is best-effort: 2-minute onDisconnect timeout handles failures
- [Phase 13-activity-tracking]: Wave 0 test stubs import from non-existent production modules for import-level RED state
- [Phase 13-activity-tracking]: Firebase trigger tests use vi.mock + dynamic import pattern for proper mock isolation
- [Phase 13-activity-tracking]: Client-side field diff using JSON.stringify per-key in useAutoSave for activity logging
- [Phase 13-activity-tracking]: useRef for user/role in doSave avoids stale closures without adding to useCallback deps
- [Phase 13-activity-tracking]: Badge count computed inside WizardSidebar via useActivityBadge, not lifted to WizardShell
- [Phase 13-activity-tracking]: Email send failure tracked on invitation document (emailSent/emailError) but does not throw -- invitation remains valid for in-app acceptance
- [Phase 13-activity-tracking]: InvitationPage uses standalone route outside ProtectedRoute with sessionStorage return URL for post-auth redirect
- [Phase 14-document-versioning]: diff v4.0.4 already available as transitive dep -- Wave 0 diffCompute tests run as GREEN, not import-error RED stubs
- [Phase 14-document-versioning]: diffWords tokenizes monetary amounts at comma boundaries -- test assertions check digit groups, not full formatted amounts
- [Phase 14-document-versioning]: triggeredBy and triggerReason added as optional trailing parameters to preserve backward compatibility
- [Phase 14-document-versioning]: Version prune threshold >= 10 (not > 10) to maintain exactly 10 max versions per D-04

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Auth migration is all-or-nothing deployment — needs Firebase Emulator E2E testing before production
- [Research]: ERPI singleton migration (AUTH-09) affects both frontend service and Cloud Functions orchestrator
- [Research]: CLAUDE.md "Never add Firebase Auth" directive will cause AI refusal if not updated early in Phase 10

## Session Continuity

Last session: 2026-03-26T21:54:37.384Z
Stopped at: Completed 14-01-PLAN.md
Resume file: None
