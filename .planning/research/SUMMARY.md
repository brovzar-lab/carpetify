# Research Summary: Carpetify v2.0

**Domain:** Multi-user collaborative legal compliance tool (EFICINE film tax incentive)
**Researched:** 2026-03-25
**Overall confidence:** HIGH

## Executive Summary

Carpetify v2.0 transforms a single-user internal tool into a 4-person collaborative platform. The research finds that the existing Firebase stack handles the majority of new requirements without adding significant new technology. Firebase Auth (already bundled in the installed SDK) provides Google sign-in and JWT-based custom claims for RBAC. Firestore's onSnapshot provides real-time collaboration primitives. The only substantial new dependencies are dinero.js v2 (stable as of March 2026) for type-safe multi-currency co-production accounting, the diff/diff2html pair for document version comparison, and @tanstack-query-firebase/react to bridge Firestore real-time listeners with the existing React Query cache.

The AI evaluator simulation and EFICINE modality support require zero new libraries -- they extend the existing Anthropic SDK pipeline and Zod schema patterns. The Banxico SIE API (free, token-authenticated) is the legally required source for MXN exchange rates in co-production documents.

The riskiest area is the auth migration. The v1.0 codebase has **zero authentication** -- no security rules (wide open `allow read, write: if true`), no auth checks in any of the 7 Cloud Functions, no user state anywhere. Adding auth is an all-or-nothing deployment that touches every Cloud Function, requires a data migration to add ownership fields to all existing project documents, and needs Firestore security rules to go live simultaneously. This must be the first phase of v2.0 and must be tested thoroughly with the Firebase Emulator suite before production deployment.

The co-production engine is the most complex new feature from a domain perspective (territorial budget splits, multi-currency reconciliation, exchange rate lock-in dates), but the technology is straightforward -- dinero.js prevents currency mixing at the type level, and Banxico provides the authoritative rates. The modality routing (Produccion vs Postproduccion vs Resubmission) requires a strategy pattern architecture to avoid scattering `if (modalidad === 'postproduccion')` checks across the codebase.

Detailed codebase inspection identified 14 files that MUST change (breaking changes) and 6 files that need minor modifications. Approximately 24 new files need to be created. The ERPI settings singleton (`erpi_settings/default`) must be migrated to organization-scoped storage, affecting both the frontend service and the Cloud Functions orchestrator.

## Key Findings

**Stack:** Only 5 new frontend packages and 2 new Cloud Functions packages needed. Firebase Auth and Firestore real-time are already installed but unused. Total new dependency footprint is minimal.

**Architecture:** Section-level collaboration (not field-level) is the right granularity for a 4-person team on 5 wizard screens. CRDTs/OT are massive overkill. Firestore merge writes already handle field-level concurrency for form data. Presence tracking via Firestore docs + TTL is sufficient (no Firebase RTDB needed).

**Critical pitfall:** Auth migration is all-or-nothing. The current `firestore.rules` allows everything (`allow read, write: if true`). Deploying new rules before migrating existing data (adding `ownerId`, `collaborators`) locks out all existing projects. Must run data migration script BEFORE deploying rules.

**Data model impact:** Three new top-level collections needed (`users`, `organizations`), five new subcollections under projects (`coproduction`, `presence`, `history`, `review`), and four new fields on the project document (`ownerId`, `collaborators`, `modalidad`, `organizationId`).

**CLAUDE.md contradiction:** Line 173 says "Never add Firebase Auth (single-user by design)." This must be updated before v2.0 development begins to avoid AI assistants refusing auth-related changes.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Auth Foundation** - Must come first. Every subsequent feature depends on knowing who the user is.
   - Addresses: Firebase Auth setup, Google sign-in, custom claims, AuthContext provider, ProtectedRoute, login page
   - Avoids: The "partial auth deployment" pitfall by making this a focused, self-contained phase
   - Key files: `firebase.ts`, `main.tsx`, `App.tsx`, `firestore.rules`, `storage.rules`, ALL 7 Cloud Functions

2. **RBAC + Data Model Migration** - Builds on auth. Adds permissions and migrates existing data.
   - Addresses: Custom claims for roles, permissions.ts, RoleGate component, `ownerId`/`collaborators` on projects, ERPI singleton migration, `listProjects` where clause fix
   - Avoids: Firestore 10-read limit by using custom claims (not document-based roles)
   - Key files: `projects.ts`, `erpi.ts`, `orchestrator.ts`, `appStore.ts`, `project.ts` schema

3. **Real-Time Collaboration** - Section presence + conflict notification.
   - Addresses: usePresence hook, ActiveEditors component, ConflictBanner, useAutoSave updatedBy field
   - Avoids: Overengineering with CRDTs or RTDB presence. Last-write-wins is acceptable for form data.
   - Key files: `useAutoSave.ts` (modify), new hooks and components

4. **Modality Routing** - Strategy pattern for Produccion/Postproduccion/Resubmission. Can parallel with Phase 5.
   - Addresses: `modality.ts` config registry, wizard screen routing, pipeline pass selection, validation rule selection
   - Avoids: Scattering modality checks. Central config drives all subsystems.
   - Key files: `constants.ts`, `project.ts` schema, `useValidation.ts`, `useGeneration.ts`, `orchestrator.ts`

5. **Co-Production Engine** - Multi-currency + territorial splits. Can parallel with Phase 4.
   - Addresses: dinero.js integration, Banxico API Cloud Function, CoproductionPanel, budget generation extensions
   - Avoids: Currency mixing bugs by using dinero.js type safety from the start
   - Key files: new `currency.ts`, `coproduction.ts` schema, `financeAdvisor.ts`, new prompts

6. **AI Review + Version History** - Enhancement features. Least coupled to auth/collaboration.
   - Addresses: Pre-submission evaluator prompt + Cloud Function, version snapshots in pipeline, diff view
   - Avoids: Token overflow by summarizing documents before review (50-100K token concern)
   - Key files: new `reviewHandler.ts`, modified pipeline passes, new `DocDiffView.tsx`

**Phase ordering rationale:**
- Auth MUST be first -- every other feature needs user identity
- RBAC + data migration naturally follows (needs auth for ownerId)
- Collaboration needs auth + RBAC in place
- Modality routing and co-production are independent, can parallelize
- AI review + version history are enhancement layers, least risk if delayed

**Research flags for phases:**
- Phase 1 (Auth): HIGH risk -- all-or-nothing deployment, needs Firebase Emulator E2E testing
- Phase 2 (RBAC): MEDIUM risk -- ERPI migration is the main concern, need fallback strategy
- Phase 3 (Collaboration): LOW risk -- well-understood patterns, form-level concurrency is simple
- Phase 4 (Modalities): Needs deeper research into Postproduccion FORMATO structures and 65-pt rubric details
- Phase 5 (Co-Production): Needs deeper research into IMCINE territorial split rules and co-production recognition requirements
- Phase 6 (AI Review): LOW risk -- extends existing pipeline patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (auth) | HIGH | Firebase Auth is well-documented, custom claims pattern is official recommendation |
| Stack (collaboration) | HIGH | Firestore onSnapshot is proven; section-level locking is standard pattern |
| Stack (multi-currency) | HIGH | dinero.js v2 just went stable; Banxico API is authoritative |
| Stack (diffing) | HIGH | jsdiff v8 is mature (8M weekly downloads), diff2html widely used |
| Stack (AI review) | HIGH | No new tech, extends existing Anthropic pipeline |
| Architecture (integration points) | HIGH | Based on direct codebase inspection of all files |
| Architecture (data model) | HIGH | Firestore subcollection patterns well understood |
| Features (co-production rules) | MEDIUM | Domain complexity not fully mapped; territorial split rules need phase-specific research |
| Features (postproduccion) | MEDIUM | Different rubric documented in scoring_rubric.md but FORMATO structures need detailed mapping |
| Pitfalls (auth migration) | HIGH | Clear risk identified, clear mitigation strategy documented |
| Pitfalls (ERPI singleton) | HIGH | Verified in both frontend and backend code |
| Pitfalls (modality drift) | MEDIUM | Strategy pattern recommended but needs CI test for config verification |

## Gaps to Address

- EFICINE Postproduccion Lineamientos not fully analyzed (different scoring rubric is documented, but FORMATO structures, required document variations, and "material filmado" watermark requirements need detailed extraction)
- Co-production territorial budget split rules need detailed extraction from Reglas Generales DOF 23-dic-2025
- IMCINE co-production recognition letter requirements and approval process not researched
- Comparative budget format for resubmission modality not detailed
- Exchange rate lock-in date rules (when must the Banxico rate be fixed relative to registration?) need legal verification
- @tanstack-query-firebase/react v2.1.1 compatibility with exact React Query 5.94 version needs verification (MEDIUM confidence from web search, not Context7-verified)
- dinero.js v2 tree-shaking with Vite 8 needs validation (should work but not tested in this exact build setup)
