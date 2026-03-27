---
phase: 13-activity-tracking
verified: 2026-03-26T18:30:00Z
status: passed
score: 3/3 must-haves verified
re_verification: false
---

# Phase 13: Activity Tracking & Invitation Flow Verification Report

**Phase Goal:** Team members can trace who changed what and when, and new collaborators join projects through a proper invitation flow
**Verified:** 2026-03-26T18:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An activity log shows timestamped entries of which user changed which field, viewable by any project member | VERIFIED | `useAutoSave` computes field diffs after every successful save and calls `coalesceOrCreate` fire-and-forget; `useActivityLog` subscribes via `onSnapshot`; `ActivityTab` renders day-grouped feed with filters and badge count; wired into `WizardShell` on the `actividad` case; `WizardSidebar` shows live badge via `useActivityBadge` |
| 2 | Inviting a team member sends an email with a link that, when clicked, adds them to the project with the assigned role | VERIFIED | `inviteToProject` Cloud Function creates invitation document; `onInvitationCreated` Firestore trigger calls Resend via `sendInvitationEmail`; email contains `/invitaciones/:invitationId` deep link; `InvitationPage` calls `acceptInvitation` Cloud Function; `handleAcceptInvitation` atomically updates `collaborators` + `memberUIDs` in a Firestore transaction |
| 3 | An invited user can accept or decline the invitation from the link, and declining does not grant project access | VERIFIED | `InvitationPage` renders decline button behind a confirmation Dialog; `handleDecline` calls `declineInvitation` Cloud Function; `handleDeclineInvitation` sets `status: 'declined'` and writes to `security_events` — no write to `collaborators` or `memberUIDs`; after decline, user is navigated to `/` (dashboard), not to project |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/services/activityLog.ts` | Activity log data service with types, field labels, `buildChangeSummary`, `writeActivityEntry`, `coalesceOrCreate` | VERIFIED | 205 lines; all exports present; 21 `FIELD_LABELS`, 6 `SCREEN_LABELS`, 30s coalescing window, fire-and-forget error handling |
| `src/hooks/useActivityLog.ts` | Real-time subscription with pagination | VERIFIED | `onSnapshot` subscription + `startAfter` cursor-based `loadMore`; maps Firestore docs to `ActivityLogEntry` |
| `src/components/collaboration/ActivityEntry.tsx` | Single entry row with avatar, role badge, icon, summary, timestamp | VERIFIED | Renders avatar (photo or initials), role badge, action icon, summary text, field names list for update actions, relative/absolute timestamp |
| `src/components/collaboration/ActivityFilters.tsx` | Pill toggle filters for team member and event type | VERIFIED | Two `role="radiogroup"` rows; member filter and 5 event-type filters; uses `es.activity.*` locale strings |
| `src/components/collaboration/ActivityTab.tsx` | Full activity tab with day-grouped feed, filtering, pagination, badge management | VERIFIED | Day grouping via `startOfDay` + Map; `isToday/isYesterday` headers; filter application; `loadMore` button; writes `lastViewedActivity` on mount; loading/empty states |
| `src/hooks/useAutoSave.ts` (modified) | Field diff computation and fire-and-forget activity log write after save | VERIFIED | `lastSavedRef` tracks previous data; `Object.keys` diff after successful save; calls `coalesceOrCreate` via `.catch()` wrapper; user/role captured via `useRef` to avoid stale closures |
| `src/components/wizard/WizardSidebar.tsx` (modified) | `Actividad` link with live badge count | VERIFIED | `useActivityBadge` hook computes unseen count; badge rendered with `Badge` component when `badgeCount > 0`; link navigates to `/project/:projectId/actividad` |
| `src/components/wizard/WizardShell.tsx` (modified) | `actividad` case in `renderScreen` and `isFullWidth` | VERIFIED | Line 178: `case 'actividad': return <ActivityTab projectId={projectId} />`; line 239: `actividad` included in `isFullWidth` set |
| `src/stores/wizardStore.ts` (modified) | `'actividad'` added to `WizardScreen` union | VERIFIED | Line 12: `\| 'actividad'` present in `WizardScreen` type |
| `firestore.indexes.json` (modified) | 3 composite indexes for `activity_log` subcollection | VERIFIED | Indexes for (userId, createdAt), (createdAt), and (userId, screen, createdAt) all present |
| `functions/src/email/templates.ts` | HTML email with inline styles, Spanish content, `#171717` CTA | VERIFIED | `<!DOCTYPE html>` with `lang="es"`, `#171717` background on CTA, Spanish text, Intl date format with `es-MX` locale, `buildInvitationEmailHtml` export |
| `functions/src/email/sendInvitationEmail.ts` | Resend API wrapper | VERIFIED | Instantiates `Resend` with API key, constructs `acceptUrl` as `${appUrl}/invitaciones/${invitationId}`, calls `resend.emails.send`, returns `{sent, error}` |
| `functions/src/triggers/onInvitationCreated.ts` | Firestore `onDocumentCreated` trigger for `invitations/{invitationId}` | VERIFIED | Checks `data.status !== 'pending'` early return; calls `sendInvitationEmail`; updates `emailSent/emailError` on invitation document; does NOT throw on email failure |
| `functions/src/index.ts` (modified) | `onInvitationCreated` export | VERIFIED | Line 21: imports trigger; line 556: `export const onInvitationCreated = onInvitationCreatedTrigger` |
| `src/pages/InvitationPage.tsx` | Deep link page with 6 states (loading, sign-in, valid, mismatch, expired, not-found, already-accepted), decline Dialog, return URL | VERIFIED | All 6 states rendered; decline confirmation Dialog with `showCloseButton={false}`; `sessionStorage.setItem('carpetify_return_url', ...)` on unauthenticated load; `acceptInvitation` / `declineInvitation` service calls wired |
| `src/App.tsx` (modified) | `/invitaciones/:invitationId` route outside `ProtectedRoute` | VERIFIED | Line 44: `<Route path="/invitaciones/:invitationId" element={<InvitationPage />} />` placed before the `ProtectedRoute` wrapper |
| `src/components/auth/LoginPage.tsx` (modified) | `sessionStorage` return URL check after sign-in | VERIFIED | `carpetify_return_url` retrieved and cleared after successful sign-in; navigates to stored URL or `/` |
| `src/locales/es.ts` (modified) | `activity` section (25+ keys) and `invitation` section (30+ keys) | VERIFIED | `activity:` section lines 818–862 with all filter labels, day headers, action templates; `invitation:` section lines 865–896 with all 6 states and all CTA strings |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useAutoSave.ts` | `activityLog.coalesceOrCreate` | `import` + call after successful `setDoc` | WIRED | Line 5: `import { coalesceOrCreate }` from `@/services/activityLog`; lines 84–99: called after save success, wrapped in `.catch()` |
| `ActivityTab.tsx` | `useActivityLog` | `import` + `useActivityLog(projectId)` | WIRED | Line 8: import; line 80: `const { entries, loading, … } = useActivityLog(projectId)` |
| `ActivityTab.tsx` | Firestore `lastViewedActivity` | `setDoc` in `useEffect` on mount | WIRED | Lines 88–94: writes `userProjects/{uid}/projects/{projectId}` with `lastViewedActivity: serverTimestamp()` |
| `WizardShell.tsx` | `ActivityTab` | `import` + `case 'actividad'` | WIRED | Line 34: import; line 178: case branch |
| `WizardSidebar.tsx` | `useActivityBadge` | defined inline + `useActivityBadge(projectId)` | WIRED | Lines 57–109: hook defined in same file; line 126: `const badgeCount = useActivityBadge(projectId)` |
| `onInvitationCreated.ts` | `sendInvitationEmail` | `import` + `await sendInvitationEmail(...)` | WIRED | Line 4: import; lines 32–43: called with API key, invitation data, and app URL |
| `sendInvitationEmail.ts` | `buildInvitationEmailHtml` (templates) | `import` + call in `html:` field | WIRED | Line 2: import; line 24: `html: buildInvitationEmailHtml({...})` |
| `functions/src/index.ts` | `onInvitationCreated` trigger | `import` + `export const` | WIRED | Lines 21, 556: imported and re-exported |
| `InvitationPage.tsx` | `acceptInvitation` / `declineInvitation` services | `import` + `handleAccept` / `handleDecline` handlers | WIRED | Line 15: imports both; `handleAccept` calls `acceptInvitation(invitationId)` and navigates to project; `handleDecline` calls `declineInvitation(invitationId)` and navigates to `/` |
| `App.tsx` | `InvitationPage` (outside `ProtectedRoute`) | `import` + standalone `Route` | WIRED | Line 9: import; line 44: route at `/invitaciones/:invitationId` before protected routes |
| `LoginPage.tsx` | return URL redirect | `sessionStorage.getItem('carpetify_return_url')` in `useEffect` on `user` change | WIRED | Lines 33–41: checks and removes key, navigates to stored URL |
| `handleDeclineInvitation` | no project access granted | updates `status: 'declined'` only; no `collaborators` or `memberUIDs` write | WIRED | Entire handler (lines 109–160): only `invitationRef.update({ status: 'declined', ... })` and `security_events` write — no project document update |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| COLLAB-04 | 13-00-PLAN, 13-01-PLAN | Activity log tracks who changed what and when (field-level change attribution) | SATISFIED | `activityLog.ts` captures `changedFields` per save; `useAutoSave` diffs before/after; `ActivityTab` renders timestamped entries with user attribution; 3 Firestore indexes deployed |
| COLLAB-06 | 13-00-PLAN, 13-02-PLAN | Project invitation flow with email notification and accept/decline via link | SATISFIED | `onInvitationCreated` trigger sends Resend email; `InvitationPage` handles 6 states; accept adds user to project; decline only sets `status: 'declined'` with no access grant |

No orphaned requirements detected. REQUIREMENTS.md Traceability section confirms both COLLAB-04 and COLLAB-06 map to Phase 13, and both are covered by the phase plans.

---

### Anti-Patterns Found

No blockers or warnings found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None | — | — |

**Notes on potential concerns investigated and cleared:**
- `coalesceOrCreate` uses `console.warn` to swallow errors — this is correct fire-and-forget behavior per the design decision; it is not a stub.
- `sendInvitationEmail` returns `{ sent: false }` when Resend API key is absent/invalid — graceful degradation per documented decision; invitation remains valid for in-app acceptance.
- `WizardShell.tsx` `isFullWidth` check on line 239 includes `actividad` — confirmed present and correct.
- `handleDeclineInvitation` has no write to `collaborators` or `memberUIDs` — decline genuinely does not grant access.

---

### Human Verification Required

Three items require a running environment to verify end-to-end:

#### 1. Activity Feed Renders in Real Time

**Test:** Open a project in two browser windows. In window A, edit a field in Datos del Proyecto and wait 2 seconds for auto-save. In window B, navigate to the Actividad tab.
**Expected:** Window B shows a new activity entry attributed to window A's user, with the correct field name and timestamp, within a few seconds and without page refresh.
**Why human:** Real-time `onSnapshot` behavior and cross-user propagation cannot be verified from static code alone.

#### 2. Email Delivery End-to-End

**Test:** With `RESEND_API_KEY` configured in Firebase Secret Manager, invite a new user to a project. Check the invitee's email inbox.
**Expected:** Email arrives from `noreply@lemon-studios.mx` with Spanish content, the project title, inviter's name, role, and a "Ver invitacion" button linking to `/invitaciones/:invitationId`.
**Why human:** Requires Resend API key and live Firebase Function deployment; cannot verify email delivery from code.

#### 3. Invitation Accept/Decline Flow

**Test:** Click a valid invitation link while signed in as the correct invitee email. Verify accept navigates to the project and the user appears in the project's team. Then test with a separate invitation: click decline, confirm in the dialog — verify the user is NOT added to the project and the dashboard shows no new project.
**Expected:** Accept grants project access and navigates to project. Decline shows confirmation dialog, after confirmation navigates to dashboard, and the decliner has no access to the project.
**Why human:** Requires live Firestore, active invitation documents, and visual navigation verification.

---

### Gaps Summary

No gaps. All three observable truths are fully verified through code inspection:

1. **Activity log (COLLAB-04):** The complete data pipeline is wired — `useAutoSave` computes diffs, `coalesceOrCreate` writes to Firestore, `useActivityLog` subscribes in real time, `ActivityTab` renders a filterable day-grouped feed, and `WizardSidebar` shows a live badge count. The `activityLog` WizardScreen type and route case are both registered.

2. **Invitation email (COLLAB-06, email half):** The `onDocumentCreated` trigger is exported from `functions/src/index.ts`, uses Resend to send a Spanish HTML email with a deep link, and gracefully handles API key absence without invalidating the invitation document.

3. **Accept/decline via link (COLLAB-06, UI half):** `InvitationPage` is routed outside `ProtectedRoute`, handles 6 distinct states, uses a confirmation Dialog for decline, and calls the appropriate Cloud Function. `handleDeclineInvitation` server-side confirms no project access is written on decline.

All 8 phase commits (f164a139, 80c80f86, 0482072c, d21facfa, 6d1efe1b, 5ee903cc, 797699c7, 233bf941) verified present in git log.

---

_Verified: 2026-03-26T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
