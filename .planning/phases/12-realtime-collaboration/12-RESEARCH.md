# Phase 12: Real-Time Collaboration - Research

**Researched:** 2026-03-25
**Domain:** Firebase Realtime Database presence/locking + Firestore real-time sync + collaborative UI patterns
**Confidence:** HIGH

## Summary

Phase 12 adds real-time collaboration to Carpetify: presence indicators (who is online, which screen they are viewing), section-level pessimistic locking on wizard screens, and conflict messaging. The architecture uses **two Firebase databases with strict separation**: Realtime Database (RTDB) for ephemeral state (presence and locks) and Firestore for persistent project data (unchanged from current usage). This dual-database pattern is Firebase's officially recommended approach for presence systems.

The key implementation insight is that RTDB provides two primitives that Firestore lacks: `.info/connected` (client connection state detection) and `onDisconnect()` (server-side cleanup triggered automatically when the client drops). These enable reliable lock expiry and presence cleanup even when a browser crashes or loses network. Lock acquisition uses RTDB `runTransaction()` for atomic compare-and-set, preventing race conditions when two users attempt to lock the same screen simultaneously.

No new npm packages are required. The `firebase` client SDK (v12.11.0) already bundles `@firebase/database` (v1.1.2). The `firebase-admin` server SDK (v13.7.0) already bundles `firebase-admin/database`. The only infrastructure change is adding RTDB to the Firebase project configuration (`firebase.json`, `.env` with `databaseURL`, and RTDB security rules).

**Primary recommendation:** Use RTDB at paths `presence/{projectId}/{userId}` and `locks/{projectId}/{screenId}` with `onDisconnect()` for automatic cleanup. Lock acquisition via `runTransaction()` with compare-and-set (lock only if null or expired). Presence via `onValue` on `.info/connected` + `onDisconnect().remove()`. Client-side hooks (`usePresence`, `useSectionLock`) encapsulate all RTDB logic. One new Cloud Function (`forceBreakLock`) for productor override. All UI strings in Mexican Spanish via `es.ts`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Lock acquires on edit intent (user clicks into a field or clicks "Editar" on a generated doc), not on page open. Viewing a screen does not lock it. Multiple users can view the same screen simultaneously without blocking each other.
- **D-02:** Lock granularity: per wizard screen (5 independent zones) + per generated document in the document viewer. Locking the entire project is too aggressive. Per-field locking is CRDTs in disguise (out of scope). Screen-level allows real parallel work -- LP edits budget while abogado edits a contract.
- **D-03:** Three lock release mechanisms: (1) explicit -- user navigates away or clicks "Terminar edicion," (2) idle -- lock releases automatically after 60 seconds of inactivity following auto-save, (3) disconnect timeout -- lock expires after 2 minutes if browser disconnects. Prevents stale locks from blocking the team.
- **D-04:** Productor can force-break any lock from project settings. Confirmation dialog: "Maria (line_producer) tiene esta seccion bloqueada. Desbloquear? Los cambios no guardados de Maria se perderan." Only the productor role has force-break power. Other roles wait for timeout.
- **D-05:** Avatar row in project header (who's online) + per-screen avatar dot in sidebar (where they are). Header shows small circular avatars of all team members currently in the project. Sidebar shows avatar dot next to screen name if someone is on that screen.
- **D-06:** Google profile photo in a colored ring. Green ring = viewing (read-only). Orange ring = editing (has a lock). Hover shows name + role: "Maria -- Line Producer." No photo = initials in colored circle.
- **D-07:** Presence lifecycle: user is "present" when project is open in active browser tab. "Viewing" a screen when that screen is rendered. Presence dims after 30 seconds of tab inactivity (switched tab, minimized). Presence removed after 2-minute disconnect timeout (matching lock timeout).
- **D-08:** Presence and lock data stored in Firebase Realtime Database (RTDB), NOT Firestore. RTDB has built-in `.info/connected` and `onDisconnect()` for automatic cleanup on disconnect. Store at `presence/{projectId}/{userId}` and `locks/{projectId}/{screenId}`.
- **D-09:** HARD LINE: RTDB is for presence and locks ONLY. Everything else stays in Firestore. No data creep into RTDB. Two databases, strict separation of concerns.
- **D-10:** Firestore `onSnapshot` listeners on active project document and subcollections. Changes pushed within 1-2 seconds. Extend existing React Query + Firestore pattern to real-time instead of fetch-on-mount. No polling, no custom WebSocket layer.
- **D-11:** Read-only viewers see incoming changes immediately. No conflict possible -- they cannot have unsaved edits. Data updates under them transparently.
- **D-12:** Lock holder works in isolation -- does NOT see incoming changes to the locked screen until they release the lock. Prevents jarring mid-edit data shifts. When they save and release, their changes overwrite. Safe because locks prevent simultaneous editing of the same screen.
- **D-13:** No special stale data notification needed. `onSnapshot` keeps local cache current at all times. Navigating to a screen always shows latest data because the listener is already running.
- **D-14:** Role restriction takes priority over lock in the UI. If a user cannot edit a screen due to their role, they see only the role-based banner ("Solo lectura -- contacta a [Productor Name] para editar"), never the lock message.
- **D-15:** Standard lock behavior for users with overlapping edit permissions -- first editor wins. If productor and LP both can edit Screen 4 and LP locks it first, productor sees "En uso por Maria (Line Producer)." Productor's force-break power (D-04) still applies.
- **D-16:** Two distinct messages for two distinct situations: (1) Locked screen (temporary, you could edit): "Esta seccion esta siendo editada por Maria (Line Producer). Puedes ver los datos pero no editarlos hasta que termine." (2) Role-restricted screen (permanent, you cannot edit): "Solo lectura -- contacta a [Productor Name] para editar."
- **D-17:** Generated documents follow the same pattern. Role restriction hides the edit button entirely (Phase 11 D-05). Lock message appears only when the edit button would normally be visible but someone else has the lock.

### Claude's Discretion
- RTDB security rules for presence and lock paths
- Lock acquisition race condition handling (two users click edit at the same millisecond)
- onSnapshot listener management (subscribe/unsubscribe lifecycle, memory cleanup)
- Presence heartbeat interval for detecting idle/inactive tabs
- How auto-save interacts with lock release (save completes before lock drops)
- Avatar rendering component (photo loading, fallback initials, ring colors)
- Force-break lock Cloud Function implementation

### Deferred Ideas (OUT OF SCOPE)
- Field-level cursors showing where each user is typing -- Google Docs-style, out of scope per REQUIREMENTS.md
- Conflict resolution UI for overlapping edits -- not needed with section locking
- Notification when someone joins/leaves the project -- v2.1 nice-to-have
- Lock queue (second editor automatically gets lock when first releases) -- v2.1 if teams complain about lock contention
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLLAB-01 | Multiple team members can view and edit the same project simultaneously | Firestore `onSnapshot` listeners provide real-time data sync. RTDB presence tracks who is online. Lock system prevents write conflicts. No new libraries needed -- `firebase/database` is bundled with existing SDK. |
| COLLAB-02 | Section-level locking -- when a user is editing a wizard screen, other users see it as locked with the editor's name | RTDB `locks/{projectId}/{screenId}` with `runTransaction()` for atomic lock acquisition. `onDisconnect().remove()` for automatic cleanup. `onValue` listener for real-time lock status. `useSectionLock` hook encapsulates logic. |
| COLLAB-03 | Real-time presence indicators show which team members are currently viewing the project and which screen they are on | RTDB `presence/{projectId}/{userId}` with `.info/connected` + `onDisconnect()`. `usePresence` hook writes current screen + heartbeat. `useProjectPresence` hook reads all presence data for avatar display. |
| COLLAB-05 | Role-based screen access -- line_producer can edit financials and budget, abogado can edit contracts, director can edit creative team and screenplay analysis | Already implemented in Phase 11 (`src/lib/permissions.ts` with `canEditScreen()`). Phase 12 layers lock checks ON TOP of role checks. D-14: role restriction takes priority -- lock message only shown to users who CAN edit the screen. |
| COLLAB-07 | Conflict notification when two users attempt to edit the same section -- second user sees "en uso por [nombre]" message | Lock acquisition returns `{ acquired: false, holder: { name, role } }` when screen is already locked. UI displays Spanish conflict message per D-16. `LockBanner` component shows holder name and role. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | 12.11.0 | Client SDK -- `firebase/database` module for RTDB (`getDatabase`, `ref`, `set`, `onValue`, `onDisconnect`, `runTransaction`, `serverTimestamp`) | Already in package.json. The `@firebase/database` subpackage (v1.1.2) is bundled. No separate install needed. |
| firebase-admin | 13.7.0 | Server SDK -- `firebase-admin/database` for force-break lock Cloud Function | Already in functions/package.json. Provides Admin RTDB access to remove locks without client auth. |
| firebase-functions | 7.2.2 | Cloud Functions v2 `onCall` for `forceBreakLock` | Already in functions/package.json. Same pattern as existing functions. |
| react | 19.2.4 | Custom hooks for presence/lock lifecycle (`usePresence`, `useSectionLock`) | Already installed. Hooks manage RTDB listener subscriptions. |
| zustand | 5.0.12 | No new stores needed -- presence/lock state is RTDB-sourced via hooks, not Zustand | Already installed. `appStore.currentProjectRole` used for role checks. |
| @tanstack/react-query | 5.94.5 | Not used for RTDB (no caching needed for ephemeral state). Existing Firestore queries remain. | Already installed. |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast for lock events: acquisition failure, force-break confirmation, timeout warning | Lock contention feedback |
| lucide-react | 0.577.0 | Icons: `Lock`, `Unlock`, `Users`, `Eye`, `Edit3` for lock/presence UI | Lock banners, sidebar indicators |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RTDB for presence | Firestore with Cloud Functions sync | Firebase's own docs recommend RTDB for presence. Firestore lacks `onDisconnect()` and `.info/connected`. The Firestore presence workaround requires Cloud Functions as middleware -- adds latency and complexity. |
| RTDB `runTransaction` for lock acquire | Firestore transaction | RTDB transactions are simpler for this use case (single node compare-and-set). Firestore transactions require reading the doc first and are optimistic (retry on conflict). RTDB transaction is a single atomic operation on one path. |
| Custom heartbeat timer | Visibility API + `onDisconnect` | Visibility API detects tab switches natively. `onDisconnect` handles crashes. Combined, they cover all disconnect scenarios without custom ping/pong. |

**Installation:** No new packages needed. Infrastructure-only changes:
```bash
# Add RTDB to firebase.json and .env
# No npm install required
```

**Version verification:**
- `firebase` v12.11.0 (latest on npm: 12.11.0) -- current
- `firebase-admin` v13.7.0 (latest on npm: 13.7.0) -- current
- `@firebase/database` v1.1.2 (bundled with firebase v12.11.0) -- current

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    firebase.ts              # MODIFY -- Add getDatabase() export + RTDB emulator connect
    rtdb.ts                  # NEW -- RTDB path helpers: presencePath(), lockPath()
  hooks/
    usePresence.ts           # NEW -- Writes current user's presence to RTDB
    useProjectPresence.ts    # NEW -- Reads all users' presence for a project
    useSectionLock.ts        # NEW -- Lock acquire/release/status for a screen
    useAutoSave.ts           # MODIFY -- Integrate lock check before save, release after
    useIdleDetection.ts      # NEW -- Visibility API + activity tracking for idle/disconnect
  components/
    collaboration/
      PresenceAvatarRow.tsx  # NEW -- Avatar row in project header (D-05)
      PresenceAvatar.tsx     # NEW -- Single avatar with colored ring (D-06)
      SidebarPresenceDot.tsx # NEW -- Per-screen avatar dot in sidebar (D-05)
      LockBanner.tsx         # NEW -- "En uso por [nombre]" banner (D-16)
      ForceBreakDialog.tsx   # NEW -- Productor lock override confirmation (D-04)
    wizard/
      WizardShell.tsx        # MODIFY -- Add presence writing + lock check on edit intent
      WizardSidebar.tsx      # MODIFY -- Add presence dots next to screen names
    layout/
      AppHeader.tsx          # MODIFY -- Add PresenceAvatarRow when inside a project
  locales/
    es.ts                    # MODIFY -- Add collaboration section (lock messages, presence labels)
functions/
  src/
    collaboration/
      forceBreakLock.ts      # NEW -- Cloud Function: productor force-breaks a lock via Admin RTDB
database.rules.json          # NEW -- RTDB security rules
firebase.json                # MODIFY -- Add "database" section with rules file
.env                         # MODIFY -- Add VITE_FIREBASE_DATABASE_URL
```

### Pattern 1: Firebase RTDB Initialization

**What:** Add RTDB client to the existing Firebase setup. RTDB requires a `databaseURL` in the config.

**When to use:** App initialization in `firebase.ts`.

**Example:**
```typescript
// src/lib/firebase.ts (additions only)
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'

// Add databaseURL to firebaseConfig:
const firebaseConfig = {
  // ... existing config ...
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

// Export RTDB instance
export const rtdb = getDatabase(app)

// Emulator connection (add inside existing DEV check):
// connectDatabaseEmulator(rtdb, '127.0.0.1', 9000)
```

```typescript
// src/lib/rtdb.ts -- Path helpers
export function presencePath(projectId: string, userId: string): string {
  return `presence/${projectId}/${userId}`
}

export function lockPath(projectId: string, screenId: string): string {
  return `locks/${projectId}/${screenId}`
}

export function projectPresencePath(projectId: string): string {
  return `presence/${projectId}`
}
```

### Pattern 2: Presence System with onDisconnect

**What:** When a user opens a project, write their presence to RTDB. When they disconnect (tab close, crash, network loss), `onDisconnect()` automatically removes it. Presence includes the current screen being viewed and the user's display info.

**When to use:** Inside the `WizardShell` component lifecycle (mount/unmount + screen changes).

**RTDB Data Model:**
```
presence/{projectId}/{userId} = {
  displayName: string,
  photoURL: string | null,
  role: string,
  screen: string,          // Current wizard screen key
  status: "active" | "idle",
  lastActive: number,      // serverTimestamp
}
```

**Example:**
```typescript
// src/hooks/usePresence.ts
import { useEffect, useRef } from 'react'
import { ref, set, onValue, onDisconnect, serverTimestamp, remove } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { presencePath } from '@/lib/rtdb'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/stores/appStore'

export function usePresence(projectId: string, screen: string) {
  const { user } = useAuth()
  const role = useAppStore((s) => s.currentProjectRole)
  const disconnectRef = useRef<ReturnType<typeof onDisconnect> | null>(null)

  useEffect(() => {
    if (!user || !projectId) return

    const myPresenceRef = ref(rtdb, presencePath(projectId, user.uid))
    const connectedRef = ref(rtdb, '.info/connected')

    const presenceData = {
      displayName: user.displayName ?? user.email ?? 'Usuario',
      photoURL: user.photoURL ?? null,
      role: role ?? 'productor',
      screen,
      status: 'active' as const,
      lastActive: serverTimestamp(),
    }

    // Listen for connection state
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Queue cleanup BEFORE setting presence (prevent race condition)
        const disconn = onDisconnect(myPresenceRef)
        disconn.remove()
        disconnectRef.current = disconn

        // Now safe to set presence
        set(myPresenceRef, presenceData)
      }
    })

    return () => {
      unsubscribe()
      // Clean up on unmount (navigating away from project)
      remove(myPresenceRef)
    }
  }, [user, projectId, screen, role])
}
```

### Pattern 3: Lock Acquisition with runTransaction

**What:** Atomic compare-and-set lock. Uses RTDB `runTransaction()` to check if the lock path is null (unlocked) or expired, and sets it atomically. If another user already holds the lock, the transaction returns the current holder's info without modifying.

**When to use:** When a user clicks to edit a screen (D-01: edit intent, not page open).

**RTDB Data Model:**
```
locks/{projectId}/{screenId} = {
  userId: string,
  displayName: string,
  role: string,
  acquiredAt: number,      // serverTimestamp
  expiresAt: number,       // acquiredAt + 120000 (2-min disconnect timeout)
}
// null = unlocked
```

**Example:**
```typescript
// src/hooks/useSectionLock.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ref, runTransaction, set, remove, onValue,
  onDisconnect, serverTimestamp,
} from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { lockPath } from '@/lib/rtdb'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/stores/appStore'

interface LockHolder {
  userId: string
  displayName: string
  role: string
  acquiredAt: number
}

interface LockState {
  isLocked: boolean
  isMyLock: boolean
  holder: LockHolder | null
}

export function useSectionLock(projectId: string, screenId: string) {
  const { user } = useAuth()
  const role = useAppStore((s) => s.currentProjectRole)
  const [lockState, setLockState] = useState<LockState>({
    isLocked: false, isMyLock: false, holder: null,
  })
  const disconnectCleanupRef = useRef<ReturnType<typeof onDisconnect> | null>(null)

  const lockRef = ref(rtdb, lockPath(projectId, screenId))

  // Subscribe to lock status changes in real-time
  useEffect(() => {
    const unsubscribe = onValue(lockRef, (snap) => {
      const data = snap.val()
      if (!data) {
        setLockState({ isLocked: false, isMyLock: false, holder: null })
      } else {
        // Check if lock is expired (2-min timeout per D-03)
        const isExpired = data.expiresAt && Date.now() > data.expiresAt
        if (isExpired) {
          // Clean up expired lock
          remove(lockRef)
          setLockState({ isLocked: false, isMyLock: false, holder: null })
        } else {
          setLockState({
            isLocked: true,
            isMyLock: data.userId === user?.uid,
            holder: data,
          })
        }
      }
    })
    return unsubscribe
  }, [projectId, screenId, user?.uid])

  // Acquire lock via transaction (atomic compare-and-set)
  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    const result = await runTransaction(lockRef, (currentData) => {
      if (currentData === null) {
        // Unlocked -- acquire it
        return {
          userId: user.uid,
          displayName: user.displayName ?? 'Usuario',
          role: role ?? 'productor',
          acquiredAt: Date.now(),
          expiresAt: Date.now() + 120_000, // 2-min expiry per D-03
        }
      }
      // Check if expired
      if (currentData.expiresAt && Date.now() > currentData.expiresAt) {
        // Expired -- take over
        return {
          userId: user.uid,
          displayName: user.displayName ?? 'Usuario',
          role: role ?? 'productor',
          acquiredAt: Date.now(),
          expiresAt: Date.now() + 120_000,
        }
      }
      // Already locked by someone else -- abort (return undefined aborts)
      return undefined
    })

    if (result.committed && result.snapshot.val()?.userId === user.uid) {
      // Set up disconnect cleanup for this lock
      const disconn = onDisconnect(lockRef)
      disconn.remove()
      disconnectCleanupRef.current = disconn
      return true
    }
    return false
  }, [user, role, projectId, screenId])

  // Release lock explicitly
  const releaseLock = useCallback(async () => {
    if (disconnectCleanupRef.current) {
      disconnectCleanupRef.current.cancel()
      disconnectCleanupRef.current = null
    }
    await remove(lockRef)
  }, [projectId, screenId])

  return { lockState, acquireLock, releaseLock }
}
```

### Pattern 4: Idle Detection with Visibility API

**What:** Detect when the user switches tabs or minimizes the browser. After 30 seconds of inactivity, mark presence as "idle" (D-07). After 60 seconds of inactivity following auto-save, release the lock (D-03).

**When to use:** Mounted in WizardShell alongside the presence hook.

**Example:**
```typescript
// src/hooks/useIdleDetection.ts
import { useEffect, useRef, useCallback } from 'react'

interface IdleCallbacks {
  onIdle: () => void       // 30s inactivity -- dim presence
  onActive: () => void     // User returns -- restore presence
  onLockTimeout: () => void // 60s inactivity after save -- release lock
}

export function useIdleDetection(callbacks: IdleCallbacks, idleMs = 30_000, lockTimeoutMs = 60_000) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isIdleRef = useRef(false)

  const resetTimers = useCallback(() => {
    if (isIdleRef.current) {
      isIdleRef.current = false
      callbacks.onActive()
    }
    clearTimeout(idleTimerRef.current)
    clearTimeout(lockTimerRef.current)

    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true
      callbacks.onIdle()
    }, idleMs)

    lockTimerRef.current = setTimeout(() => {
      callbacks.onLockTimeout()
    }, lockTimeoutMs)
  }, [callbacks, idleMs, lockTimeoutMs])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']
    events.forEach((e) => document.addEventListener(e, resetTimers, { passive: true }))

    // Visibility API for tab switches
    const onVisibilityChange = () => {
      if (document.hidden) {
        // Start idle timer immediately on tab switch
        idleTimerRef.current = setTimeout(() => {
          isIdleRef.current = true
          callbacks.onIdle()
        }, idleMs)
      } else {
        resetTimers()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    resetTimers() // Start initial timer

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetTimers))
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearTimeout(idleTimerRef.current)
      clearTimeout(lockTimerRef.current)
    }
  }, [resetTimers, callbacks, idleMs])
}
```

### Pattern 5: Auto-Save + Lock Integration

**What:** Extend the existing `useAutoSave` hook to check lock ownership before saving and coordinate lock release after save completes (D-03, D-12).

**When to use:** Every wizard screen that uses auto-save.

**Key changes to `useAutoSave.ts`:**
```typescript
// Add to useAutoSave parameters:
// lockOwned: boolean -- only save if the current user holds the lock
// onSaveComplete: () => void -- callback after successful save (for lock timeout reset)

// Before doSave:
// if (!lockOwned) return -- skip save if lock not held

// After successful save:
// onSaveComplete?.() -- reset idle timer
```

### Pattern 6: RTDB Security Rules

**What:** Security rules for RTDB paths that enforce: (1) only authenticated users can read/write, (2) users can only write their own presence, (3) lock writes are constrained to authenticated project members.

**Example:**
```json
{
  "rules": {
    "presence": {
      "$projectId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid === $userId",
          ".validate": "newData.hasChildren(['displayName', 'screen', 'status'])"
        }
      }
    },
    "locks": {
      "$projectId": {
        ".read": "auth != null",
        "$screenId": {
          ".write": "auth != null && (!data.exists() || data.child('userId').val() === auth.uid || data.child('expiresAt').val() < now)",
          ".validate": "newData.hasChildren(['userId', 'displayName', 'role', 'acquiredAt', 'expiresAt']) && newData.child('userId').val() === auth.uid"
        }
      }
    }
  }
}
```

**Rule logic for locks:**
- `.write` allows if: (a) lock does not exist (unlocked), (b) current user already holds the lock (renewal), or (c) lock has expired (`expiresAt < now`). This prevents one user from overwriting another's active lock.
- `.validate` ensures the userId in the new data matches the authenticated user -- no impersonation.
- Admin SDK (used by `forceBreakLock` Cloud Function) bypasses rules entirely.

### Pattern 7: Force-Break Lock Cloud Function

**What:** Cloud Function that allows the productor to forcefully remove another user's lock. Uses Admin SDK to bypass RTDB security rules.

**Example:**
```typescript
// functions/src/collaboration/forceBreakLock.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getDatabase } from 'firebase-admin/database'
import { requireAuth, requireProjectAccess, requireRole } from '../auth/requireAuth.js'

export const handleForceBreakLock = onCall(
  { region: 'us-central1' },
  async (request) => {
    const uid = requireAuth(request)
    const { projectId, screenId } = request.data as { projectId: string; screenId: string }

    if (!projectId || !screenId) {
      throw new HttpsError('invalid-argument', 'Se requiere projectId y screenId.')
    }

    // Verify caller is productor (only productor can force-break per D-04)
    const { role } = await requireProjectAccess(uid, projectId)
    requireRole(role, ['productor'])

    // Remove the lock using Admin SDK (bypasses RTDB rules)
    const db = getDatabase()
    await db.ref(`locks/${projectId}/${screenId}`).remove()

    return { success: true }
  }
)
```

### Anti-Patterns to Avoid

- **Using Firestore for presence/locks:** Firestore lacks `onDisconnect()` and `.info/connected`. Building presence in Firestore requires Cloud Functions as middleware, adding 1-3 seconds of latency and complexity. Use RTDB for ephemeral state.
- **Storing lock state in Zustand:** Lock state comes from RTDB via `onValue` listeners. Duplicating it in Zustand creates two sources of truth. The `useSectionLock` hook IS the source of truth for lock status.
- **Polling for lock status:** RTDB `onValue` pushes changes in real-time. Never use `setInterval` to check lock status.
- **Setting presence before queuing onDisconnect:** Always call `onDisconnect().remove()` BEFORE `set()` on the presence node. If the connection drops between `set()` and `onDisconnect()`, the presence node is never cleaned up.
- **Using `set()` instead of `runTransaction()` for lock acquisition:** Without a transaction, two users clicking "edit" at the same millisecond will both succeed in writing their lock data. The second write silently overwrites the first. `runTransaction()` makes this atomic.
- **Letting lock expiry only happen client-side:** If the lock-holding client crashes, no client-side timer fires. `onDisconnect().remove()` handles crash cleanup. The `expiresAt` field is a secondary safeguard checked by other clients reading the lock.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Connection state detection | Custom WebSocket ping/pong | RTDB `.info/connected` + `onValue` | Firebase maintains the connection. `.info/connected` is authoritative. Custom detection duplicates infrastructure. |
| Disconnect cleanup | Custom heartbeat + stale-check cron | RTDB `onDisconnect().remove()` | Server-side guarantee. Fires even on crash, network loss, or abrupt tab close. No polling or cron needed. |
| Atomic lock acquisition | Custom Firestore transaction + retry | RTDB `runTransaction()` on lock node | Single-node atomic compare-and-set. Simpler than Firestore distributed transactions. Retry handled by Firebase. |
| Tab visibility detection | Custom `blur`/`focus` + `beforeunload` | `document.visibilitychange` API | Standard API. Works across tabs in same window. More reliable than blur/focus for detecting inactive tabs. |
| Real-time data sync | Custom WebSocket or SSE layer | Firestore `onSnapshot` (already in use) | Firestore handles connection management, offline caching, and reconnection. Already the project's established pattern. |
| Server timestamp | `Date.now()` from client | RTDB `serverTimestamp()` | Clock skew between clients causes lock expiry bugs. Server timestamp is authoritative. |

**Key insight:** Firebase RTDB was purpose-built for exactly this use case -- ephemeral real-time state with disconnect cleanup. Every "hand-rolled" alternative recreates functionality that ships free with the SDK.

## Common Pitfalls

### Pitfall 1: onDisconnect Race Condition

**What goes wrong:** Presence is set BEFORE `onDisconnect().remove()` is queued. If the connection drops between the two operations, the presence node is never cleaned up. The user appears permanently online.
**Why it happens:** Natural coding order is "set data, then set cleanup." But the cleanup must be guaranteed before the data is written.
**How to avoid:** Always call `onDisconnect().remove()` first, wait for the promise to resolve, THEN call `set()` on the presence node. The Firebase docs explicitly recommend this order: "Your app should queue the disconnect operations before a user is marked online."
**Warning signs:** Ghost users appearing in the presence list who are not actually online. Presence that never cleans up unless another user force-refreshes.

### Pitfall 2: Lock Held After Sign-Out

**What goes wrong:** User signs out but the `onDisconnect` handler has not fired because the RTDB connection is still alive. The lock persists until connection timeout.
**Why it happens:** `onDisconnect` only fires when the connection drops, not when the user signs out. Sign-out does not necessarily close the RTDB connection.
**How to avoid:** The sign-out handler must explicitly remove all locks and presence for the user. Add cleanup to the existing `handleSignOut` function in `AppHeader.tsx`: call `remove()` on the user's presence path and any held locks.
**Warning signs:** After sign-out, other users still see the signed-out user's avatar in presence. Locks persist until the 2-minute expiry.

### Pitfall 3: Multiple Tabs Creating Duplicate Presence

**What goes wrong:** User opens the project in two browser tabs. Each tab writes its own presence data. When one tab closes, `onDisconnect` removes the presence, making the user appear offline even though the other tab is still open.
**Why it happens:** Each tab has its own RTDB connection and its own `onDisconnect` handler. They overwrite each other at the same path.
**How to avoid:** Use a connection-specific sub-path: `presence/{projectId}/{userId}/{connectionId}` where `connectionId` is generated by `push()`. Each tab gets its own node. `onDisconnect` removes only that tab's node. Presence is "offline" only when ALL connection nodes are removed (the parent `{userId}` node becomes empty).
**Warning signs:** Flickering online/offline status when user has multiple tabs open.

### Pitfall 4: Clock Skew Breaking Lock Expiry

**What goes wrong:** Client A acquires a lock at `Date.now() + 120000` for expiry. Client B checks the lock but Client B's clock is 3 minutes ahead. Client B sees the lock as expired and takes it, even though Client A is still actively editing.
**Why it happens:** `Date.now()` is client-local. Different machines have different clocks.
**How to avoid:** Use RTDB `serverTimestamp()` for `acquiredAt`. For `expiresAt`, calculate on the server or use the server time offset: `ref(rtdb, '.info/serverTimeOffset')` returns the difference between client time and server time. Add this offset to `Date.now()` for consistent timestamps.
**Warning signs:** Locks being stolen from active editors. "En uso por" messages flickering between users.

### Pitfall 5: Auto-Save Firing After Lock Release

**What goes wrong:** User finishes editing and navigates away. The navigation triggers lock release. But the auto-save debounce timer (1500ms) still has a pending save that fires AFTER the lock is released. The save writes data without holding the lock, potentially conflicting with the next editor.
**How to avoid:** Flush the auto-save before releasing the lock. Sequence: (1) flush pending save, (2) wait for save to complete, (3) then release lock. The existing `useAutoSave` already has a flush mechanism on unmount -- extend it to return a `flushAndWait()` promise.
**Warning signs:** Data occasionally reverting to a previous state after lock handoff. Intermittent save errors.

### Pitfall 6: RTDB Not Initialized (Missing databaseURL)

**What goes wrong:** `getDatabase()` is called but the Firebase config does not include `databaseURL`. The RTDB instance connects to the default URL which may not exist, causing silent failures or "permission denied" errors.
**Why it happens:** The current `firebase.ts` config does not include `databaseURL` because RTDB was not previously used. It is easy to forget adding this to both `.env` and `firebase.ts`.
**How to avoid:** Add `VITE_FIREBASE_DATABASE_URL` to `.env` and `.env.example`. Add `databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL` to `firebaseConfig` in `firebase.ts`. Verify RTDB is enabled in the Firebase Console.
**Warning signs:** Console errors about RTDB permissions. Presence/locks silently not working.

### Pitfall 7: firebase.json Missing RTDB Configuration

**What goes wrong:** RTDB security rules are not deployed because `firebase.json` does not reference them. The default RTDB rules (locked mode) block all reads/writes.
**Why it happens:** The current `firebase.json` has sections for `firestore`, `storage`, `hosting`, and `functions`, but not `database`. RTDB rules must be explicitly configured.
**How to avoid:** Add `"database": { "rules": "database.rules.json" }` to `firebase.json`. Create `database.rules.json` with the presence/lock rules. Add RTDB emulator to `firebase.json` emulators section.
**Warning signs:** "Permission denied" errors on all RTDB operations. Presence and locks not working in production despite working in development (if emulator has open rules).

### Pitfall 8: Lock Isolation Breaking onSnapshot Updates

**What goes wrong:** Per D-12, the lock holder should NOT see incoming Firestore changes to the locked screen. But existing `onSnapshot` listeners on the project document continue pushing updates. The user's form state gets overwritten mid-edit.
**Why it happens:** `onSnapshot` is always active. It does not know about lock state.
**How to avoid:** When a user acquires a lock, pause (unsubscribe from) `onSnapshot` listeners for that specific screen's data. When the lock is released, re-subscribe. This requires the screen components to accept a "paused" prop or the hooks to check lock state before applying incoming data.
**Warning signs:** Form fields resetting to previous values while the user is typing. Race between auto-save and incoming snapshot.

## Code Examples

### Firebase RTDB Setup (Complete)

```typescript
// src/lib/firebase.ts (complete updated file)
import { initializeApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,  // NEW for RTDB
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'us-central1')
export const rtdb = getDatabase(app)  // NEW

// Uncomment for local development with emulators:
// import { connectDatabaseEmulator } from 'firebase/database'
// connectDatabaseEmulator(rtdb, '127.0.0.1', 9000)
```

### Reading Project Presence (All Online Users)

```typescript
// src/hooks/useProjectPresence.ts
import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { projectPresencePath } from '@/lib/rtdb'
import type { ProjectRole } from '@/lib/permissions'

export interface PresenceEntry {
  userId: string
  displayName: string
  photoURL: string | null
  role: ProjectRole
  screen: string
  status: 'active' | 'idle'
}

export function useProjectPresence(projectId: string): PresenceEntry[] {
  const [presenceList, setPresenceList] = useState<PresenceEntry[]>([])

  useEffect(() => {
    if (!projectId) return

    const presenceRef = ref(rtdb, projectPresencePath(projectId))
    const unsubscribe = onValue(presenceRef, (snap) => {
      const data = snap.val()
      if (!data) {
        setPresenceList([])
        return
      }
      const entries: PresenceEntry[] = Object.entries(data).map(
        ([userId, value]) => ({
          userId,
          ...(value as Omit<PresenceEntry, 'userId'>),
        })
      )
      setPresenceList(entries)
    })

    return unsubscribe
  }, [projectId])

  return presenceList
}
```

### Presence Avatar Component

```typescript
// src/components/collaboration/PresenceAvatar.tsx
import { cn } from '@/lib/utils'
import type { PresenceEntry } from '@/hooks/useProjectPresence'
import { es } from '@/locales/es'

interface PresenceAvatarProps {
  entry: PresenceEntry
  size?: 'sm' | 'md'
}

export function PresenceAvatar({ entry, size = 'sm' }: PresenceAvatarProps) {
  const sizeClasses = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const ringColor = entry.status === 'idle'
    ? 'ring-muted-foreground/30'
    : entry.screen ? 'ring-orange-500' : 'ring-green-500'
  // D-06: Orange ring = editing (has lock), green = viewing
  // Simplified: if they are on a screen, orange. Otherwise green.

  const initials = entry.displayName
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // D-06: Hover shows name + role
  const roleName = es.rbac.roles[entry.role as keyof typeof es.rbac.roles] ?? entry.role
  const tooltipText = `${entry.displayName} — ${roleName}`

  return (
    <div className="relative group" title={tooltipText}>
      {entry.photoURL ? (
        <img
          src={entry.photoURL}
          alt={entry.displayName}
          className={cn(sizeClasses, 'rounded-full ring-2', ringColor)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={cn(
            sizeClasses,
            'flex items-center justify-center rounded-full ring-2 bg-muted text-xs font-medium',
            ringColor,
          )}
        >
          {initials}
        </div>
      )}
      {entry.status === 'idle' && (
        <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-muted-foreground/50" />
      )}
    </div>
  )
}
```

### Lock Banner Component

```typescript
// src/components/collaboration/LockBanner.tsx
import { Lock } from 'lucide-react'
import { es } from '@/locales/es'

interface LockBannerProps {
  holderName: string
  holderRole: string
  canForceBreak: boolean
  onForceBreak?: () => void
}

export function LockBanner({ holderName, holderRole, canForceBreak, onForceBreak }: LockBannerProps) {
  const roleName = es.rbac.roles[holderRole as keyof typeof es.rbac.roles] ?? holderRole

  return (
    <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-200">
      <Lock className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        {/* D-16: Lock message in Spanish */}
        {es.collaboration.lockMessage(holderName, roleName)}
      </span>
      {canForceBreak && onForceBreak && (
        <button
          onClick={onForceBreak}
          className="text-xs font-medium text-orange-600 underline hover:text-orange-700 dark:text-orange-300"
        >
          {es.collaboration.forceBreak}
        </button>
      )}
    </div>
  )
}
```

### Spanish Locale Additions

```typescript
// Additions to src/locales/es.ts
collaboration: {
  lockMessage: (name: string, role: string) =>
    `Esta seccion esta siendo editada por ${name} (${role}). Puedes ver los datos pero no editarlos hasta que termine.`,
  forceBreak: 'Desbloquear',
  forceBreakConfirmTitle: 'Desbloquear seccion',
  forceBreakConfirmBody: (name: string, role: string) =>
    `${name} (${role}) tiene esta seccion bloqueada. Los cambios no guardados se perderan. ¿Desbloquear?`,
  forceBreakConfirm: 'Desbloquear',
  forceBreakCancel: 'Cancelar',
  forceBreakSuccess: 'Seccion desbloqueada.',
  lockAcquired: 'Seccion bloqueada para edicion.',
  lockReleased: 'Edicion finalizada.',
  lockFailed: 'No se pudo bloquear la seccion. Otro usuario la esta editando.',
  finishEditing: 'Terminar edicion',
  presence: {
    online: 'En linea',
    idle: 'Inactivo',
    viewing: (screen: string) => `Viendo ${screen}`,
    editing: (screen: string) => `Editando ${screen}`,
  },
},
```

### Updated firebase.json

```json
{
  "database": {
    "rules": "database.rules.json"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "nodejs20",
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build",
        "cp -r prompts \"$RESOURCE_DIR/prompts\""
      ]
    }
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firestore-only presence with Cloud Functions sync | RTDB for presence + Firestore for data | Firebase recommendation since 2019, still current | RTDB has `onDisconnect` and `.info/connected` that Firestore lacks. Dual-database is the official pattern. |
| Namespaced `firebase.database()` API | Modular `getDatabase()` from `firebase/database` | Firebase SDK v9 (2021), current in v12 | Tree-shakeable imports. Project already uses modular pattern for all other Firebase services. |
| `firebase.database.ServerValue.TIMESTAMP` | `serverTimestamp()` from `firebase/database` | Firebase SDK v9+ | Modular function call instead of static constant. Same server-side behavior. |
| Custom WebSocket presence | RTDB + `.info/connected` | Always been the Firebase way | No custom infrastructure needed. Firebase maintains the connection. |

**Deprecated/outdated:**
- `firebase.database()` (namespaced): Use `getDatabase(app)` from `firebase/database`
- `firebase.database.ServerValue.TIMESTAMP`: Use `serverTimestamp()` function import
- Firestore-only presence (Cloud Functions workaround): Works but adds latency and complexity. RTDB is purpose-built for this.

## Open Questions

1. **Server Time Offset for Lock Expiry**
   - What we know: RTDB provides `.info/serverTimeOffset` which gives the estimated difference between client time and server time. This can be used to calculate `expiresAt` more accurately.
   - What's unclear: Whether the offset is reliable enough for the 2-minute lock window, or whether to store `acquiredAt` as `serverTimestamp()` and compute expiry server-side.
   - Recommendation: Use `.info/serverTimeOffset` on the client to compute `expiresAt` relative to server time. For a 2-minute window, even a few seconds of drift is acceptable. The `onDisconnect` cleanup is the primary mechanism; `expiresAt` is a secondary safeguard.

2. **Multiple Tab Presence Architecture**
   - What we know: Each browser tab opens its own RTDB connection and its own `onDisconnect` handler. Using `push()` to create per-connection presence nodes avoids one tab's cleanup removing another tab's presence.
   - What's unclear: Whether multi-tab is a real use case for this 2-5 person team tool, or whether we can simplify by assuming one tab per user.
   - Recommendation: Start with single-tab assumption (presence at `presence/{projectId}/{userId}` directly). Add multi-tab support later only if users report the issue. The single-tab approach is simpler and the team size makes multi-tab contention unlikely.

3. **Lock Renewal During Long Edits**
   - What we know: Locks expire after 2 minutes (D-03 disconnect timeout). But a user actively editing for 10 minutes should not lose their lock.
   - What's unclear: Whether to implement a heartbeat that extends `expiresAt` while the user is active, or to rely on `onDisconnect` as the only cleanup mechanism (removing `expiresAt` entirely).
   - Recommendation: Implement a lock renewal heartbeat every 30 seconds that updates `expiresAt` to `now + 120s`. The idle detection hook (Pattern 4) stops the heartbeat when the user goes idle, allowing the lock to expire naturally after the 60-second idle timeout.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (unit) + Playwright 1.58.2 (e2e) |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (e2e) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COLLAB-01 | Two users see each other's Firestore changes in real-time | e2e | `npx playwright test e2e/06-collaboration.spec.ts -g "real-time sync"` | No -- Wave 0 |
| COLLAB-02 | Lock acquired on edit, displayed to other users with holder name | unit + e2e | `npx vitest run src/hooks/__tests__/useSectionLock.test.ts` | No -- Wave 0 |
| COLLAB-03 | Presence avatars show online users and their screens | unit | `npx vitest run src/hooks/__tests__/useProjectPresence.test.ts` | No -- Wave 0 |
| COLLAB-05 | Role check prevents lock acquisition on unauthorized screens | unit | `npx vitest run src/hooks/__tests__/useSectionLock.test.ts -t "role restriction"` | No -- Wave 0 |
| COLLAB-07 | Conflict message displayed when second user tries to edit locked screen | unit | `npx vitest run src/components/collaboration/__tests__/LockBanner.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/useSectionLock.test.ts` -- covers COLLAB-02, COLLAB-05, COLLAB-07 (lock acquire/release/conflict/role check)
- [ ] `src/hooks/__tests__/useProjectPresence.test.ts` -- covers COLLAB-03 (presence data parsing, idle status)
- [ ] `src/hooks/__tests__/useIdleDetection.test.ts` -- covers D-03, D-07 (timer-based idle/lock timeout)
- [ ] `src/components/collaboration/__tests__/LockBanner.test.ts` -- covers COLLAB-07, D-16 (Spanish conflict messages, force-break button visibility)
- [ ] `src/components/collaboration/__tests__/PresenceAvatar.test.ts` -- covers D-06 (ring colors, initials fallback, tooltip)
- [ ] `e2e/06-collaboration.spec.ts` -- covers COLLAB-01 (multi-user real-time data sync -- requires RTDB + Firestore emulators)

Note: RTDB unit tests require mocking `firebase/database` functions (`onValue`, `runTransaction`, `set`, `remove`, `onDisconnect`). The existing test setup with `vitest` and `jsdom` supports this. E2E collaboration tests require both Firestore and RTDB emulators running -- the `firebase.json` must be updated to include RTDB emulator config.

## Sources

### Primary (HIGH confidence)
- [Firebase RTDB Offline Capabilities](https://firebase.google.com/docs/database/web/offline-capabilities) -- `.info/connected`, `onDisconnect()`, `serverTimestamp()`, presence pattern
- [Firebase Presence in Firestore (dual-database pattern)](https://firebase.google.com/docs/firestore/solutions/presence) -- Official recommendation to use RTDB for presence alongside Firestore for data
- [Firebase RTDB Web Setup](https://firebase.google.com/docs/database/web/start) -- `getDatabase()` import, `databaseURL` requirement, emulator setup
- [Firebase RTDB Read/Write](https://firebase.google.com/docs/database/web/read-and-write) -- `set`, `update`, `runTransaction`, `onValue`, `ref` modular API
- [Firebase RTDB Security Rules](https://firebase.google.com/docs/database/security/) -- `.read`, `.write`, `.validate` rule syntax, `auth.uid` usage, `now` server variable for expiry checks
- [Firebase RTDB Emulator Setup](https://firebase.google.com/docs/emulator-suite/connect_rtdb) -- `connectDatabaseEmulator(db, '127.0.0.1', 9000)` connection pattern
- [Firebase Modular SDK Database Reference](https://modularfirebase.web.app/common-use-cases/database/) -- Complete code examples for modular SDK: `getDatabase`, `ref`, `set`, `onValue`, `onDisconnect`, `runTransaction`, `serverTimestamp`, `push`, `child`

### Secondary (MEDIUM confidence)
- [Firebase Blog: Build a Presence System](https://firebase.blog/posts/2013/06/how-to-build-presence-system/) -- Original presence pattern (2013, but pattern is unchanged in current SDK)
- [Modular SDK runTransaction Reference](https://modularfirebase.web.app/reference/database.runtransaction) -- Function signature, TransactionResult type, abort semantics
- npm registry verification: `firebase@12.11.0` (current), bundles `@firebase/database@1.1.2`

### Tertiary (LOW confidence)
- None. All findings verified against official Firebase documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages needed. `firebase/database` is bundled with the installed Firebase SDK. API verified against official modular SDK docs.
- Architecture: HIGH -- dual-database pattern (RTDB for presence/locks, Firestore for data) is Firebase's officially documented architecture for presence. Lock acquisition via `runTransaction()` is the standard atomic compare-and-set pattern.
- Pitfalls: HIGH -- pitfalls derived from official Firebase docs (onDisconnect ordering, multiple tabs, clock skew), codebase analysis (missing databaseURL, auto-save integration, firebase.json), and the CONTEXT.md decisions (lock isolation D-12, role priority D-14).
- Lock design: HIGH -- RTDB security rules using `now` server variable for expiry validation is documented in Firebase rules reference. Admin SDK bypass for force-break is standard Firebase Admin pattern.

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- Firebase RTDB API and presence patterns have not changed significantly in 3+ years)
