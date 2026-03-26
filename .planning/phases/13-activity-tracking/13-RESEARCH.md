# Phase 13: Activity Tracking & Invitation Flow - Research

**Researched:** 2026-03-25
**Domain:** Firestore activity logging, email delivery from Cloud Functions, invitation flow completion
**Confidence:** HIGH

## Summary

Phase 13 adds two distinct capabilities to Carpetify: (1) a field-level activity log that records who changed what and when, visible to all project members, and (2) email delivery for the existing invitation flow so that invited team members receive an email with a clickable link to accept or decline.

The critical discovery from code review is that the invitation backend is **already fully implemented** in Phase 11. Cloud Functions (`inviteToProject`, `acceptInvitation`, `declineInvitation`), client services (`src/services/invitations.ts`), and UI components (`InviteModal`, `PendingInvitations`, `TeamMembers`) are all built and functional. What is missing is **email delivery** -- currently, invitations exist only in Firestore and require the invitee to log in and check the dashboard to discover them. This phase adds actual email sending via a Cloud Function that fires when an invitation document is created.

For the activity log, the recommended approach is **client-side logging integrated into the `useAutoSave` hook**. When the hook performs a save, it computes a diff between the previous and new values and writes an activity entry to a `projects/{projectId}/activity_log` subcollection. This is simpler and more cost-effective than an `onDocumentWritten` Cloud Function trigger for this use case (2-5 users, low write volume, and the client already has both old and new values). The `onDocumentWritten` approach would add cold-start latency, an extra Cloud Function invocation per save, and complexity around extracting the acting user's identity from the event context.

**Primary recommendation:** Use Resend (npm `resend` v6.9.4) for email delivery -- minimal API surface, 3,000 free emails/month (far exceeding this tool's needs), and a `defineSecret('RESEND_API_KEY')` pattern already established in the project. Write activity log entries client-side in `useAutoSave` using a lightweight field diff, stored in a Firestore subcollection with a 90-day TTL via a scheduled cleanup function.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLLAB-04 | Activity log tracks who changed what and when (field-level change attribution) | Client-side diff in `useAutoSave` hook writes entries to `projects/{projectId}/activity_log` subcollection. Each entry stores userId, displayName, screen, changedFields array, and timestamp. ActivityLog component renders entries in a scrollable timeline. |
| COLLAB-06 | Project invitation flow with email notification and accept/decline via link | Backend already complete (Phase 11). Add Resend email delivery via `onDocumentCreated` Firestore trigger on `invitations` collection. Email contains project title, inviter name, role, and a deep link to `/invitations/{invitationId}` that renders the accept/decline UI. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages for Frontend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | 12.11.0 | Client SDK -- Firestore `addDoc` for activity log writes, `onSnapshot` for real-time activity feed | Already installed. Activity log is a Firestore subcollection. |
| firebase-admin | 13.7.0 | Server SDK -- Firestore triggers for email on invitation creation | Already in functions/package.json. |
| firebase-functions | 7.2.2 | Cloud Functions v2 `onDocumentCreated` trigger for sending invitation emails | Already installed. Import from `firebase-functions/v2/firestore`. |
| @tanstack/react-query | 5.94.5 | Query activity log entries with pagination | Already installed. |
| zustand | 5.0.12 | Access current user info for activity log attribution | Already installed. |
| date-fns | 4.1.0 | Format activity log timestamps in Spanish (`formatDistanceToNow` with `es` locale) | Already installed in both frontend and functions. |
| lucide-react | 0.577.0 | Icons for activity log entries (Edit, UserPlus, FileText, etc.) | Already installed. |

### New (Functions Only -- 1 Package)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| resend | 6.9.4 | Email delivery API -- send invitation emails from Cloud Functions | When `onDocumentCreated` fires for a new invitation. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | Nodemailer + SMTP | Nodemailer requires SMTP host/port/auth configuration, more boilerplate, and an external SMTP provider account. Resend is a single API key, 5-line integration, and 3,000 free emails/month. For 2-5 users sending maybe 10 invitations/month, Resend's simplicity wins. |
| Resend | Firebase Trigger Email Extension | The extension requires installing a Firebase Extension, configuring an SMTP connection, and writing documents to a `mail` collection. More moving parts. Direct Resend API in a Cloud Function is simpler and gives full control. |
| Resend | SendGrid | SendGrid requires more complex account setup (domain verification, sender authentication). Resend has a faster onboarding path and similar free tier (100/day). |
| Client-side activity logging | `onDocumentWritten` Cloud Function trigger | Server-side triggers add cold-start latency, extra Cloud Function invocations (cost), and difficulty identifying the acting user (auth context is not available in Firestore triggers). Client already has old values, new values, and user identity -- cheaper and simpler. |
| Client-side activity logging | Cloud Audit Logs + Pub/Sub pipeline | Massively over-engineered for 2-5 users. Adds Pub/Sub topic, log sink configuration, and a processing function. Designed for enterprise compliance, not a small team activity feed. |

**Installation:**
```bash
# In functions/ directory only
cd functions && npm install resend@6.9.4
```

**Version verification:**
- `resend`: 6.9.4 (verified via `npm view resend version` on 2026-03-25)
- All other packages already installed at versions listed above

## Architecture Patterns

### Recommended Project Structure

```
src/
  hooks/
    useAutoSave.ts           # MODIFY -- Add activity log writing after successful save
    useActivityLog.ts        # NEW -- Hook to query/subscribe to activity log entries
  services/
    activityLog.ts           # NEW -- Firestore CRUD for activity log entries
  components/
    collaboration/
      ActivityLog.tsx         # NEW -- Scrollable timeline of project changes
      ActivityEntry.tsx       # NEW -- Single activity log entry (avatar, description, timestamp)
  locales/
    es.ts                    # MODIFY -- Add activity log section strings
  pages/
    InvitationPage.tsx       # NEW -- Deep link landing page for email invitation accept/decline
functions/
  src/
    email/
      sendInvitationEmail.ts # NEW -- Resend email sender utility
      templates.ts           # NEW -- HTML email template for invitation (Spanish)
    triggers/
      onInvitationCreated.ts # NEW -- onDocumentCreated trigger that sends email
    index.ts                 # MODIFY -- Export new trigger function
```

### Pattern 1: Activity Log Data Model

**What:** Store field-level change entries in a Firestore subcollection. Each entry records who changed what, on which screen, and when.

**When to use:** Every auto-save that changes at least one field.

**Data Model:**
```typescript
// Firestore: projects/{projectId}/activity_log/{entryId}
interface ActivityLogEntry {
  userId: string              // UID of the user who made the change
  displayName: string         // Cached display name for rendering without extra queries
  photoURL: string | null     // Cached photo URL for avatar
  screen: string              // Wizard screen key (e.g., 'datos', 'financiera')
  action: 'update' | 'create' | 'delete' | 'generate' | 'invite' | 'accept_invite'
  changedFields: string[]     // Field names that changed (e.g., ['titulo_proyecto', 'duracion_estimada_minutos'])
  summary: string             // Human-readable Spanish summary (e.g., 'Actualizo el titulo del proyecto')
  createdAt: Timestamp        // Server timestamp
}
```

**Why cache displayName/photoURL:** Avoids N+1 queries when rendering the activity feed. Users in this tool are 2-5 people; stale names are not a problem.

### Pattern 2: Client-Side Diff in useAutoSave

**What:** Before saving, compare the new data against the last-saved data to detect which fields actually changed. If fields changed, write an activity log entry alongside the save.

**When to use:** Every `doSave()` invocation in the `useAutoSave` hook.

**Example:**
```typescript
// src/hooks/useAutoSave.ts (modified)
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Track last-saved state for diff
const lastSavedRef = useRef<Record<string, unknown>>({})

const doSave = useCallback(
  async (data: Record<string, unknown>) => {
    setStatus('saving')
    try {
      const ref = doc(db, `projects/${projectId}/${path}/data`)
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })

      // Compute diff and write activity log
      const changedFields = Object.keys(data).filter(
        (key) => JSON.stringify(data[key]) !== JSON.stringify(lastSavedRef.current[key])
      )

      if (changedFields.length > 0 && user) {
        const activityRef = collection(db, `projects/${projectId}/activity_log`)
        await addDoc(activityRef, {
          userId: user.uid,
          displayName: user.displayName ?? user.email ?? 'Usuario',
          photoURL: user.photoURL ?? null,
          screen: path,
          action: 'update',
          changedFields,
          summary: buildChangeSummary(path, changedFields),
          createdAt: serverTimestamp(),
        })
      }

      lastSavedRef.current = { ...data }
      setStatus('saved')
      retriesRef.current = 0
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 3000)
    } catch {
      // ... existing retry logic
    }
  },
  [projectId, path, user],
)
```

**Key detail:** The activity log write is non-blocking and happens after the main save succeeds. If the activity write fails, it does not retry or block the user. Activity logging is best-effort, not transactional.

### Pattern 3: Invitation Email via onDocumentCreated Trigger

**What:** A Firestore trigger fires when a new document is created in the `invitations` collection. It reads the invitation data and sends an email via Resend with a deep link.

**When to use:** Automatically, every time `handleInviteToProject` creates a new invitation document.

**Example:**
```typescript
// functions/src/triggers/onInvitationCreated.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import { Resend } from 'resend'
import { buildInvitationEmailHtml } from '../email/templates.js'

const resendApiKey = defineSecret('RESEND_API_KEY')

export const onInvitationCreated = onDocumentCreated(
  {
    document: 'invitations/{invitationId}',
    region: 'us-central1',
    secrets: [resendApiKey],
  },
  async (event) => {
    const snap = event.data
    if (!snap) return

    const data = snap.data()
    if (data.status !== 'pending') return

    const resend = new Resend(resendApiKey.value())
    const invitationId = event.params.invitationId
    const appUrl = process.env.APP_URL || 'https://carpetify.web.app'
    const acceptUrl = `${appUrl}/invitaciones/${invitationId}`

    const { error } = await resend.emails.send({
      from: 'Carpetify <noreply@lemon-studios.mx>',  // Verified domain
      to: [data.inviteeEmail],
      subject: `Te invitaron a colaborar en "${data.projectTitle}"`,
      html: buildInvitationEmailHtml({
        projectTitle: data.projectTitle,
        inviterName: data.inviterName,
        role: data.role,
        acceptUrl,
        expiresAt: data.expiresAt,
      }),
    })

    if (error) {
      console.error('Failed to send invitation email:', error)
      // Do NOT throw -- invitation document is still valid.
      // User can still accept via in-app pending invitations.
    }
  }
)
```

### Pattern 4: Deep Link Invitation Page

**What:** A dedicated route (`/invitaciones/:invitationId`) that unauthenticated users land on from the email link. If not signed in, shows sign-in prompt. If signed in, shows the invitation details with accept/decline buttons.

**When to use:** When invitee clicks the email link.

**Example:**
```typescript
// src/pages/InvitationPage.tsx
import { useParams } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
// ... import invitation service functions

export function InvitationPage() {
  const { invitationId } = useParams<{ invitationId: string }>()
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!user) {
    // Show sign-in prompt explaining they were invited
    return <SignInPrompt reason="invitation" />
  }

  // Fetch invitation details, show accept/decline UI
  // Reuse existing PendingInvitations accept/decline logic
  return <InvitationDetail invitationId={invitationId!} />
}
```

### Pattern 5: Activity Log Summary Generation

**What:** Convert raw field change arrays into human-readable Spanish summaries for the activity feed.

**When to use:** When writing activity log entries (client-side) and when rendering them (as fallback).

**Example:**
```typescript
// src/services/activityLog.ts
const FIELD_LABELS: Record<string, string> = {
  titulo_proyecto: 'titulo del proyecto',
  categoria_cinematografica: 'categoria cinematografica',
  duracion_estimada_minutos: 'duracion estimada',
  costo_total_proyecto_centavos: 'costo total',
  monto_solicitado_eficine_centavos: 'monto EFICINE',
  // ... all EFICINE domain fields in Spanish
}

const SCREEN_LABELS: Record<string, string> = {
  datos: 'Datos del Proyecto',
  guion: 'Guion',
  equipo: 'Equipo Creativo',
  financiera: 'Estructura Financiera',
  documentos: 'Documentos',
}

export function buildChangeSummary(screen: string, changedFields: string[]): string {
  const screenLabel = SCREEN_LABELS[screen] || screen

  if (changedFields.length === 1) {
    const fieldLabel = FIELD_LABELS[changedFields[0]] || changedFields[0]
    return `Actualizo ${fieldLabel} en ${screenLabel}`
  }

  return `Actualizo ${changedFields.length} campos en ${screenLabel}`
}
```

### Anti-Patterns to Avoid

- **Writing old+new values to activity log:** Do NOT store the actual field values (before/after) in the activity log. This doubles storage, creates privacy concerns (financial data in activity feed), and is unnecessary for "who changed what." Field names are sufficient.
- **Blocking save on activity log failure:** The activity log write must be fire-and-forget. If it fails, the user's save must still succeed. Never wrap both in a transaction.
- **Using `onDocumentWritten` for activity logging:** Firestore triggers do NOT have access to `request.auth` -- you cannot identify who made the write from within the trigger. You would need to store a `lastModifiedBy` field on every document, adding complexity to every save path. Client-side logging avoids this entirely.
- **Sending emails synchronously in the `inviteToProject` Cloud Function:** This adds latency to the invitation response. Use a Firestore trigger (`onDocumentCreated`) so email sends asynchronously after the invitation is created.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | Custom SMTP client or raw HTTP to email API | `resend` npm package (v6.9.4) | SMTP configuration is error-prone. Resend handles delivery, bounce tracking, and retries. 5-line integration. |
| Email HTML templates | Raw string concatenation of HTML | Inline HTML template function with Spanish content | React Email would be nice but adds a build step for functions. For 1 email template, an inline HTML function is sufficient. |
| Date formatting in Spanish | Manual month name translation | `date-fns/locale/es` with `formatDistanceToNow` | Already installed. Handles "hace 2 horas", "hace 3 dias" correctly in Spanish. |
| Field diff computation | Deep object comparison library | `JSON.stringify` key-by-key comparison | The data being compared is flat key-value form data. No nested objects. `JSON.stringify` per key is sufficient and adds zero dependencies. |
| Invitation deep link routing | Custom URL parameter parsing | React Router `useParams` on `/invitaciones/:invitationId` | Already using React Router 7.13. One new route entry. |

**Key insight:** The invitation backend is already complete. This phase is about adding email delivery (one trigger function + one npm package) and activity tracking (hook modification + one new subcollection). Scope is smaller than it appears.

## Common Pitfalls

### Pitfall 1: Activity Log Explosion from Rapid Auto-Save
**What goes wrong:** Auto-save fires every 1500ms during active editing. If activity log entries are written on every save, a user editing 5 fields over 10 seconds generates 6+ activity entries.
**Why it happens:** The debounce groups keystrokes but not save events. Each save is a distinct Firestore write.
**How to avoid:** Coalesce activity entries. When writing a new entry, check if the last entry from the same user on the same screen was less than 30 seconds ago. If so, merge the `changedFields` arrays instead of creating a new entry. Implement this as a client-side check before writing.
**Warning signs:** Activity log shows dozens of entries for the same user editing the same screen.

### Pitfall 2: Email Sending Fails Silently
**What goes wrong:** The `onDocumentCreated` trigger sends the email but the Resend API returns an error (invalid API key, domain not verified, rate limit). The invitation exists in Firestore but no email was sent.
**Why it happens:** Email delivery is async and decoupled from invitation creation by design.
**How to avoid:** Log the error to Cloud Functions logs. Add an `emailSent: boolean` and `emailError: string | null` field to the invitation document. The inviter can see "Email no enviado" in the UI and manually share the link. Also add the invitation link to the `inviteToProject` response so the inviter has a fallback.
**Warning signs:** Invitees never receive emails. Check Cloud Functions logs for Resend errors.

### Pitfall 3: Deep Link Requires Authentication
**What goes wrong:** Invitee clicks the email link but is not signed in. The auth guard redirects to sign-in, but after sign-in the user lands on the dashboard instead of the invitation page.
**Why it happens:** The auth redirect does not preserve the original URL.
**How to avoid:** Store the intended URL in session/local storage before redirecting to sign-in. After successful auth, check for a stored redirect URL and navigate there instead of the dashboard. This is a standard "return URL" pattern.
**Warning signs:** Invitees report they signed in but did not see the invitation prompt.

### Pitfall 4: Activity Log Firestore Costs
**What goes wrong:** Activity log subcollection grows unbounded. Querying it becomes slow and expensive over months.
**Why it happens:** No TTL or cleanup mechanism.
**How to avoid:** Implement a scheduled Cloud Function (weekly) that deletes activity log entries older than 90 days. For a tool with 2-5 users and 3 projects, this keeps the subcollection small. Add a `createdAt` index for the cleanup query.
**Warning signs:** Activity log query takes > 1 second to load.

### Pitfall 5: Resend Domain Verification
**What goes wrong:** Emails land in spam or are rejected because the `from` domain is not verified in Resend.
**Why it happens:** Resend requires domain DNS verification (SPF/DKIM records) for production sending.
**How to avoid:** During development, use Resend's test domain (`onboarding@resend.dev`). Before deployment, verify the production domain in the Resend dashboard and add the required DNS records. Document this as a deployment prerequisite.
**Warning signs:** Emails show as "sent" in Resend dashboard but recipients never receive them.

### Pitfall 6: Firestore Security Rules for Activity Log
**What goes wrong:** Activity log entries are not accessible to team members, or any authenticated user can read any project's activity log.
**Why it happens:** The `activity_log` subcollection falls under the project subcollection wildcard rule already defined in Phase 11, but this must be verified.
**How to avoid:** Confirm that the existing wildcard rule `match /{subcollection}/{docId}` under `projects/{projectId}` covers `activity_log`. It should -- the rule checks `isProjectMember` on the parent project document. Verify that the rule allows writes from authenticated project members (needed for client-side logging).
**Warning signs:** Permission denied errors when reading or writing activity log entries.

## Code Examples

### Invitation Email HTML Template (Spanish)

```typescript
// functions/src/email/templates.ts

interface InvitationEmailData {
  projectTitle: string
  inviterName: string
  role: string
  acceptUrl: string
  expiresAt: Date
}

const ROLE_LABELS: Record<string, string> = {
  line_producer: 'Line Producer',
  abogado: 'Abogado',
  director: 'Director',
}

export function buildInvitationEmailHtml(data: InvitationEmailData): string {
  const roleLabel = ROLE_LABELS[data.role] || data.role
  const expiryDate = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data.expiresAt)

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Invitacion a colaborar</h2>
  <p>${data.inviterName} te invito a colaborar en el proyecto <strong>"${data.projectTitle}"</strong> como <strong>${roleLabel}</strong>.</p>
  <p>
    <a href="${data.acceptUrl}"
       style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
      Ver invitacion
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">Esta invitacion expira el ${expiryDate}.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">Carpetify - Lemon Studios</p>
</body>
</html>
  `.trim()
}
```

### Activity Log Query with Real-Time Updates

```typescript
// src/hooks/useActivityLog.ts
import { useEffect, useState } from 'react'
import {
  collection, query, orderBy, limit, onSnapshot,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ActivityEntry {
  id: string
  userId: string
  displayName: string
  photoURL: string | null
  screen: string
  action: string
  changedFields: string[]
  summary: string
  createdAt: Date
}

export function useActivityLog(projectId: string, maxEntries = 50) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    const q = query(
      collection(db, `projects/${projectId}/activity_log`),
      orderBy('createdAt', 'desc'),
      limit(maxEntries),
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId,
          displayName: data.displayName,
          photoURL: data.photoURL ?? null,
          screen: data.screen,
          action: data.action,
          changedFields: data.changedFields ?? [],
          summary: data.summary,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        }
      })
      setEntries(items)
      setLoading(false)
    })

    return unsubscribe
  }, [projectId, maxEntries])

  return { entries, loading }
}
```

### Resend Integration in Cloud Functions

```typescript
// functions/src/email/sendInvitationEmail.ts
import { Resend } from 'resend'
import { buildInvitationEmailHtml } from './templates.js'

export async function sendInvitationEmail(
  resendApiKey: string,
  invitation: {
    inviteeEmail: string
    projectTitle: string
    inviterName: string
    role: string
    expiresAt: Date
    invitationId: string
  },
  appUrl: string,
): Promise<{ sent: boolean; error?: string }> {
  const resend = new Resend(resendApiKey)

  const acceptUrl = `${appUrl}/invitaciones/${invitation.invitationId}`

  const { error } = await resend.emails.send({
    from: 'Carpetify <noreply@lemon-studios.mx>',
    to: [invitation.inviteeEmail],
    subject: `Te invitaron a colaborar en "${invitation.projectTitle}"`,
    html: buildInvitationEmailHtml({
      projectTitle: invitation.projectTitle,
      inviterName: invitation.inviterName,
      role: invitation.role,
      acceptUrl,
      expiresAt: invitation.expiresAt,
    }),
  })

  if (error) {
    console.error('Resend error:', error)
    return { sent: false, error: error.message }
  }

  return { sent: true }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nodemailer + Gmail SMTP | Resend API or similar modern providers | 2023-2024 | Simpler setup, better deliverability, no SMTP configuration needed |
| Firebase Trigger Email Extension | Direct API integration in Cloud Functions | 2024-2025 | More control, fewer moving parts, no extension overhead |
| Cloud Audit Logs for activity tracking | Application-level activity logging | Stable pattern | Audit Logs are for compliance/ops; app-level logs are for user-facing features |
| `onDocumentWritten` for all logging | Client-side logging where auth context is available | Stable pattern | Avoids the auth identity problem in Firestore triggers |

**Deprecated/outdated:**
- `firebase-functions v1` Firestore triggers (`functions.firestore.document()`) -- replaced by v2 `onDocumentCreated` from `firebase-functions/v2/firestore`
- Gmail App Passwords for SMTP -- Google has deprecated "Less Secure Apps" access; OAuth2 is required, adding complexity that Resend eliminates

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x with jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COLLAB-04 | Activity log entries written on field change | unit | `npx vitest run src/services/activityLog.test.ts -t "writes entry" --reporter=verbose` | Wave 0 |
| COLLAB-04 | Field diff computes changed fields correctly | unit | `npx vitest run src/services/activityLog.test.ts -t "diff" --reporter=verbose` | Wave 0 |
| COLLAB-04 | Change summary generates Spanish text | unit | `npx vitest run src/services/activityLog.test.ts -t "summary" --reporter=verbose` | Wave 0 |
| COLLAB-04 | Activity log entries coalesce within 30s window | unit | `npx vitest run src/services/activityLog.test.ts -t "coalesce" --reporter=verbose` | Wave 0 |
| COLLAB-06 | Email HTML template renders with correct data | unit | `npx vitest run functions/src/email/templates.test.ts --reporter=verbose` | Wave 0 |
| COLLAB-06 | onInvitationCreated trigger sends email | unit (mocked) | `npx vitest run functions/src/triggers/onInvitationCreated.test.ts --reporter=verbose` | Wave 0 |
| COLLAB-06 | Invitation deep link page renders accept/decline | smoke | Manual -- navigate to `/invitaciones/{id}` | Manual-only: requires Firebase Auth state |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/services/activityLog.test.ts` -- covers COLLAB-04 (diff, summary, coalesce)
- [ ] `functions/src/email/templates.test.ts` -- covers COLLAB-06 (email template rendering)
- [ ] `functions/src/triggers/onInvitationCreated.test.ts` -- covers COLLAB-06 (trigger logic, mocked Resend)

## Open Questions

1. **Resend domain verification**
   - What we know: Resend requires DNS records (SPF, DKIM) for the sending domain. During development, `onboarding@resend.dev` works for testing.
   - What's unclear: Whether Lemon Studios already has a verified domain in Resend, or if DNS changes are needed.
   - Recommendation: Use `onboarding@resend.dev` during development. Document the DNS verification steps as a pre-deployment task. The `from` address should be configurable via environment variable.

2. **APP_URL for deep links**
   - What we know: The invitation email needs a full URL to the app. The app likely runs at `https://carpetify.web.app` or a custom domain.
   - What's unclear: Whether the URL is stable or varies by environment.
   - Recommendation: Store `APP_URL` as a Cloud Functions environment config value. Default to Firebase Hosting URL.

3. **Activity log retention policy**
   - What we know: A 90-day TTL is reasonable for this tool's needs.
   - What's unclear: Whether the team wants longer retention or export capability.
   - Recommendation: Implement 90-day cleanup. If longer retention is needed later, it can be extended trivially.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `functions/src/invitations/*.ts`, `src/services/invitations.ts`, `src/components/project/InviteModal.tsx`, `src/components/project/PendingInvitations.tsx` -- verified that invitation backend and UI are fully built
- Existing codebase: `src/hooks/useAutoSave.ts` -- verified save pattern and debounce logic
- Existing codebase: `functions/src/index.ts` -- verified `defineSecret` pattern for API keys and existing Cloud Functions v2 patterns
- [npm registry](https://www.npmjs.com/package/resend) -- Resend v6.9.4, verified 2026-03-25
- [npm registry](https://www.npmjs.com/package/nodemailer) -- Nodemailer v8.0.4, verified 2026-03-25
- [firebase-functions v7.2.2 exports](https://www.npmjs.com/package/firebase-functions) -- verified `firebase-functions/v2/firestore` exports `onDocumentCreated`
- [Resend Node.js docs](https://resend.com/docs/send-with-nodejs) -- send email API pattern
- [Resend pricing](https://resend.com/pricing) -- 3,000 emails/month free tier

### Secondary (MEDIUM confidence)
- [Firebase Firestore triggers docs](https://firebase.google.com/docs/functions/firestore-events) -- `onDocumentWritten` and `onDocumentCreated` API
- [Firebase extend with Cloud Functions 2nd gen](https://firebase.google.com/docs/firestore/extend-with-functions-2nd-gen) -- event.data.before/after pattern
- [dev.to: Track all Firestore write activity](https://dev.to/jpoehnelt/track-all-firestore-write-activity-in-firestore-1m8e) -- Audit Logs + Pub/Sub approach (considered and rejected for this use case)

### Tertiary (LOW confidence)
- [Medium: Resend vs Nodemailer comparison](https://devdiwan.medium.com/goodbye-nodemailer-why-i-switched-to-resend-for-sending-emails-in-node-js-55e5a0dba899) -- developer experience comparison (single author opinion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Resend is the only new dependency, well-documented, and the rest is existing stack
- Architecture: HIGH -- Activity log is a standard Firestore subcollection pattern; email trigger is a standard Cloud Functions pattern; all existing invitation code reviewed
- Pitfalls: HIGH -- Identified from codebase review (auth redirect, activity explosion, email failure) and established Firebase patterns

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable domain, no fast-moving dependencies)
