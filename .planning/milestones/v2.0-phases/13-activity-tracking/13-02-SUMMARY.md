---
phase: 13-activity-tracking
plan: 02
subsystem: email, ui
tags: [resend, firebase-triggers, invitation-flow, deep-link, email-delivery]

# Dependency graph
requires:
  - phase: 11-rbac-access-control
    provides: invitation Cloud Functions (inviteToProject, acceptInvitation, declineInvitation), services/invitations.ts, invitation document schema
  - phase: 10-authentication
    provides: AuthContext (useAuth), LoginPage, ProtectedRoute, Firebase Auth
provides:
  - Resend email delivery on invitation creation via onDocumentCreated trigger
  - HTML email template with Spanish content and inline styles
  - InvitationPage with 6 states (loading, sign-in, valid, mismatch, expired, not-found, already-accepted)
  - /invitaciones/:invitationId route outside ProtectedRoute
  - Return URL pattern for post-auth redirect back to invitation
  - Complete invitation locale strings (30+ keys)
affects: [13-activity-tracking, deployment]

# Tech tracking
tech-stack:
  added: [resend@6.9.4]
  patterns: [onDocumentCreated trigger for async email, sessionStorage return URL pattern, standalone page outside ProtectedRoute]

key-files:
  created:
    - functions/src/email/templates.ts
    - functions/src/email/sendInvitationEmail.ts
    - functions/src/triggers/onInvitationCreated.ts
    - src/pages/InvitationPage.tsx
  modified:
    - functions/package.json
    - functions/src/index.ts
    - src/App.tsx
    - src/components/auth/LoginPage.tsx
    - src/locales/es.ts

key-decisions:
  - "userEmail captured before async closure to satisfy TypeScript strict null checks in effect cleanup"
  - "Email send failure tracked on invitation document (emailSent/emailError) but does not throw -- invitation remains valid for in-app acceptance"

patterns-established:
  - "onDocumentCreated trigger pattern: async side-effect (email) decoupled from callable function"
  - "Standalone page outside ProtectedRoute: InvitationPage handles own auth state internally"
  - "Return URL via sessionStorage: carpetify_return_url key for post-auth redirect"

requirements-completed: [COLLAB-06]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 13 Plan 02: Invitation Email Flow Summary

**Resend email delivery via onDocumentCreated trigger + InvitationPage deep link with 6 states and return URL pattern**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T17:59:14Z
- **Completed:** 2026-03-26T18:03:38Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Complete email delivery pipeline: invitation creation triggers Resend email with Spanish HTML template and "Ver invitacion" deep link
- InvitationPage handles all edge cases: not signed in, valid invitation, email mismatch, expired, not found, already accepted
- Return URL pattern ensures invitees land back on their invitation after signing in
- Decline uses confirmation Dialog to prevent accidental rejection

## Task Commits

Each task was committed atomically:

1. **Task 1: Resend integration and email trigger Cloud Function** - `797699c7` (feat)
2. **Task 2: InvitationPage, routing, return URL, and invitation locale strings** - `233bf941` (feat)

## Files Created/Modified
- `functions/src/email/templates.ts` - HTML email template with inline styles, Spanish content, #171717 CTA button
- `functions/src/email/sendInvitationEmail.ts` - Resend API wrapper returning sent/error status
- `functions/src/triggers/onInvitationCreated.ts` - Firestore onDocumentCreated trigger that sends email and tracks status
- `functions/src/index.ts` - Added onInvitationCreated export
- `functions/package.json` - Added resend@6.9.4 dependency
- `src/pages/InvitationPage.tsx` - Deep link page with 6 states, decline Dialog, accept/decline handlers
- `src/App.tsx` - Added /invitaciones/:invitationId route outside ProtectedRoute, removed old placeholder
- `src/components/auth/LoginPage.tsx` - Added sessionStorage return URL check after sign-in
- `src/locales/es.ts` - Added complete invitation section (30+ keys)

## Decisions Made
- Captured `user.email` into a local variable before the async closure in InvitationPage's useEffect to satisfy TypeScript strict null narrowing -- avoids the "possibly null" error without type assertions
- Email send failure is tracked on the invitation document (emailSent/emailError fields) but does NOT throw or block -- the invitation document remains valid and invitees can still accept via the in-app pending invitations list

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict null check in InvitationPage async closure**
- **Found during:** Task 2 (InvitationPage implementation)
- **Issue:** `user.email` inside async function lost TypeScript null narrowing from the outer scope guard (`if (!user) return`), causing TS18047 "possibly null" error
- **Fix:** Captured `user.email?.toLowerCase().trim() ?? ''` into `userEmail` const before the async function definition
- **Files modified:** src/pages/InvitationPage.tsx
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** 233bf941 (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor TypeScript strictness fix. No scope creep.

## Issues Encountered
- Pre-existing build error in `src/hooks/useProjectAccess.ts` (TS2739: missing properties `collaborators, ownerId`) -- this is NOT from plan 13-02 changes. `npm run build` fails on this file but `npx tsc --noEmit` passes. Already tracked as deferred from prior phases.

## User Setup Required

**External services require manual configuration** before invitation emails will send:

1. **Create Resend account** at https://resend.com/signup
2. **Generate API key** in Resend Dashboard > API Keys
3. **Add to Firebase Secret Manager:**
   ```bash
   firebase functions:secrets:set RESEND_API_KEY
   ```
4. **Verify sending domain (production only):** Resend Dashboard > Domains > Add Domain > Add DNS records (SPF/DKIM) for `lemon-studios.mx`
5. **Development:** Emails will fail gracefully without API key -- invitations still work via in-app pending list

## Known Stubs

None -- all functionality is fully wired. Email sending depends on RESEND_API_KEY being configured in Firebase Secret Manager (documented in User Setup above), but the code path handles missing/invalid API keys gracefully by logging errors and setting `emailSent: false` on the invitation document.

## Next Phase Readiness
- Invitation email flow is complete end-to-end
- Plan 03 (Activity Tab UI) can proceed -- no dependencies on this plan
- Deployment requires RESEND_API_KEY in Firebase Secret Manager

## Self-Check: PASSED

All 5 created files verified on disk. Both commit hashes (797699c7, 233bf941) found in git log.

---
*Phase: 13-activity-tracking*
*Completed: 2026-03-26*
