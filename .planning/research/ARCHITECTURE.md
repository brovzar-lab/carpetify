# Architecture Patterns: v2.0 Integration

**Domain:** Multi-user collaborative legal compliance tool (EFICINE dossier generation)
**Researched:** 2026-03-25
**Focus:** How auth/RBAC, collaboration, co-production engine, AI review, and modality routing integrate with existing Firebase/React architecture

---

## Current Architecture Snapshot

Before prescribing changes, here is what exists:

```
Browser (React SPA)
  |
  +-- Zustand stores: appStore (activeProjectId), wizardStore (activeScreen)
  +-- React Query: server state cache (1min staleTime)
  +-- useAutoSave hook: 1500ms debounce writes to Firestore
  +-- useValidation hook: 10 real-time onSnapshot listeners per project
  +-- useGeneratedDocs hook: real-time listener on generated/ subcollection
  +-- Services layer: projects.ts, erpi.ts, storage.ts, generation.ts
  |
  v
Firebase (No Auth)
  +-- Firestore: projects/{id}, projects/{id}/team, /financials, /screenplay, /generated, /documents, /meta
  +-- Firestore: erpi_settings/default (singleton)
  +-- Storage: screenplay PDFs
  +-- Cloud Functions v2: 7 callables (extract, analyze, 4 pipeline passes, scoreEstimate)
  +-- Security rules: allow read, write: if true (wide open)
```

**Key architectural facts from codebase inspection:**
- `firebase.ts` initializes Firestore, Storage, Functions -- NO Auth import
- `projects.ts` creates documents with no owner/user field
- `erpi_settings/default` is a singleton shared across all projects
- Cloud Functions access `request.data` but never check `request.auth`
- All Firestore security rules are `allow read, write: if true`
- `useAutoSave` writes directly to `projects/{projectId}/{path}/data` with no user context
- `useValidation` opens 10+ real-time Firestore listeners per project session

---

## Recommended v2.0 Architecture

```
Browser (React SPA)
  |
  +-- NEW: AuthProvider (React Context) wrapping App
  |     +-- onAuthStateChanged + onIdTokenChanged listeners
  |     +-- Exposes: user, role, loading, signIn, signOut
  |     +-- Claims: { role: 'producer' | 'line_producer' | 'lawyer' | 'director' }
  |
  +-- NEW: ProtectedRoute wrapper (redirects to /login if !user)
  +-- NEW: RoleGate component (hides/disables UI based on role)
  |
  +-- MODIFIED: Zustand stores add currentUserId
  +-- EXISTING: React Query (unchanged, but query keys include userId for cache isolation)
  +-- MODIFIED: useAutoSave adds updatedBy: userId to every write
  +-- NEW: usePresence hook (lightweight Firestore presence for active editors)
  +-- EXISTING: useValidation (unchanged -- validation is data-driven, auth-agnostic)
  +-- MODIFIED: Services layer adds auth token forwarding to Cloud Functions
  |
  v
Firebase (WITH Auth)
  +-- Auth: Google provider, custom claims for roles
  +-- Firestore: SAME data model + owner/collaborators fields on project docs
  +--   NEW: projects/{id}/history subcollection (version snapshots)
  +--   NEW: projects/{id}/presence subcollection (active editors)
  +--   MODIFIED: erpi_settings keyed by orgId, not singleton
  +-- Storage: SAME + auth-gated paths
  +-- Cloud Functions v2: MODIFIED to check request.auth on all callables
  +-- Security rules: REWRITTEN with proper RBAC rules
```

---

## Component-by-Component Integration Plan

### 1. Firebase Auth + Google Sign-In

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/firebase.ts` | MODIFY | Add `getAuth(app)` export |
| `src/contexts/AuthContext.tsx` | CREATE | React context with `onAuthStateChanged`, user state, role from custom claims |
| `src/components/auth/LoginPage.tsx` | CREATE | Google sign-in button, Spanish UI |
| `src/components/auth/ProtectedRoute.tsx` | CREATE | Wraps routes, redirects to `/login` |
| `src/main.tsx` | MODIFY | Wrap `App` with `AuthProvider` |
| `src/App.tsx` | MODIFY | Add `/login` route, wrap other routes with `ProtectedRoute` |
| `functions/src/auth/` | CREATE | `setCustomClaims` callable, `onUserCreate` trigger |
| `functions/src/index.ts` | MODIFY | Add auth check to ALL existing callables |

**Auth Context pattern (HIGH confidence -- Firebase official docs):**

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

// Uses onIdTokenChanged (not onAuthStateChanged) to catch custom claims updates
// Role extracted from user.getIdTokenResult().claims.role
```

**Custom claims flow:**
1. User signs in with Google (first time)
2. `onUserCreate` Cloud Function trigger fires
3. Admin checks if email is in allowlist (Lemon Studios domain)
4. Sets default role via `admin.auth().setCustomClaims(uid, { role: 'viewer' })`
5. Producer manually promotes roles via admin UI or a `setRole` callable function
6. Client calls `user.getIdTokenResult(true)` to refresh claims after role change

**Why custom claims over document-based roles:** Custom claims are embedded in the auth token, so Firestore security rules can read `request.auth.token.role` without an additional document read. Since Firestore allows only 10 document reads per rule evaluation, this is critical for the 10+ listeners in useValidation.

### 2. Firestore Security Rules (RBAC)

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `firestore.rules` | REWRITE | From wide-open to proper RBAC |
| `storage.rules` | REWRITE | Gate file access to project collaborators |

**Recommended rules structure:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: is the user authenticated?
    function isAuth() {
      return request.auth != null;
    }

    // Helper: get user role from custom claims
    function userRole() {
      return request.auth.token.role;
    }

    // Helper: is user a collaborator on this project?
    function isCollaborator(projectId) {
      return isAuth() &&
        request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.collaborators;
    }

    // Helper: is user the project owner?
    function isOwner(projectId) {
      return isAuth() &&
        get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId == request.auth.uid;
    }

    // Projects: owner + collaborators can read/write
    match /projects/{projectId} {
      allow read: if isCollaborator(projectId) || isOwner(projectId);
      allow create: if isAuth() && userRole() == 'producer';
      allow update: if isCollaborator(projectId) || isOwner(projectId);
      allow delete: if isOwner(projectId);

      // All subcollections inherit project-level access
      match /{subcollection}/{docId} {
        allow read: if isCollaborator(projectId) || isOwner(projectId);
        allow write: if isCollaborator(projectId) || isOwner(projectId);
      }
    }

    // ERPI settings: scoped to organization, not singleton
    match /organizations/{orgId}/erpi_settings/{settingsId} {
      allow read, write: if isAuth() &&
        request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)).data.members;
    }

    // User profiles
    match /users/{userId} {
      allow read: if isAuth();
      allow write: if request.auth.uid == userId;
    }
  }
}
```

**Critical migration concern:** The current `erpi_settings/default` singleton must migrate to `organizations/{orgId}/erpi_settings/default`. This is a data model change that affects `src/services/erpi.ts`, `functions/src/pipeline/orchestrator.ts` (reads ERPI settings), and the `ERPISettingsPage` component.

### 3. Role-Based Access Control (Section-Level Collaboration)

**Roles and their section access:**

| Role | Wizard Screens | Actions |
|------|---------------|---------|
| `producer` | All screens | Full CRUD, manage collaborators, run pipeline, export |
| `line_producer` | `datos`, `equipo`, `financiera`, `generacion` | Edit intake data, run generation passes |
| `lawyer` | `documentos`, `financiera` | Edit legal documents, upload contracts, view financials |
| `director` | `guion`, `equipo` | View screenplay analysis, edit creative team data |
| `viewer` | All screens (read-only) | View only, no edits |

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/permissions.ts` | CREATE | `ROLE_PERMISSIONS` map, `canEdit(role, screen)`, `canRunPipeline(role)` |
| `src/components/common/RoleGate.tsx` | CREATE | Conditional render based on role + screen |
| `src/components/wizard/WizardShell.tsx` | MODIFY | Wrap edit controls with `RoleGate` |
| `src/hooks/useAutoSave.ts` | MODIFY | Check `canEdit()` before saving, add `updatedBy` field |
| `src/stores/appStore.ts` | MODIFY | Add `currentUserId`, `currentUserRole` |
| Project Firestore document | MODIFY | Add `ownerId`, `collaborators: { [uid]: role }` map |

**Permission model (client-side + server-side):**

```typescript
// src/lib/permissions.ts
export type UserRole = 'producer' | 'line_producer' | 'lawyer' | 'director' | 'viewer'

export const ROLE_PERMISSIONS: Record<UserRole, {
  screens: WizardScreen[]
  canRunPipeline: boolean
  canExport: boolean
  canManageCollaborators: boolean
  canDelete: boolean
}> = {
  producer: {
    screens: ['datos', 'guion', 'equipo', 'financiera', 'documentos', 'generacion', 'validacion', 'exportar'],
    canRunPipeline: true, canExport: true, canManageCollaborators: true, canDelete: true,
  },
  line_producer: {
    screens: ['datos', 'equipo', 'financiera', 'generacion'],
    canRunPipeline: true, canExport: false, canManageCollaborators: false, canDelete: false,
  },
  lawyer: {
    screens: ['documentos', 'financiera'],
    canRunPipeline: false, canExport: false, canManageCollaborators: false, canDelete: false,
  },
  director: {
    screens: ['guion', 'equipo'],
    canRunPipeline: false, canExport: false, canManageCollaborators: false, canDelete: false,
  },
  viewer: {
    screens: [],
    canRunPipeline: false, canExport: false, canManageCollaborators: false, canDelete: false,
  },
}
```

**Important: Firestore rules enforce the real security.** Client-side RoleGate is UX only. The security rules check `collaborators[request.auth.uid]` and the custom claim `role` for write operations. This dual enforcement is essential -- UI gating alone is not security.

### 4. Real-Time Collaboration (Presence + Section Locking)

**Problem:** Multiple users editing the same project simultaneously. Firestore does not have native section-level locking.

**Solution:** Lightweight presence tracking + optimistic concurrency (last-write-wins with conflict indicators). Full OT/CRDT is massive overkill for form-based data entry.

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/usePresence.ts` | CREATE | Write/listen to `projects/{id}/presence/{uid}` |
| `src/components/common/ActiveEditors.tsx` | CREATE | Avatar badges showing who is on which screen |
| `src/hooks/useAutoSave.ts` | MODIFY | Add `updatedBy`, `updatedAt` fields to detect external changes |
| `src/components/common/ConflictBanner.tsx` | CREATE | "Data changed by [user]" notification |

**Presence data model:**

```
projects/{projectId}/presence/{userId}
{
  displayName: string
  photoURL: string
  activeScreen: WizardScreen
  lastSeen: Timestamp  // Firestore TTL or manual cleanup
}
```

**Concurrency strategy:**
- Each `useAutoSave` write includes `updatedBy: userId` and `updatedAt: serverTimestamp()`
- When `onSnapshot` fires and `updatedBy !== currentUserId`, show a non-blocking toast: "Datos actualizados por [name]"
- For form fields, Firestore merge semantics handle field-level updates naturally -- two users editing different fields on the same screen will not overwrite each other
- For the same field edited by two users, last-write-wins is acceptable for this use case (form data, not prose editing)
- Presence documents use Firestore TTL (set `expireAt` field to 5 minutes from now, re-heartbeat every 60 seconds)

**Why NOT real-time collaborative editing (Google Docs style):** The wizard screens are structured forms, not free-text documents. Users fill in discrete fields (project title, budget amounts, team member data). Firestore's merge writes already handle this gracefully. Building OT/CRDT would cost 10x the effort for negligible benefit.

### 5. Co-Production Accounting Engine

**Problem:** International co-productions require multi-currency budget splits, exchange rate tracking, and IMCINE territorial participation rules.

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `src/schemas/coproduction.ts` | CREATE | Zod schemas for co-production partners, currency amounts, exchange rates |
| `src/lib/currency.ts` | CREATE | Multi-currency arithmetic (all in minor units), conversion functions |
| `src/lib/constants.ts` | MODIFY | Add supported currencies, exchange rate source URL |
| `src/hooks/useCoproduction.ts` | CREATE | Derived calculations: territorial splits, participation percentages |
| `src/components/wizard/CoproductionPanel.tsx` | CREATE | New panel within FinancialStructure screen |
| `functions/src/pipeline/orchestrator.ts` | MODIFY | Include co-production data in `ProjectDataForGeneration` |
| `functions/src/pipeline/passes/financeAdvisor.ts` | MODIFY | Generate co-production split tables |
| `prompts/` | MODIFY | Add co-production context variables to finance/budget prompts |

**Currency architecture (integer arithmetic, consistent with existing centavos pattern):**

```typescript
// src/lib/currency.ts
export interface MoneyAmount {
  amountMinorUnits: number    // integer: centavos (MXN), cents (USD), etc.
  currencyCode: 'MXN' | 'USD' | 'EUR' | 'CAD'
  minorUnitScale: number      // 100 for most currencies
}

export interface ExchangeRate {
  from: string
  to: 'MXN'           // Always convert TO MXN (IMCINE requires MXN budget)
  rate: number         // e.g. 17.2534 (stored as float -- this is a rate, not money)
  date: string         // ISO date of rate
  source: string       // 'banxico' | 'manual'
}

// Convert foreign currency to MXN centavos
export function toMXNCentavos(amount: MoneyAmount, rate: ExchangeRate): number {
  const baseUnits = amount.amountMinorUnits / amount.minorUnitScale
  const mxn = baseUnits * rate.rate
  return Math.round(mxn * 100) // MXN centavos
}
```

**Critical rule:** Exchange rates are stored as floating-point numbers because they ARE rates, not monetary values. The conversion result is immediately rounded to integer centavos. This is consistent with the existing `tipo_cambio_fx` field already in the project schema.

**Co-production Firestore data model:**

```
projects/{projectId}/coproduction/data
{
  partners: [
    {
      nombre: string,
      pais: string,
      participacion_porcentaje: number,  // integer 0-100
      aportacion_efectivo_minor_units: number,
      aportacion_especie_minor_units: number,
      currency_code: string,
      es_empresa_mexicana: boolean,
    }
  ],
  exchange_rates: [
    { from: 'USD', to: 'MXN', rate: 17.25, date: '2026-03-15', source: 'banxico' }
  ],
  territorial_split: {
    gasto_nacional_centavos: number,    // MXN spent in Mexico
    gasto_extranjero_centavos: number,  // Converted to MXN
    participacion_mexicana_pct: number, // Must meet IMCINE minimums
  }
}
```

### 6. AI Pre-Submission Review (Evaluator Simulation)

**Problem:** Before export, simulate how an IMCINE evaluator would score the carpeta. Different from the existing `estimateScore` function which scores individual artistic merit -- this reviews the entire dossier for completeness, coherence, and compliance.

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `prompts/revision_pre_envio.md` | CREATE | Spanish prompt simulating evaluator review |
| `functions/src/review/reviewHandler.ts` | CREATE | Loads all generated docs + metadata, sends to Claude |
| `functions/src/review/types.ts` | CREATE | Review result types |
| `functions/src/index.ts` | MODIFY | Add `runPreSubmissionReview` callable |
| `src/services/review.ts` | CREATE | Client service to invoke review |
| `src/hooks/useReview.ts` | CREATE | State management for review UI |
| `src/components/wizard/ReviewPanel.tsx` | CREATE | Display review findings |
| `src/components/wizard/WizardShell.tsx` | MODIFY | Add "revision" screen to wizard |
| `src/stores/wizardStore.ts` | MODIFY | Add 'revision' to WizardScreen type |

**Review architecture:**

```
Client triggers review
  -> Cloud Function: runPreSubmissionReview(projectId)
    -> Load ALL project data (metadata, team, financials, generated docs content)
    -> Load scoring rubric as context
    -> Send to Claude (claude-sonnet-4-20250514) with evaluator persona prompt
    -> Return structured review: { score_estimate, findings[], recommendations[] }
    -> Store at projects/{projectId}/review/latest
```

**Key design decision:** The review function reads ALL generated document prose, not just metadata. This means it needs the full content from `projects/{projectId}/generated/*`. The existing `loadProjectDataForGeneration` function loads metadata but not generated content. A new `loadProjectDataForReview` function is needed.

**Token budget concern:** All 21 generated documents' prose content could total 50K-100K tokens. Use Claude claude-sonnet-4-20250514 (200K context) and summarize each document to key points before sending to the review prompt. This is a Moderate pitfall (see PITFALLS.md).

### 7. Document Version History + Diff

**Problem:** Track changes to generated documents across regeneration cycles. Show what changed between versions.

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `functions/src/pipeline/passes/*.ts` | MODIFY | Before overwriting generated doc, snapshot current version to history subcollection |
| `src/hooks/useDocHistory.ts` | CREATE | Load version history for a document |
| `src/components/wizard/DocDiffView.tsx` | CREATE | Side-by-side or inline diff display |
| `src/lib/diff.ts` | CREATE | Text diff utilities (use `diff` npm package) |

**Version history data model:**

```
projects/{projectId}/generated/{docId}           -- current version (existing)
projects/{projectId}/generated/{docId}/history/{versionId}  -- previous versions (NEW)
{
  content: { ... },           // full document content snapshot
  version: number,
  generatedAt: Timestamp,
  generatedBy: string,        // userId who triggered generation
  passId: string,
  diff_summary: string,       // optional: auto-generated change summary
}
```

**Diff strategy:**
- Store full snapshots (not deltas) in history subcollection -- simpler, Firestore is cheap
- Client-side diff computation using `diff` library (lightweight, no server needed)
- Display as inline diff with additions/deletions highlighted
- Keep last 10 versions per document (Cloud Function cleanup or Firestore TTL)

### 8. Modality Routing (Produccion vs Postproduccion vs Resubmission)

**Problem:** Different EFICINE modalities require different document sets, different rubrics, different FORMATOs, and different validation rules.

**What changes:**

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/constants.ts` | MODIFY | Add `MODALIDADES_EFICINE`, postproduccion rubric thresholds |
| `src/schemas/project.ts` | MODIFY | Add `modalidad` field to ProjectMetadata |
| `src/lib/modality.ts` | CREATE | Document registry per modality, rubric selector, validation rule selector |
| `src/hooks/useValidation.ts` | MODIFY | Select validation rules based on modality |
| `src/hooks/useGeneration.ts` | MODIFY | Pipeline pass selection based on modality |
| `functions/src/pipeline/orchestrator.ts` | MODIFY | Load modality-specific document registry |
| `prompts/` | CREATE | Postproduccion-specific prompts (different documents) |
| `references/scoring_rubric.md` | EXISTS | Already documents postproduccion rubric (65pt material filmado, etc.) |

**Modality routing architecture:**

```typescript
// src/lib/modality.ts
export type Modalidad = 'produccion' | 'postproduccion' | 'resubmission'

export const MODALITY_CONFIG: Record<Modalidad, {
  documentRegistry: string[]
  pipelinePasses: PassId[]
  rubric: RubricConfig
  validationRuleIds: string[]
  wizardScreens: WizardScreen[]
}> = {
  produccion: {
    documentRegistry: ['A1','A2','A4','A6','A7','A8a','A8b','A9a','A9b','A9d','A10','A11',
      'B3-prod','B3-dir','C2b','C3a','C3b','C4','E1','E2','PITCH'],
    pipelinePasses: ['lineProducer', 'financeAdvisor', 'legal', 'combined'],
    rubric: PRODUCCION_RUBRIC,
    validationRuleIds: ['VALD-01','VALD-02',/* ...all 17 */],
    wizardScreens: ['datos','guion','equipo','financiera','documentos',
      'generacion','validacion','exportar'],
  },
  postproduccion: {
    documentRegistry: ['A6','A8b','A9a','A9b','A9d','A10','ESCRITO_POST','C4','E1','E2'],
    pipelinePasses: ['financeAdvisor', 'combined_post'],
    rubric: POSTPRODUCCION_RUBRIC,
    validationRuleIds: ['VALD-01','VALD-02','VALD-POST-01',/* ...subset + post-specific */],
    wizardScreens: ['datos','equipo','financiera','documentos','material_filmado',
      'generacion','validacion','exportar'],
  },
  resubmission: {
    documentRegistry: ['A1','A2',/* ...same as produccion with carry-forward */],
    pipelinePasses: ['lineProducer', 'financeAdvisor', 'legal', 'combined'],
    rubric: PRODUCCION_RUBRIC,
    validationRuleIds: ['VALD-01',/* ...all + VALD-RESUB-01 */],
    wizardScreens: ['datos','guion','equipo','financiera','documentos',
      'generacion','validacion','exportar'],
  },
}
```

**Key architectural principle:** The modality drives configuration, not code branching. Each subsystem (pipeline, validation, export) reads from the modality config rather than having `if (modalidad === 'postproduccion')` scattered through the code. This is a strategy pattern.

---

## Data Model Changes Summary

### Modified Collections

| Collection | Change | Reason |
|------------|--------|--------|
| `projects/{id}` | Add `ownerId`, `collaborators`, `modalidad`, `organizationId` fields | Auth, RBAC, modality routing |
| `projects/{id}/generated/{docId}` | Add `generatedBy` field | Audit trail |
| `projects/{id}/coproduction/data` | NEW subcollection | Co-production engine |
| `projects/{id}/presence/{uid}` | NEW subcollection | Real-time collaboration |
| `projects/{id}/generated/{docId}/history/{versionId}` | NEW sub-subcollection | Version history |
| `projects/{id}/review/latest` | NEW subcollection | AI review results |
| `erpi_settings/default` | MIGRATE to `organizations/{orgId}/erpi_settings/default` | Multi-org support |
| `users/{uid}` | NEW collection | User profiles, preferences |
| `organizations/{orgId}` | NEW collection | Org membership, settings |

### New Top-Level Collections

```
users/{uid}
{
  displayName: string
  email: string
  photoURL: string
  organizationId: string
  role: UserRole          // denormalized from custom claims for UI reads
  createdAt: Timestamp
}

organizations/{orgId}
{
  name: string            // e.g. "Lemon Studios"
  members: string[]       // array of UIDs for security rule checks
  allowedDomains: string[] // e.g. ["lemonstudios.mx"] for auto-join
  createdAt: Timestamp
}
```

---

## Modified Files Inventory

### Files That MUST Change (Breaking Changes)

| File | Change Scope | Why |
|------|-------------|-----|
| `src/lib/firebase.ts` | Add Auth import | Auth initialization |
| `src/main.tsx` | Wrap with AuthProvider | Auth context |
| `src/App.tsx` | Add login route, protected routes | Auth gating |
| `firestore.rules` | Complete rewrite | Security (currently wide open) |
| `storage.rules` | Complete rewrite | Security (currently wide open) |
| `functions/src/index.ts` | Add `request.auth` checks to ALL callables | Server-side auth enforcement |
| `src/services/projects.ts` | Add `ownerId`, `collaborators` to createProject | Data model |
| `src/services/erpi.ts` | Change from singleton to org-scoped | Data model migration |
| `functions/src/pipeline/orchestrator.ts` | Add orgId to ERPI lookup, add modality config | Data model |
| `src/hooks/useAutoSave.ts` | Add `updatedBy` field, check permissions | Auth + collaboration |
| `src/stores/appStore.ts` | Add user context | Auth state |
| `src/schemas/project.ts` | Add `modalidad`, `ownerId`, `collaborators` fields | Data model |
| `src/lib/constants.ts` | Add modality configs, currencies, postproduccion thresholds | New features |

### Files That Need Minor Modifications

| File | Change Scope | Why |
|------|-------------|-----|
| `src/stores/wizardStore.ts` | Add new screen slugs | Modality routing, review screen |
| `src/components/layout/AppHeader.tsx` | Add user avatar, sign-out button | Auth UI |
| `src/components/dashboard/DashboardPage.tsx` | Filter projects by user/org | Auth scoping |
| `src/hooks/useValidation.ts` | Select rules by modality | Modality routing |
| `src/hooks/useGeneration.ts` | Select passes by modality | Modality routing |
| `src/locales/es.ts` | Add strings for all new UI | Language policy |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Auth state management |
| `src/components/auth/LoginPage.tsx` | Google sign-in page |
| `src/components/auth/ProtectedRoute.tsx` | Route guard |
| `src/components/common/RoleGate.tsx` | Role-based UI gating |
| `src/components/common/ActiveEditors.tsx` | Presence indicators |
| `src/components/common/ConflictBanner.tsx` | Concurrent edit notification |
| `src/lib/permissions.ts` | RBAC permission map |
| `src/lib/currency.ts` | Multi-currency arithmetic |
| `src/lib/modality.ts` | Modality configuration registry |
| `src/lib/diff.ts` | Text diff utilities |
| `src/schemas/coproduction.ts` | Co-production Zod schemas |
| `src/hooks/usePresence.ts` | Active editor tracking |
| `src/hooks/useCoproduction.ts` | Co-production derived state |
| `src/hooks/useReview.ts` | AI review state |
| `src/hooks/useDocHistory.ts` | Document version history |
| `src/services/review.ts` | Review Cloud Function client |
| `src/components/wizard/CoproductionPanel.tsx` | Co-production UI |
| `src/components/wizard/ReviewPanel.tsx` | AI review UI |
| `src/components/wizard/DocDiffView.tsx` | Version diff UI |
| `functions/src/auth/claims.ts` | Custom claims management |
| `functions/src/review/reviewHandler.ts` | AI review logic |
| `functions/src/review/types.ts` | Review types |
| `prompts/revision_pre_envio.md` | Evaluator review prompt |

---

## Dependency Graph (Build Order)

```
Phase 1: Auth Foundation
  firebase.ts -> AuthContext -> ProtectedRoute -> App.tsx routes
  firestore.rules rewrite
  storage.rules rewrite
  Cloud Functions auth checks
  |
  v
Phase 2: RBAC + Collaboration
  permissions.ts -> RoleGate
  appStore modifications
  useAutoSave modifications (updatedBy)
  usePresence hook + ActiveEditors UI
  |
  v
Phase 3: Data Model Migration
  Project schema changes (ownerId, collaborators, modalidad)
  ERPI settings migration (singleton -> org-scoped)
  users/ and organizations/ collections
  |
  v
Phase 4: Modality Routing  (can parallel with Phase 5)
  modality.ts config registry
  Wizard screen routing based on modality
  Pipeline pass selection
  Validation rule selection
  Postproduccion prompts
  |
Phase 5: Co-Production Engine  (can parallel with Phase 4)
  currency.ts
  coproduction.ts schema
  CoproductionPanel UI
  orchestrator.ts modifications
  financeAdvisor.ts modifications
  |
  v
Phase 6: AI Review + Version History
  Version history subcollection
  Pipeline pass modifications (snapshot before overwrite)
  useDocHistory + DocDiffView
  Review prompt + Cloud Function + UI
```

**Why this order:**
1. Auth MUST come first -- every subsequent feature depends on knowing who the user is
2. RBAC depends on auth being in place
3. Data model migration depends on auth (need ownerId) and RBAC (need collaborators)
4. Modality routing and co-production are independent of each other but both need the migrated data model
5. AI review and version history are the least coupled features -- they enhance existing functionality

---

## Scalability Considerations

| Concern | Current (1 user) | At 4 users (Lemon Studios team) | At 20 users (hypothetical) |
|---------|-------------------|-------------------------------|---------------------------|
| Firestore reads | ~10 listeners/project | ~40 listeners/project | Restructure to use fewer listeners |
| Presence | N/A | 4 presence docs, 60s heartbeat | TTL cleanup, reduce heartbeat |
| Security rules | Wide open (fast) | ~2 doc reads per rule eval | Custom claims avoid extra reads |
| Auto-save conflicts | N/A | Rare (different screens) | Need field-level merge, not doc-level |
| Cloud Function concurrency | No contention | Low contention | Queue generation requests |
| Review token budget | N/A | 50-100K tokens per review | Summarize docs before sending |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Auth Check Only on Frontend
**What:** Checking `user.role === 'producer'` in React but not in Firestore rules.
**Why bad:** Any user can open browser DevTools and write directly to Firestore.
**Instead:** Firestore security rules are the ONLY real security. Client-side checks are UX convenience only.

### Anti-Pattern 2: Storing Roles in Firestore Documents Only
**What:** Reading `users/{uid}.role` in every Firestore security rule evaluation.
**Why bad:** Each rule invocation has a 10-document-read limit. With 10+ listeners in useValidation, you burn reads fast.
**Instead:** Use Firebase custom claims (embedded in auth token, zero document reads).

### Anti-Pattern 3: Real-Time Collaborative Text Editing via Firestore
**What:** Building OT/CRDT for prose document editing through Firestore.
**Why bad:** Firestore is not designed for character-by-character sync. Latency, cost, and complexity would be enormous.
**Instead:** Forms use field-level merge (already works). For prose editing of generated docs, use a "check out / check in" pattern or accept last-write-wins.

### Anti-Pattern 4: Single Modality Config Scattered Across Code
**What:** `if (modalidad === 'postproduccion')` checks sprinkled through 20 files.
**Why bad:** Adding a third modality requires touching every file.
**Instead:** Central `MODALITY_CONFIG` registry. Each subsystem reads from config, never branches on modality string.

### Anti-Pattern 5: Migrating Data Model Without a Script
**What:** Manually updating Firestore documents in production.
**Why bad:** Inconsistent state, missed documents, no rollback.
**Instead:** Write a Cloud Function or Firestore script that migrates existing projects to the new schema (adds default `ownerId`, `collaborators`, `modalidad: 'produccion'`).

---

## Sources

- [Firebase Auth web Google sign-in](https://firebase.google.com/docs/auth/web/google-signin) -- Official docs, HIGH confidence
- [Firestore role-based access](https://firebase.google.com/docs/firestore/solutions/role-based-access) -- Official docs, HIGH confidence
- [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims) -- Official docs, HIGH confidence
- [Firestore field-level access control](https://firebase.google.com/docs/firestore/security/rules-fields) -- Official docs, HIGH confidence
- [Firestore transactions and concurrency](https://firebase.google.com/docs/firestore/transaction-data-contention) -- Official docs, HIGH confidence
- [Firestore version history pattern](https://medium.com/google-cloud/building-a-time-machine-with-firestore-a-complete-guide-to-data-history-tracking-3bd1d506250c) -- Community, MEDIUM confidence
- [EFICINE Lineamientos Produccion](https://www.estimulosfiscales.hacienda.gob.mx/work/models/efiscales/documentos/eficine/Lineamientos_Produccion_Junio2024.pdf) -- Official government source, HIGH confidence
- Codebase inspection of all files listed in this document -- HIGH confidence
