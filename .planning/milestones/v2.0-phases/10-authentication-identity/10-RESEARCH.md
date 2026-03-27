# Phase 10: Authentication & Identity - Research

**Researched:** 2026-03-25
**Domain:** Firebase Authentication + React Router auth guards + Firestore data migration
**Confidence:** HIGH

## Summary

Phase 10 adds Firebase Authentication (Google Sign-In) to an existing v1.0 React + Firebase app that was built without any auth. The codebase already uses Firebase SDK v12.11.0 (client) and firebase-admin v13.7.0 / firebase-functions v7.2.2 (server). Firebase Auth is the only auth service needed; all machinery (Google provider, `onAuthStateChanged`, session persistence, `request.auth` in Cloud Functions) ships with the installed SDK. No new packages are required beyond what is already in `package.json`.

The scope is tightly defined: Google Sign-In as sole provider, session persistence across browser restarts (Firebase's default `browserLocalPersistence`), a protected-route guard that prevents any flash of app content, auth validation in all 7 existing Cloud Functions, and a one-time data migration that assigns an `ownerId` to existing v1.0 projects and moves the ERPI singleton under a user-scoped path. Firestore security rules must transition from the current wide-open `allow read, write: if true` to requiring authentication.

**Primary recommendation:** Use Firebase Auth's modular SDK (`getAuth`, `signInWithPopup`, `GoogleAuthProvider`, `onAuthStateChanged` from `firebase/auth`), a Zustand auth store that bridges the Firebase listener to React state with a tri-state (loading/authenticated/unauthenticated), a `<ProtectedRoute>` layout component using React Router's `<Outlet>` and `<Navigate>`, and `request.auth` checks in every Cloud Function.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign in with Google via Firebase Auth | Firebase Auth modular SDK with `signInWithPopup` + `GoogleAuthProvider` -- no new deps needed. SDK v12 already installed. |
| AUTH-02 | User session persists across browser refresh and restores project context | Firebase default persistence is `browserLocalPersistence` (IndexedDB). `onAuthStateChanged` fires on page load with cached user. Zustand store + `activeProjectId` in localStorage covers project context. |
| AUTH-03 | Unauthenticated users redirected to sign-in page, no app content accessible | React Router v7 `<ProtectedRoute>` layout using `<Navigate to="/login">` with tri-state auth store (loading shows spinner, not app content). |
| AUTH-07 | All Cloud Functions validate caller authentication and project membership | `request.auth` is automatically populated in `onCall` v2 functions when client is authenticated. Guard: `if (!request.auth) throw new HttpsError('unauthenticated', ...)`. |
| AUTH-08 | Existing v1.0 projects migrated with ownerId field assigned to first authenticated user | One-time migration Cloud Function or client-side migration: query projects without `ownerId`, batch-update with `{ownerId: currentUser.uid}`. Firestore batch writes limited to 500 ops per batch. |
| AUTH-09 | ERPI settings migrated from global singleton to per-organization path with user ownership | Current path: `erpi_settings/default`. New path: `erpi_settings/{uid}`. Migration copies existing doc to user-scoped path. Both frontend service (`src/services/erpi.ts`) and backend orchestrator (`functions/src/pipeline/orchestrator.ts`) read this path and must be updated. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | 12.11.0 | Client SDK -- `firebase/auth` module | Already in package.json. Provides `getAuth`, `signInWithPopup`, `GoogleAuthProvider`, `onAuthStateChanged`, `signOut`, `setPersistence` |
| firebase-admin | 13.7.0 | Server SDK -- auth verification in Cloud Functions | Already in functions/package.json. `request.auth` auto-populated in `onCall` v2 |
| firebase-functions | 7.2.2 | Cloud Functions v2 with `onCall` | Already in functions/package.json. `request.auth.uid` available on every call |
| react-router | 7.13.1 | Client routing with `Navigate`, `Outlet` for auth guards | Already in package.json. Supports layout routes for protected route pattern |
| zustand | 5.0.12 | Auth state store (user, loading, error) | Already in package.json. Project already uses Zustand for `appStore` and `wizardStore` |
| @tanstack/react-query | 5.94.5 | Data fetching with auth-aware queries | Already in package.json. `queryClient.clear()` on sign-out to reset all cached data |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications for auth errors | Sign-in failures, session expiry, migration confirmation |
| zod | 4.3.6 | Schema validation for migrated data | Validate ERPI settings shape during migration |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand auth store | React Context + useReducer | Zustand is already the project's state management choice; adding a Context for auth alone creates inconsistency |
| `signInWithPopup` | `signInWithRedirect` | Popup is officially recommended by Firebase due to third-party cookie deprecation in Safari/Firefox/Chrome. Redirect requires additional configuration (custom authDomain on Firebase Hosting) |
| Client-side migration | Admin SDK migration script | Client-side is simpler (runs on first login, no separate deployment), but must handle race conditions if two users log in simultaneously |

**Installation:** No new packages needed. All required functionality ships with the existing dependencies.

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    firebase.ts          # Add getAuth + Auth export + emulator connect
  stores/
    authStore.ts         # NEW -- Zustand store for auth state
    appStore.ts          # Existing -- add uid-awareness
  components/
    auth/
      LoginPage.tsx      # NEW -- Google sign-in button (Spanish UI)
      ProtectedRoute.tsx # NEW -- Layout route guard
      AuthInitializer.tsx# NEW -- Bridge Firebase listener to Zustand
    layout/
      AppHeader.tsx      # MODIFY -- Add user avatar + sign-out button
  services/
    projects.ts          # MODIFY -- Add ownerId to create/list, uid-scoped queries
    erpi.ts              # MODIFY -- Change path from global to user-scoped
    migration.ts         # NEW -- One-time v1.0 data migration logic
functions/
  src/
    middleware/
      requireAuth.ts     # NEW -- Shared auth guard for Cloud Functions
    index.ts             # MODIFY -- Add auth checks to all 7 functions
    pipeline/
      orchestrator.ts    # MODIFY -- Read ERPI from user-scoped path
firestore.rules          # REWRITE -- From open to auth-required
storage.rules            # REWRITE -- From open to auth-required
```

### Pattern 1: Zustand Auth Store with Firebase Listener Bridge

**What:** A Zustand store holds auth state (user, loading, initialized). A React component (`AuthInitializer`) subscribes to `onAuthStateChanged` and pushes state into the store. This bridges Firebase's event-driven auth to Zustand's synchronous state.

**When to use:** On app initialization, before any route rendering.

**Example:**
```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import type { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean         // true until first onAuthStateChanged fires
  initialized: boolean     // false until first callback
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user, loading: false, initialized: true }),
  setLoading: (loading) => set({ loading }),
}))
```

```typescript
// src/components/auth/AuthInitializer.tsx
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return unsubscribe
  }, [setUser])

  return <>{children}</>
}
```

### Pattern 2: Protected Route as Layout Route

**What:** A layout component checks auth state from Zustand store. During loading, renders a full-screen spinner (no app content visible). When unauthenticated, redirects to `/login`. When authenticated, renders `<Outlet />`.

**When to use:** Wraps all routes except `/login`.

**Example:**
```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute() {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground">Cargando...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
```

```typescript
// In App.tsx
<BrowserRouter>
  <AuthInitializer>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppHeader />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/project/:projectId" element={<WizardShell />} />
          <Route path="/project/:projectId/:screen" element={<WizardShell />} />
          <Route path="/erpi" element={<ERPISettingsPage />} />
        </Route>
      </Route>
    </Routes>
  </AuthInitializer>
</BrowserRouter>
```

Note: `AppHeader` must be converted from a wrapper component to a layout route (render `<Outlet />` instead of `{children}`).

### Pattern 3: Cloud Function Auth Guard

**What:** A reusable helper that extracts and validates `request.auth` in `onCall` v2 functions.

**When to use:** First line of every Cloud Function handler.

**Example:**
```typescript
// functions/src/middleware/requireAuth.ts
import { HttpsError } from 'firebase-functions/v2/https'
import type { CallableRequest } from 'firebase-functions/v2/https'

export function requireAuth(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Debes iniciar sesion para realizar esta accion.'
    )
  }
  return request.auth.uid
}
```

```typescript
// In each Cloud Function:
export const extractScreenplay = onCall(
  { /* options */ },
  async (request) => {
    const uid = requireAuth(request)
    // ... rest of function
  }
)
```

### Pattern 4: One-Time Data Migration

**What:** When the first user signs in after the v2.0 deployment, existing projects without an `ownerId` are claimed by that user. This runs client-side on login detection.

**When to use:** Once, during the v1.0-to-v2.0 transition.

**Example:**
```typescript
// src/services/migration.ts
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function migrateOrphanedProjects(uid: string): Promise<number> {
  // Query projects that have no ownerId field
  const q = query(collection(db, 'projects'), where('ownerId', '==', null))
  // Note: Firestore cannot query for "field does not exist"
  // Alternative: query ALL projects and filter client-side
  const allProjects = await getDocs(collection(db, 'projects'))
  const orphaned = allProjects.docs.filter((d) => !d.data().ownerId)

  if (orphaned.length === 0) return 0

  // Batch update (max 500 per batch)
  const batch = writeBatch(db)
  for (const snap of orphaned) {
    batch.update(doc(db, 'projects', snap.id), { ownerId: uid })
  }
  await batch.commit()
  return orphaned.length
}
```

### Pattern 5: ERPI Settings Path Migration

**What:** The ERPI singleton at `erpi_settings/default` must be copied to a user-scoped path `erpi_settings/{uid}`. Both frontend and backend code must read from the new path.

**When to use:** Part of the one-time migration flow.

**Frontend change (erpi.ts):**
```typescript
// Before: const erpiRef = doc(db, 'erpi_settings', 'default')
// After:
export function getErpiRef(uid: string) {
  return doc(db, 'erpi_settings', uid)
}
```

**Backend change (orchestrator.ts line 146):**
```typescript
// Before: db.collection('erpi_settings').doc('default').get()
// After: Need to know the project owner's uid to read their ERPI settings
// Option: Store ownerId on the project document, read it, then fetch erpi_settings/{ownerId}
```

### Anti-Patterns to Avoid

- **Wrapping auth in React Context alongside Zustand:** The project already uses Zustand for state. Adding a separate React Context for auth creates two state systems. Use Zustand consistently.
- **Checking auth in each page component:** Auth checks belong in the route guard, not scattered across individual pages. Each page should assume it is authenticated.
- **Using `signInWithRedirect`:** Firebase officially recommends `signInWithPopup` due to third-party cookie deprecation in Safari, Firefox, and Chrome 115+. Redirect flow requires additional configuration (custom authDomain) that adds deployment complexity.
- **Deploying security rules before migration:** If Firestore rules require `ownerId == request.auth.uid` but existing documents lack `ownerId`, all reads fail. Migration must happen before (or simultaneously with) rule deployment.
- **Querying for field non-existence:** Firestore cannot efficiently query `where('ownerId', '==', null)` if the field literally does not exist on the document. The migration must either read all docs and filter client-side, or use a Cloud Function with Admin SDK (bypasses rules).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence | Custom token storage in localStorage/cookies | Firebase Auth's default `browserLocalPersistence` | Firebase handles IndexedDB storage, token refresh, and cross-tab sync automatically |
| Auth token passing to Cloud Functions | Manual `Authorization` header on httpsCallable | Firebase SDK auto-attaches ID token to `onCall` requests | The Firebase client SDK (httpsCallable) automatically includes the current user's ID token. No manual headers needed |
| Token refresh | Custom refresh timer | Firebase Auth SDK automatic token refresh | Firebase refreshes the ID token every ~55 minutes automatically |
| Popup/redirect flow | Custom OAuth window management | `signInWithPopup(auth, provider)` | Firebase handles the full OAuth flow, token exchange, and error handling |
| Auth state detection | Polling Firebase for user state | `onAuthStateChanged` listener | Event-driven, fires immediately on page load with cached state, handles token expiry |
| Emulator connection | Manual environment switching | `connectAuthEmulator(auth, "http://127.0.0.1:9099")` behind `import.meta.env.DEV` | Firebase's emulator connector handles all protocol differences |

**Key insight:** Firebase Auth is a turnkey solution for this use case. Google Sign-In with `onCall` Cloud Functions is the exact use case Firebase was designed for. The SDK handles token lifecycle, persistence, and server-side validation with zero custom code.

## Common Pitfalls

### Pitfall 1: Flash of App Content Before Auth Check

**What goes wrong:** On page load, `onAuthStateChanged` has not fired yet. If routes render immediately, unauthenticated users see a flash of dashboard content before being redirected to login.
**Why it happens:** `onAuthStateChanged` is asynchronous. The first callback fires after Firebase checks IndexedDB for a cached session, which takes milliseconds but is not synchronous.
**How to avoid:** The auth store must have a `loading: true` initial state. The `ProtectedRoute` must render a loading spinner (not app content) while `loading` is true. Only render app content or redirect after `initialized` becomes true.
**Warning signs:** Brief flash of dashboard on page load when not logged in. Tests pass locally but fail on slow connections.

### Pitfall 2: Security Rules Deployed Before Data Migration

**What goes wrong:** New Firestore rules require `ownerId == request.auth.uid` for reads. But existing v1.0 projects have no `ownerId` field. All project reads fail, the app breaks.
**Why it happens:** Rules and migration are deployed as separate steps.
**How to avoid:** Use a phased rule deployment: (1) Deploy rules that allow authenticated reads to all projects (no `ownerId` check yet), (2) Run migration to add `ownerId`, (3) Deploy final rules with `ownerId` check. Or: run migration as Admin SDK script (bypasses rules) before deploying strict rules.
**Warning signs:** "Permission denied" errors on existing projects immediately after deploying auth.

### Pitfall 3: ERPI Singleton Not Migrated in Both Frontend and Backend

**What goes wrong:** Frontend reads ERPI from new user-scoped path, but Cloud Functions still read from `erpi_settings/default`. Or vice versa. Documents generate with empty ERPI data.
**Why it happens:** The ERPI settings path appears in two independent codebases: `src/services/erpi.ts` (frontend) and `functions/src/pipeline/orchestrator.ts` (backend, line 146).
**How to avoid:** Both paths must be updated in the same deployment. The orchestrator needs the project's owner UID to know which ERPI settings to read. Add `ownerId` to the project document, then read `erpi_settings/{ownerId}` in the orchestrator.
**Warning signs:** Document generation succeeds but ERPI fields are blank. Validation passes for ERPI on frontend but generated documents lack ERPI data.

### Pitfall 4: signInWithPopup Blocked by Browser

**What goes wrong:** Some browsers or enterprise environments block popups. The sign-in button does nothing or shows a blocked-popup icon.
**Why it happens:** Popup blockers are common, especially on first interaction if the popup is not triggered by a direct user click.
**How to avoid:** Call `signInWithPopup` directly inside a click handler (not inside a Promise chain or setTimeout). Wrap in try/catch and show a Spanish error toast: "No se pudo abrir la ventana de inicio de sesion. Verifica que las ventanas emergentes esten habilitadas."
**Warning signs:** Sign-in works in development (no popup blocker) but fails for some users in production.

### Pitfall 5: Cloud Function Auth Check Missing on One Function

**What goes wrong:** Six of seven functions are secured, but one is missed. An unauthenticated user can call that function directly.
**Why it happens:** The auth guard is added manually to each function rather than being structurally enforced.
**How to avoid:** Create a `requireAuth` helper and add it as the first line of every function. Use a checklist of all 7 functions: `extractScreenplay`, `analyzeScreenplay`, `runLineProducerPass`, `runFinanceAdvisorPass`, `runLegalPass`, `runCombinedPass`, `estimateScore`.
**Warning signs:** Security review finds one function without auth check. Automated test calls function without auth token and gets a success response.

### Pitfall 6: Orphaned Project Race Condition

**What goes wrong:** Two users sign in simultaneously as the "first" user. Both see orphaned projects and both try to claim them. One user ends up with projects they should not own.
**Why it happens:** Client-side migration reads all orphaned projects and batch-updates them without a transaction lock.
**How to avoid:** Use a Firestore transaction or a Cloud Function (Admin SDK) to claim orphaned projects atomically. Or: accept that for this internal tool with ~1-3 users at Lemon Studios, the race condition is extremely unlikely and add a manual override for the rare case.
**Warning signs:** Both team members see v1.0 projects after migration, but only one should.

### Pitfall 7: CLAUDE.md Auth Directive Conflict

**What goes wrong:** The STATE.md notes that CLAUDE.md contains a directive "Never add Firebase Auth" (a v1.0 constraint). If not removed before implementation, AI tools refuse to generate auth code.
**Why it happens:** v1.0 CLAUDE.md was written when auth was out of scope. Now it is in scope.
**How to avoid:** Update CLAUDE.md to remove the anti-auth directive as the very first task of Phase 10. The STATE.md already flags this: "[Research]: CLAUDE.md 'Never add Firebase Auth' directive will cause AI refusal if not updated early in Phase 10."
**Warning signs:** Claude Code refuses to generate auth-related code, citing CLAUDE.md instructions.

## Code Examples

### Firebase Auth Initialization (Modular SDK)

```typescript
// src/lib/firebase.ts (updated)
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'us-central1')

// Emulator connections for local development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099')
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}
```

### Google Sign-In with signInWithPopup

```typescript
// src/components/auth/LoginPage.tsx (sign-in handler)
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toast } from 'sonner'

const provider = new GoogleAuthProvider()

async function handleGoogleSignIn() {
  try {
    await signInWithPopup(auth, provider)
    // onAuthStateChanged will handle state update via Zustand
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    if (firebaseError.code === 'auth/popup-blocked') {
      toast.error('Ventanas emergentes bloqueadas. Habilitalas e intenta de nuevo.')
    } else if (firebaseError.code === 'auth/popup-closed-by-user') {
      // User closed popup -- no error toast needed
    } else {
      toast.error('Error al iniciar sesion. Intenta de nuevo.')
    }
  }
}
```

### Sign Out

```typescript
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

async function handleSignOut() {
  await signOut(auth)
  // onAuthStateChanged will set user to null
  // React Query cache should be cleared:
  queryClient.clear()
}
```

### Firestore Security Rules (Phased)

```
// Phase 1 (deploy with auth but before migration):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all operations
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
    }
    match /projects/{projectId}/{sub=**} {
      allow read, write: if request.auth != null;
    }
    match /erpi_settings/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}

// Phase 2 (deploy after migration adds ownerId):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid;
    }
    match /projects/{projectId}/{sub=**} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId == request.auth.uid;
    }
    match /erpi_settings/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

### Uid-Scoped Project Listing

```typescript
// src/services/projects.ts (modified listProjects)
import { query, where, orderBy } from 'firebase/firestore'

export async function listProjects(uid: string) {
  const q = query(
    collection(db, 'projects'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    metadata: d.data().metadata as ProjectMetadata,
    createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
  }))
}
```

Note: This query requires a Firestore composite index on `(ownerId ASC, createdAt DESC)`. Firebase will auto-suggest the index URL in the console error message when the query first runs.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `signInWithRedirect` for OAuth | `signInWithPopup` preferred | 2024 (Chrome 115+, Safari 16.1+, Firefox 109+) | Third-party cookie deprecation breaks redirect flow without custom authDomain. Popup is simpler and more reliable. |
| `firebase.auth()` namespace | `getAuth(app)` modular import | Firebase SDK v9 (2021) | Tree-shakeable imports. This project already uses modular imports for all other Firebase services. |
| `auth.setPersistence()` before sign-in | Default `browserLocalPersistence` is sufficient | Firebase SDK v9+ | Default persistence stores in IndexedDB, survives browser restarts. No explicit `setPersistence` call needed for the default behavior. |
| `firebase-functions` v1 `functions.https.onCall` | v2 `onCall` from `firebase-functions/v2/https` | firebase-functions v4+ | This project already uses v2 syntax. `request.auth` works identically in v2. |

**Deprecated/outdated:**
- `firebase.auth()` (namespaced SDK): The project uses modular SDK. Do not use namespaced imports.
- `signInWithRedirect` without custom authDomain: Broken on Safari/Firefox/Chrome without extra config. Use `signInWithPopup` instead.

## Open Questions

1. **Composite Index for ownerId + createdAt**
   - What we know: Firestore requires a composite index for queries with `where` + `orderBy` on different fields. The `(ownerId, createdAt)` query will need one.
   - What's unclear: Whether the auto-generated index link from the console error is sufficient or if it should be declared in `firestore.indexes.json` proactively.
   - Recommendation: Add the index to `firestore.indexes.json` proactively to avoid a runtime error on first deploy. Firebase CLI can generate this.

2. **ERPI Migration Path in Cloud Functions**
   - What we know: The orchestrator currently reads `erpi_settings/default`. After migration, it needs to read `erpi_settings/{ownerId}`. The orchestrator needs the project owner's UID.
   - What's unclear: Whether to pass `uid` from the client via `request.data`, read it from `request.auth.uid`, or look up `ownerId` from the project document.
   - Recommendation: Use `request.auth.uid` directly since the calling user IS the project owner in the current single-role model. For Phase 11 (RBAC), this may need to change to reading `ownerId` from the project document.

3. **Migration Atomicity**
   - What we know: For this internal tool with 1-3 users, the race condition risk is extremely low.
   - What's unclear: Whether to invest in a transactional Cloud Function migration or accept the simpler client-side approach.
   - Recommendation: Use client-side migration for simplicity. Add a `migrationVersion` field to each project to prevent double-migration. The ~3-project scale does not warrant a Cloud Function.

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
| AUTH-01 | Google sign-in creates Firebase user | unit (mock) | `npx vitest run src/stores/__tests__/authStore.test.ts -t "sign-in"` | No -- Wave 0 |
| AUTH-02 | Session persists across refresh | e2e | `npx playwright test e2e/05-auth.spec.ts -g "session persist"` | No -- Wave 0 |
| AUTH-03 | Unauthenticated redirect, no content flash | e2e | `npx playwright test e2e/05-auth.spec.ts -g "redirect"` | No -- Wave 0 |
| AUTH-07 | Cloud Functions reject unauthenticated calls | unit | `npx vitest run src/__tests__/functions/authGuard.test.ts` | No -- Wave 0 |
| AUTH-08 | Orphaned projects assigned ownerId | unit | `npx vitest run src/services/__tests__/migration.test.ts` | No -- Wave 0 |
| AUTH-09 | ERPI path migration | unit | `npx vitest run src/services/__tests__/erpiMigration.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/__tests__/authStore.test.ts` -- covers AUTH-01, AUTH-02 (Zustand store behavior)
- [ ] `e2e/05-auth.spec.ts` -- covers AUTH-02, AUTH-03 (e2e login flow, redirect, session persistence)
- [ ] `src/__tests__/functions/authGuard.test.ts` -- covers AUTH-07 (requireAuth helper unit tests)
- [ ] `src/services/__tests__/migration.test.ts` -- covers AUTH-08 (orphaned project migration logic)
- [ ] `src/services/__tests__/erpiMigration.test.ts` -- covers AUTH-09 (ERPI singleton to user-scoped path)

Note: E2E auth tests require Firebase Auth Emulator running. The existing `playwright.config.ts` points to `localhost:5174` with `locale: 'es-MX'`. Auth emulator will need to be started alongside the dev server.

## Sources

### Primary (HIGH confidence)
- Firebase Auth official docs: [Get Started with Firebase Authentication on Websites](https://firebase.google.com/docs/auth/web/start) -- modular SDK imports, `onAuthStateChanged`, `signInWithPopup`
- Firebase Auth official docs: [Authentication State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) -- `browserLocalPersistence` default, IndexedDB storage
- Firebase Auth official docs: [Authenticate Using Google with JavaScript](https://firebase.google.com/docs/auth/web/google-signin) -- GoogleAuthProvider, popup flow
- Firebase Cloud Functions docs: [Call functions from your app](https://firebase.google.com/docs/functions/callable) -- `request.auth` in onCall v2, automatic token passing
- Firebase Security Rules docs: [Writing conditions for Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions) -- `request.auth.uid` patterns
- Firebase official docs: [Best practices for using signInWithRedirect](https://firebase.google.com/docs/auth/web/redirect-best-practices) -- popup recommended over redirect due to third-party cookie deprecation
- Firebase Emulator Suite docs: [Connect your app to the Authentication Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth) -- `connectAuthEmulator` setup

### Secondary (MEDIUM confidence)
- [Building Reliable Protected Routes with React Router v7](https://dev.to/ra1nbow1/building-reliable-protected-routes-with-react-router-v7-1ka0) -- ProtectedRoute pattern with loading state, `Navigate` + `Outlet`
- [React Router 7: Private Routes](https://www.robinwieruch.de/react-router-private-routes/) -- layout route guard pattern
- [Zustand + Firebase Auth discussion](https://github.com/pmndrs/zustand/discussions/1450) -- async Zustand actions with Firebase auth
- [How to Use Firestore Batch Writes](https://oneuptime.com/blog/post/2026-02-17-how-to-use-firestore-batch-writes-to-update-multiple-documents-atomically/view) -- 500-operation batch limit for migration

### Tertiary (LOW confidence)
- None. All findings verified against official Firebase documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified against npm registry. No new packages needed.
- Architecture: HIGH -- patterns verified against official Firebase docs and React Router v7 docs. Auth guard pattern is well-established.
- Pitfalls: HIGH -- pitfalls documented from official Firebase known issues (popup blockers, redirect deprecation, third-party cookies) and direct codebase analysis (ERPI dual-path, CLAUDE.md directive, migration ordering).
- Migration: MEDIUM -- the ERPI path migration involves coordinated changes across frontend and backend; the exact orchestrator change depends on how UID is passed to generation functions (Open Question #2).

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- Firebase Auth API has not changed significantly in 2+ years)
