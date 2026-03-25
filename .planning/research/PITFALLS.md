# Domain Pitfalls: v2.0 Migration

**Domain:** Adding multi-user auth, collaboration, co-production engine, and modality routing to an existing single-user EFICINE dossier generator
**Researched:** 2026-03-25
**Overall confidence:** HIGH (based on direct codebase analysis + Firebase documentation + EFICINE rules)

**Prior research (v1.0):** This file replaces the original PITFALLS.md which covered financial rounding, AI hallucination, and document consistency pitfalls. Those pitfalls remain valid and are not repeated here. This version focuses exclusively on pitfalls introduced by the v2.0 migration scope.

---

## Critical Pitfalls

Mistakes that cause data loss, security breaches, broken existing functionality, or require full rewrites.

---

### Pitfall 1: Deploying Security Rules Before Migrating Existing Data Locks Everyone Out

**What goes wrong:** You write proper Firestore security rules requiring `request.auth != null` and owner-based access (`request.auth.uid == resource.data.ownerId`), deploy them, and immediately every existing project becomes inaccessible. All v1.0 documents in `projects/` have no `ownerId` field. All data in `erpi_settings/default` has no user association. The production app is bricked.

**Why it happens:** The current `firestore.rules` file is:
```
match /{document=**} {
  allow read, write: if true;
}
```
And the `storage.rules` file is identical. There is zero security on any data path. Every document in Firestore was created without any user association -- no `ownerId`, no `createdBy`, no `teamMembers` array. The ERPI settings use a hardcoded singleton path (`erpi_settings/default`) with no user scoping.

**Consequences:** Existing projects become unreadable. Auto-save writes fail silently (the retry logic in `useAutoSave` fires 3 times then shows `error` status). Cloud Functions using `firebase-admin` bypass rules but the frontend is completely blocked. Users see an empty dashboard with no projects.

**Prevention:**
1. Run a data migration script BEFORE deploying rules. Use `firebase-admin` in a Cloud Function or script to add `ownerId` and `teamMembers` fields to every existing project document.
2. Deploy rules in phases: first `allow read, write: if request.auth != null` (any authenticated user -- safe because this is an internal team tool), then tighten to owner/team-based rules after migration is verified.
3. Add a `migrationVersion` field to documents. Security rules can check: `if resource.data.ownerId != null` for new rules, falling back to `request.auth != null` for unmigrated docs.
4. Test rules in the Firebase Emulator against a snapshot of production data BEFORE deployment.

**Detection:** After migration, query for documents where `ownerId` does not exist. If any remain, rules deployment is premature.

**Phase:** Must be the FIRST thing addressed in the Auth phase. Rules deployment is the final step, not the first.

**Confidence:** HIGH -- verified against the actual `firestore.rules` and `storage.rules` files in the repo.

---

### Pitfall 2: The `erpi_settings/default` Singleton Breaks Multi-User

**What goes wrong:** ERPI settings (company name, RFC, legal representative, fiscal address) are stored at `erpi_settings/default` -- a single global document. The `erpi.ts` service hardcodes this path: `const erpiRef = doc(db, 'erpi_settings', 'default')`. The orchestrator in Cloud Functions also hardcodes it: `db.collection('erpi_settings').doc('default').get()`. When multiple users exist, they all share the same ERPI settings, which is wrong -- different producers may use different ERPIs, or the same ERPI may need different legal representatives per project.

**Why it happens:** v1.0 was designed for a single user at Lemon Studios. The ERPI singleton was correct for that use case. But EFICINE rules allow different ERPIs per project (one ERPI can submit up to 3 projects per period, but a user might work with multiple ERPIs). Even within Lemon Studios, different projects might use different subsidiary entities.

**Consequences:** User A's ERPI settings overwrite User B's. Generated documents (contracts, cartas de aportacion, esquema financiero) contain the wrong company information. This is an application-rejection-level error -- the ERPI name must match across B3 contracts, E1 esquema financiero, E2 carta de aportacion, and the SHCP registration.

**Prevention:**
- Move ERPI settings from a global singleton to per-project storage: `projects/{projectId}/erpi/data`. Each project owns its ERPI configuration.
- Or create a user-scoped ERPI collection: `users/{userId}/erpi_settings/{erpiId}` with a reference from the project.
- Update BOTH the frontend service (`src/services/erpi.ts`) AND the Cloud Function orchestrator (`functions/src/pipeline/orchestrator.ts` line 146) simultaneously. If you update one without the other, generated documents will use stale/wrong ERPI data.
- Migrate existing `erpi_settings/default` data into the first user's per-project ERPI docs during the data migration phase.

**Detection:** After migration, the path `erpi_settings/default` should be empty or deleted. Any code referencing this path is a bug.

**Phase:** Must be addressed in the Auth/data-model phase, before any document generation occurs under the new system.

**Confidence:** HIGH -- verified against `src/services/erpi.ts` (line 5) and `functions/src/pipeline/orchestrator.ts` (line 146).

---

### Pitfall 3: Auto-Save Concurrent Writes Cause Silent Data Loss

**What goes wrong:** Two team members (e.g., producer and line producer) both have the same project open. Producer edits `datos` screen, line producer edits `financiera` screen. Both trigger `useAutoSave`, which calls `setDoc` with `{ merge: true }` to `projects/{projectId}/{path}/data`. If they happen to edit overlapping fields (e.g., both screens touch `costo_total_proyecto_centavos`), the last write wins silently. Neither user sees a conflict warning. The producer's carefully entered budget total is overwritten by the line producer's stale value.

**Why it happens:** The current `useAutoSave` hook uses `setDoc` with merge, which is a non-transactional last-write-wins operation. There is no conflict detection, no version tracking, no optimistic locking. This was fine for single-user (you can't conflict with yourself on different screens), but is dangerous for collaboration.

The specific code in `src/hooks/useAutoSave.ts`:
```typescript
const ref = doc(db, `projects/${projectId}/${path}/data`)
await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
```

**Consequences:** Data silently reverts. Financial figures change without the user knowing. The compliance engine re-evaluates on the wrong numbers. Generated documents become stale but the staleness tracker might not fire if the overwritten field isn't one that triggers staleness detection.

**Prevention:**
1. **Section-level locking (recommended):** Each wizard screen writes to its own subcollection path (already the case: `team/data`, `financials/data`, etc.). Assign sections to roles -- the producer owns `datos` and `financiera`, the line producer owns budget review, the lawyer owns legal docs. Only the assigned user can auto-save to that section.
2. **Optimistic locking:** Add a `version` field. Before writing, read current `version`. If it changed since last read, show a conflict UI. This is complex but correct.
3. **Field-level writes:** Instead of sending the entire form data, send only changed fields. Firestore merge handles this, but you must change from "send entire form state" to "send dirty fields only."
4. **Real-time listeners:** Use `onSnapshot` so both users see live updates. If User B's screen shows data changing under their cursor, they know someone else is editing.

**Detection:** Open the same project in two browser tabs. Edit the same field in both. Check if the first edit survives. In v1.0 it does not (last write wins). This must be resolved before shipping collaboration.

**Phase:** Core to the collaboration feature. Must be designed in the Auth/collaboration phase, not bolted on later.

**Confidence:** HIGH -- verified against the actual `useAutoSave` implementation.

---

### Pitfall 4: Cloud Functions Don't Validate Caller Identity (request.auth is Null)

**What goes wrong:** All 7 Cloud Functions (`extractScreenplay`, `analyzeScreenplay`, `runLineProducerPass`, `runFinanceAdvisorPass`, `runLegalPass`, `runCombinedPass`, `estimateScore`) accept a `projectId` from the client and trust it blindly. None check `request.auth`. After adding auth, if you forget to add auth checks to functions, any authenticated user can run expensive AI operations on any project by guessing/knowing a projectId. Worse: if the client sends `request.auth` but the function doesn't validate it, the security model has a hole.

**Why it happens:** v1.0 functions were designed for no-auth. The `onCall` handler destructures `request.data` but never touches `request.auth`. Example from `functions/src/index.ts`:
```typescript
const { projectId } = request.data as { projectId: string };
if (!projectId) throw new HttpsError('invalid-argument', 'Se requiere projectId.');
// No auth check anywhere
```

In Firebase v2 onCall, `request.auth` is automatically populated when the client is authenticated. But it is `null` when no auth is present, and the function still runs. Known Firebase bug/behavior: in some SDK version combinations, `request.auth` can also be `undefined` instead of `null`, requiring defensive checks.

**Consequences:** Unauthorized users can trigger Claude API calls (each costing money). They can read/overwrite any project's generated documents. They can run the score estimation on someone else's project.

**Prevention:**
1. Add an auth guard at the top of every Cloud Function:
   ```typescript
   if (!request.auth?.uid) {
     throw new HttpsError('unauthenticated', 'Autenticacion requerida.');
   }
   ```
2. After auth check, verify the caller has access to the requested project:
   ```typescript
   const projectDoc = await db.doc(`projects/${projectId}`).get();
   const teamMembers = projectDoc.data()?.teamMembers ?? [];
   if (!teamMembers.includes(request.auth.uid)) {
     throw new HttpsError('permission-denied', 'No tienes acceso a este proyecto.');
   }
   ```
3. Create a shared middleware/helper function for auth + project-access validation. Apply it to all 7 functions. Do NOT copy-paste the check into each function independently (leads to one being missed).

**Detection:** Unit test: call each function with `request.auth = null`. It should throw `unauthenticated`. Call with a valid auth but wrong projectId. It should throw `permission-denied`.

**Phase:** Must be addressed in the same phase as frontend auth. Deploying frontend auth without backend auth creates a false sense of security.

**Confidence:** HIGH -- verified against all 7 Cloud Function definitions in `functions/src/index.ts`.

---

### Pitfall 5: Co-Production Exchange Rate Stored as Snapshot But Used as Live Value

**What goes wrong:** The project schema has `tipo_cambio_fx` and `fecha_tipo_cambio` as optional fields for international co-productions. In v1.0, these are entered once by the user. But EFICINE requires the exchange rate to be the official rate on the DATE OF REGISTRATION (not the date it was entered). If the user enters the rate in January but submits in February, the rate is stale and the budget in MXN is wrong. Furthermore, the rate is stored as a single float, but co-productions may involve multiple currencies (e.g., a Mexico-France-Spain co-production needs EUR/MXN and potentially USD/MXN).

**Why it happens:** v1.0's co-production support is minimal -- just a boolean flag `es_coproduccion_internacional` and a single exchange rate field. The schema from `src/schemas/project.ts`:
```typescript
tipo_cambio_fx: z.number().positive().optional(),
fecha_tipo_cambio: z.string().optional(),
```

This assumes one currency pair, one rate, one date. Real co-productions need multiple currencies, each with their own rate and date, and the ability to refresh rates near the registration deadline.

**Consequences:** Budget amounts in foreign currency convert to wrong MXN values. The golden equation breaks because the presupuesto uses one rate but the esquema financiero uses another. EFICINE evaluators catch this because they independently verify exchange rates against Banco de Mexico published rates.

**Prevention:**
1. Model exchange rates as an array of `{ currency: string, rate: number, date: string, source: string }` objects, not a single scalar.
2. Add a "refresh exchange rate" action that pulls from Banco de Mexico's API (or allows manual entry with the official rate).
3. Add a validation rule: if `fecha_tipo_cambio` is more than 30 days before `periodo_registro` close date, show a WARNING.
4. Store the Banco de Mexico source URL as provenance for audit purposes.
5. When exchange rates change, all MXN-equivalent amounts in the budget must cascade-recalculate. This means the budget computation engine needs a currency layer.

**Detection:** Validation rule VALD-XX: for co-productions, check that `fecha_tipo_cambio` is within the registration period or within 30 days before it.

**Phase:** Co-production engine phase. Must be designed before budget generation is extended for multi-currency.

**Confidence:** HIGH for the data model gap (verified in schema). MEDIUM for the Banco de Mexico API availability (not verified).

---

### Pitfall 6: Modality Routing Creates a Parallel Universe of Documents, Prompts, and Validation

**What goes wrong:** You add a `modalidad` field to the project (`"produccion" | "postproduccion" | "reautorizacion"`) and think you just need a few `if` statements. In reality, each modality has a DIFFERENT set of required documents, a DIFFERENT scoring rubric, DIFFERENT FORMATO structures, and DIFFERENT validation rules. A naive implementation scatters `if (modalidad === 'postproduccion')` checks across dozens of files, creating an unmaintainable mess.

**Why it happens:** The current codebase is built entirely for Produccion modality:
- The scoring rubric (`references/scoring_rubric.md`) has Produccion at 62+38=100 points vs. Postproduccion at 65+35=100 points with DIFFERENT categories.
- Produccion requires A3 (guion), A4 (propuesta direccion), A5 (material visual) as separate scored documents. Postproduccion replaces these with a 65-point "material filmado" (first cut video link) plus "escrito libre de postproduccion" (15 points).
- The required documents list changes: Postproduccion does NOT need A7 (propuesta de produccion) or A8a (plan de rodaje) in their Produccion form. Instead it needs post-production-specific ruta critica and budget.
- All 11 prompts in `prompts/` are written for Produccion. Postproduccion needs different prompts (or no prompts) for many documents.
- The validation rules change: Postproduccion doesn't validate shooting schedule feasibility but DOES validate that the first-cut video link has an "EFICINE PRODUCCION" watermark not exceeding 1/4 of the visible image.
- The 4-pass generation pipeline (Line Producer -> Finance Advisor -> Legal -> Combined) assumes Produccion workflow. Postproduccion has a different dependency graph.

**Consequences:** If you scatter modality checks throughout the codebase, every new feature requires updating every check. Miss one check and a Postproduccion project generates Produccion-specific documents, or the validation engine applies wrong rules.

**Prevention:**
1. **Strategy pattern:** Create a `ModalityConfig` that defines, per modality: required documents, scoring rubric, prompt file mappings, validation rules, generation pipeline order, and FORMATO templates. All modality-dependent code reads from this config, never from inline `if` checks.
2. **Prompt versioning:** Instead of modifying existing prompts, create parallel prompt directories: `prompts/produccion/`, `prompts/postproduccion/`. The config maps modality to prompt directory.
3. **Validation rule registry:** Each validation rule declares which modalities it applies to. The validation engine filters rules by the project's modality before evaluation.
4. **Pipeline factory:** Instead of one fixed 4-pass pipeline, create a pipeline builder that returns the correct pass sequence for the modality.
5. **Start with Produccion as default.** All existing code continues to work unchanged. Postproduccion and Reautorizacion are additive, never modifying existing Produccion logic.

**Detection:** Grep for hardcoded modality assumptions: any reference to "A7", "A8a", "plan de rodaje" that doesn't check modality first is a potential bug for Postproduccion.

**Phase:** Modality routing should be its own dedicated phase, NOT mixed into the auth phase. The data model needs the `modalidad` field early, but the routing logic is a separate concern.

**Confidence:** HIGH -- verified against `references/scoring_rubric.md` (lines 49-64) and `references/validation_rules.md`.

---

## Moderate Pitfalls

Mistakes that cause significant rework, poor UX, or bugs that are hard to track down.

---

### Pitfall 7: Firebase Auth Init Creates a Loading Flash on Every Page

**What goes wrong:** You add `getAuth()` to `src/lib/firebase.ts` and wrap the app in an auth state observer. On every page load, `onAuthStateChanged` fires asynchronously. Until it resolves, `user` is `null`. If your route guards redirect unauthenticated users to login, every page load shows a brief flash of the login screen before the auth state resolves and the user is recognized as logged in.

**Why it happens:** Firebase Auth's `onAuthStateChanged` is async. The current `App.tsx` has no loading state:
```typescript
function App() {
  return (
    <BrowserRouter>
      <AppHeader>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          ...
        </Routes>
      </AppHeader>
    </BrowserRouter>
  )
}
```
There is no auth context, no loading spinner, no route protection. Adding auth requires wrapping everything in an auth provider that blocks rendering until the auth state is known.

**Prevention:**
1. Create an `AuthProvider` component that wraps the app and holds `user`, `loading`, `error` state.
2. While `loading` is true, render a full-screen spinner (not the login page, not the app).
3. Only after `loading` is false, decide: if `user` is null, redirect to login. If `user` exists, render the app.
4. Use `getAuth(app)` in `firebase.ts` alongside the existing exports. Initialize it once.
5. Store the auth instance as a module-level export, same pattern as `db`, `storage`, `functions`.

**Detection:** Rapid page refresh. If you see a login flash before the dashboard appears, the auth state resolution is leaking into the UI.

**Phase:** Auth phase, first task after Firebase Auth is initialized.

**Confidence:** HIGH -- standard Firebase Auth pattern, verified against current App.tsx structure.

---

### Pitfall 8: `listProjects` Returns ALL Projects, Not the User's Projects

**What goes wrong:** The `DashboardPage` calls `listProjects()`, which queries `projectsCol` ordered by `createdAt` with no filter. After adding auth, this returns every project in the database, not just the current user's projects. With security rules, this query will either fail entirely (if rules require owner match) or return only documents the user can access (if rules use `request.auth.uid` matching), but the client-side query doesn't include a `where` clause, so Firestore may reject it with a "Missing or insufficient permissions" error.

**Why it happens:** Firestore security rules evaluate at the query level, not the result level. If your rules say "users can only read their own projects" but the query says "give me all projects ordered by date," Firestore rejects the QUERY (not the individual results). The client must include a `where` clause that matches the security rule's condition.

Current code from `src/services/projects.ts`:
```typescript
const q = query(projectsCol, orderBy('createdAt', 'desc'))
const snap = await getDocs(q)
```

**Prevention:**
1. Add `where('ownerId', '==', currentUserId)` or `where('teamMembers', 'array-contains', currentUserId)` to the query.
2. Ensure the security rule matches the query structure. If the rule checks `resource.data.teamMembers` but the query filters on `ownerId`, they won't align and the query fails.
3. Update `createProject()` to include `ownerId` and `teamMembers` fields when creating a new project.
4. Do NOT rely on security rules to filter results. Always include the matching `where` clause in the client query.

**Detection:** After adding auth + rules, load the dashboard. If it shows "Firestore connection error" (the existing toast from `onError`), the query is being rejected by security rules.

**Phase:** Auth phase, immediately after data migration adds ownership fields.

**Confidence:** HIGH -- this is one of the most common Firebase Auth migration mistakes, and verified against the actual `projects.ts` code.

---

### Pitfall 9: Co-Production Territorial Budget Split Requires Duplicate Budget Lines

**What goes wrong:** You add co-production support by adding a `pais` field to each budget line item. But EFICINE requires a TERRITORIAL split: every line in the presupuesto desglose must show "Gasto en territorio nacional" vs. "Gasto en el extranjero" separately. This is not just a filter -- it's a structural requirement where the same budget account (e.g., "300 - Equipo Tecnico") may have BOTH national and foreign spend, and the evaluator needs to see both columns side by side.

**Why it happens:** The current budget generation in the Line Producer pass creates a flat list of accounts (100-1200). For domestic-only productions, this is correct. For co-productions, EFICINE requires a dual-column or dual-section format showing territorial allocation. The existing prompt `a9_presupuesto.md` has no mention of territorial splits.

**Consequences:** The budget document is structurally wrong for co-productions. The evaluator cannot verify that the Mexican participation is genuine (a key evaluation criterion worth points in the "propuesta de produccion" category). The esquema financiero and flujo de efectivo must also reflect the territorial split, cascading the structural change through 3+ documents.

**Prevention:**
1. Add `territorio: 'nacional' | 'extranjero'` to each budget line item in the data model.
2. For co-productions, the budget summary must show two sub-totals per account: national and foreign.
3. The flujo de efectivo must also split by territory.
4. Create co-production-specific prompt variants: `a9_presupuesto_coprod.md` that instructs Claude to generate the dual-column format.
5. The financial reconciliation golden equation must now hold for: total = national + foreign (per account AND per source).

**Detection:** Generate a budget for a co-production project. If it looks identical to a domestic budget (no territorial columns), the co-production engine is incomplete.

**Phase:** Co-production engine phase. Must be coordinated with budget generation changes.

**Confidence:** HIGH -- verified against `references/validation_rules.md` rule #12.

---

### Pitfall 10: Role-Based Access + Firestore Security Rules = 10 Read Limit

**What goes wrong:** You implement role-based access by storing roles in a `users/{userId}` document and writing a `getUserRole()` helper function in security rules. Each rule invocation calls `get(/databases/$(database)/documents/users/$(request.auth.uid))` to check the role. Firestore allows a maximum of 10 document access calls per rule evaluation. If your rules check the user's role (1 read), then check the project's team members (1 read), then check a subcollection permission (1 read), you consume 3 reads per rule. Complex nested paths (e.g., `projects/{pid}/team/{tid}`) can hit the 10-read limit, causing ALL operations on that path to fail with "maximum call stack depth exceeded."

**Why it happens:** Firestore security rules are evaluated server-side for every read and write. Each `get()` or `exists()` call in rules counts against the 10-call limit. Team-based access patterns are read-heavy because you need to verify membership on every operation.

**Consequences:** Write operations fail intermittently. The auto-save hook enters its retry loop, burns through 3 retries, and shows a persistent error state. Users think the app is broken.

**Prevention:**
1. **Use Firebase custom claims** instead of Firestore document reads for role checking. Custom claims are embedded in the auth token and cost zero rule reads: `request.auth.token.role == 'producer'`.
2. Store the `teamMembers` array directly on the project document (not in a subcollection). This way, checking team membership is one `get()` call on the document being accessed, which is free (it's the `resource.data` of the document itself).
3. For subcollections under projects, use a wildcard rule that inherits the parent project's team check: read the project doc once, cache the result for nested paths.
4. Keep rules as flat as possible. Avoid helper functions that chain multiple `get()` calls.

**Detection:** Monitor the Firebase Console's "Rules" tab for "exceeded maximum get calls" errors. In development, the Emulator logs these clearly.

**Phase:** Auth phase, rules design. This architectural decision must be made upfront, not after rules are already written with document-read patterns.

**Confidence:** HIGH -- this is a well-documented Firebase limitation (10 document access calls per rule evaluation).

---

### Pitfall 11: The CLAUDE.md "Never" Rule Says "Never Add Firebase Auth"

**What goes wrong:** The current `CLAUDE.md` explicitly says under "Never": "Add Firebase Auth (single-user by design)." An AI assistant or contributor following these instructions will refuse to add auth or will flag it as a violation. This creates friction and confusion during the v2.0 migration.

**Why it happens:** The rule was correct for v1.0. It hasn't been updated for the v2.0 milestone.

**Consequences:** Development confusion. AI assistants refuse valid auth-related changes. PR reviewers citing CLAUDE.md as reason to reject auth code.

**Prevention:**
1. Update CLAUDE.md BEFORE starting the auth phase. Remove or update the "Never add Firebase Auth" rule.
2. Replace with: "Firebase Auth is required. Google login for Lemon Studios team. All Firestore reads/writes must include user context."
3. Update the "No Firebase Auth -- single-user tool" note under Firebase section.
4. Update the Project Structure section to include auth-related files.

**Detection:** Read CLAUDE.md. If it still says "never add Firebase Auth," it's stale.

**Phase:** Must be updated at the START of v2.0, before any code changes.

**Confidence:** HIGH -- verified at CLAUDE.md line 173.

---

### Pitfall 12: Postproduccion Modality Invalidates the 4-Pass Pipeline Order

**What goes wrong:** The v1.0 generation pipeline runs in strict order: Pass 1 (Screenplay Analysis) -> Pass 2 (Line Producer: budget, plan de rodaje, ruta critica) -> Pass 3 (Finance Advisor: flujo, esquema) -> Pass 4 (Legal: contracts) -> Pass 5 (Combined: resumen ejecutivo, sinopsis, etc.). For Postproduccion modality, Pass 2 is fundamentally different: there's no shooting schedule (filming is done), the budget structure changes (past expenditures + remaining post costs), and the ruta critica covers only post-production stages. If you run the existing Pass 2 prompts for a Postproduccion project, you get a shooting schedule for a film that's already shot.

**Why it happens:** All 6 Cloud Functions in `functions/src/index.ts` call `loadProjectDataForGeneration()` which loads the same data structure regardless of modality. The pass handlers assume Produccion workflow. There's no modality branching in the pipeline.

**Consequences:** Generated documents are nonsensical for Postproduccion. The plan de rodaje describes future shooting for a completed film. The budget includes pre-production costs that were already spent. The ruta critica shows filming stages that already happened.

**Prevention:**
1. Add `modalidad` to the `ProjectMetadata` type in both frontend (`src/schemas/project.ts`) and backend (`functions/src/pipeline/orchestrator.ts`).
2. Create a pipeline configuration per modality that defines which passes to run and which prompts to use.
3. For Postproduccion: skip Pass 2 entirely (or replace with a "Post-Production Planner" pass). The budget pass must be post-production-aware (show pre-production as completed expenditure, post-production as remaining).
4. The Combined pass must generate different documents: no A7 propuesta de produccion, but instead an "escrito libre de postproduccion."

**Detection:** Create a Postproduccion project and run the pipeline. If it generates a plan de rodaje, the modality routing failed.

**Phase:** Modality routing phase. Requires new prompts and pipeline configuration.

**Confidence:** HIGH -- verified against prompt files and pipeline structure.

---

## Minor Pitfalls

Issues that cause UI bugs, poor DX, or minor inconsistencies.

---

### Pitfall 13: Google Login Domain Restriction Not Configured

**What goes wrong:** You enable Google login via Firebase Auth and any Google account can log in. A random person with a Gmail account accesses the tool and can see (or create) projects. For an internal Lemon Studios tool, this is a data leak.

**Prevention:**
1. Use Firebase Auth's `hd` (hosted domain) parameter to restrict Google login to `@lemonstudios.mx` (or whatever the company domain is).
2. Alternatively, use an allowlist of email addresses in Firestore and check membership on first login.
3. If using Google Workspace, configure the OAuth consent screen to "Internal" so only organization members can authenticate.

**Phase:** Auth phase configuration.

**Confidence:** MEDIUM -- depends on whether Lemon Studios uses Google Workspace.

---

### Pitfall 14: Zustand Stores Have No User Scoping

**What goes wrong:** The `appStore` holds `activeProjectId`. If the app somehow retains state across user switches (e.g., user logs out and another logs in without a full page reload), the active project from User A's session leaks into User B's session. The `wizardStore` holds `activeScreen` and `sidebarOpen` which are less dangerous but still user-specific state.

**Prevention:**
1. Clear all Zustand stores on logout: `useAppStore.getState().setActiveProject(null)`.
2. Use a `useEffect` in the `AuthProvider` that resets stores when `user` changes.
3. If using persistent storage for Zustand, key it by userId: `persist({ name: \`app-store-\${userId}\` })`.

**Phase:** Auth phase, logout flow implementation.

**Confidence:** HIGH -- verified against `src/stores/appStore.ts`.

---

### Pitfall 15: React Query Cache Leaks Data Between Users

**What goes wrong:** Similar to Zustand, React Query caches query results keyed by query key (e.g., `['projects']`). If User A logs out and User B logs in, the cached project list from User A is still in the React Query cache. User B briefly sees User A's projects until the cache is invalidated. This is a data leak.

**Prevention:**
1. Call `queryClient.clear()` on logout.
2. Better: include the `userId` in query keys: `['projects', userId]`. This way each user's data is cached separately and there's no cross-contamination.
3. The React Query provider is in `main.tsx`. The QueryClient should be recreated or cleared when auth state changes.

**Phase:** Auth phase, logout flow.

**Confidence:** HIGH -- standard React Query auth pattern.

---

### Pitfall 16: Co-Production Multi-Currency Breaks Integer Centavos Arithmetic

**What goes wrong:** The entire financial system uses integer centavos (MXN * 100). When a co-production has a foreign contribution in EUR, you need to store the EUR amount AND its MXN equivalent. If you store the EUR amount in centavos and multiply by the exchange rate, you get floating-point intermediate values that must be rounded back to integer centavos. Different rounding of the EUR->MXN conversion at different points in the code produces different MXN totals, breaking the golden equation.

**Prevention:**
1. Store foreign amounts in their native currency centavos (e.g., EUR cents).
2. Store the exchange rate with sufficient precision (6 decimal places minimum).
3. Define a SINGLE conversion function: `convertToMXNCentavos(foreignCentavos, rate)` that uses consistent rounding (e.g., `Math.round(foreignCentavos * rate)`).
4. The MXN equivalent is the canonical value for all calculations. Foreign amounts are informational only.
5. When the exchange rate changes, ALL MXN equivalents must be recomputed through the single conversion function.

**Phase:** Co-production engine phase.

**Confidence:** HIGH -- verified against the centavos pattern in `src/lib/constants.ts` and `src/hooks/useCompliance.ts`.

---

### Pitfall 17: Resubmission Modality Needs Prior Submission History

**What goes wrong:** The "previously-authorized project resubmission" modality requires knowing the prior submission's authorization number, period, score, and evaluator comments. The current data model has `intentos_proyecto` (a simple integer counter) but no structured history of prior submissions. Without this history, the system cannot populate the resubmission FORMATO or validate that the project is eligible for resubmission (max 3 attempts per EFICINE rules).

**Prevention:**
1. Add a `prior_submissions` array to the project schema: `Array<{ periodo: string, score: number, authorization_number?: string, status: 'authorized' | 'not_authorized', comments?: string }>`.
2. The resubmission modality should pre-populate documents with data from the most recent prior submission.
3. Validation rule: if `prior_submissions.length >= 3`, block new submission (EFICINE max 3 attempts).
4. The resubmission must reference the prior authorization period and show what changed since the last submission.

**Phase:** Modality routing phase, specifically resubmission support.

**Confidence:** HIGH -- verified against `src/schemas/project.ts` (`intentos_proyecto` field) and `references/validation_rules.md` rule #6.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Firebase Auth setup | Auth state flash on page load (#7) | AuthProvider with loading state blocks render until auth resolves | Moderate |
| Firebase Auth setup | CLAUDE.md contradicts v2.0 goals (#11) | Update CLAUDE.md before starting code changes | Moderate |
| Firebase Auth setup | Google login open to any account (#13) | Restrict to company domain or allowlist | Minor |
| Security rules deployment | Locks out existing data (#1) | Migrate data BEFORE deploying rules | Critical |
| Security rules deployment | 10-read limit on role checks (#10) | Use custom claims, not document reads for roles | Moderate |
| Data model migration | ERPI singleton breaks multi-user (#2) | Move to per-project or per-user ERPI settings | Critical |
| Data model migration | listProjects query rejected by rules (#8) | Add where clause matching security rule conditions | Moderate |
| Collaboration | Auto-save concurrent write data loss (#3) | Section-level locking or optimistic locking | Critical |
| Collaboration | Zustand/React Query cache leaks (#14, #15) | Clear caches on auth state change | Minor |
| Cloud Functions | No auth validation on callable functions (#4) | Add auth guard + project access check to all functions | Critical |
| Co-production engine | Exchange rate staleness (#5) | Multi-rate model with refresh capability | Critical |
| Co-production engine | Territorial budget split (#9) | Dual-column budget structure per account | Moderate |
| Co-production engine | Multi-currency breaks centavos math (#16) | Single conversion function with consistent rounding | Moderate |
| Modality routing | Parallel document/prompt/validation universes (#6) | Strategy pattern with ModalityConfig | Critical |
| Modality routing | 4-pass pipeline wrong for Postproduccion (#12) | Pipeline factory per modality | Moderate |
| Modality routing | Resubmission needs submission history (#17) | Prior submissions array in project schema | Moderate |

---

## Migration Order (Risk-Minimizing Sequence)

Based on pitfall dependencies, the safest migration order is:

1. **Update CLAUDE.md** (unblocks everything, zero risk)
2. **Add Firebase Auth** (no rules yet -- just auth state in frontend, login flow)
3. **Run data migration script** (add `ownerId`, `teamMembers` to existing docs, move ERPI to per-project)
4. **Update all service files** (add `where` clauses, user context to queries)
5. **Update all Cloud Functions** (add auth guards + project access checks)
6. **Deploy security rules** (LAST -- only after all data and code is migrated)
7. **Implement collaboration** (section locking, real-time listeners)
8. **Add modality routing** (strategy pattern, separate from auth)
9. **Add co-production engine** (multi-currency, territorial splits)

Deploying rules before step 4 completes = bricked app (Pitfall #1).
Deploying auth before step 5 completes = false security (Pitfall #4).
Adding modality before auth is stable = too many moving parts.

---

## Sources

- [Firebase Fix Insecure Rules](https://firebase.google.com/docs/firestore/security/insecure-rules)
- [Firebase Security Rules and Authentication](https://firebase.google.com/docs/rules/rules-and-auth)
- [Firebase Secure Data Access for Users and Groups](https://firebase.google.com/docs/firestore/solutions/role-based-access)
- [Firebase Team-Based User Management](https://blog.richartkeil.com/how-to-build-a-team-based-user-management-system-in-firebase/)
- [Firebase Transaction Serializability](https://firebase.google.com/docs/firestore/transaction-data-contention)
- [Firebase Callable Functions Auth](https://firebase.google.com/docs/functions/callable)
- [Firebase Auth onAuthStateChanged](https://firebase.google.com/docs/auth/web/start)
- [Firebase request.auth null issue](https://github.com/firebase/firebase-tools/issues/5210)
- [Firestore Role-Based Access Control](https://oneuptime.com/blog/post/2026-02-17-how-to-write-firestore-security-rules-for-role-based-access-control/view)
- [Firestore Group-Based Permissions Pattern](https://medium.com/firebase-developers/patterns-for-security-with-firebase-group-based-permissions-for-cloud-firestore-72859cdec8f6)
- [Film Co-Production Currency Management](https://raindance.org/how-filmmakers-manage-currency-on-international-shoots/)
- [IMCINE EFICINE Lineamientos 2026](https://www.imcine.gob.mx/media/2026/1/lineamientosyrequisitosparalaevaluaciondeproyectosdeeficineproduccion-file_6971706c4a932.pdf)
- Codebase verification: `firestore.rules`, `storage.rules`, `src/services/projects.ts`, `src/services/erpi.ts`, `src/hooks/useAutoSave.ts`, `functions/src/index.ts`, `functions/src/pipeline/orchestrator.ts`, `src/schemas/project.ts`, `references/scoring_rubric.md`, `references/validation_rules.md`
