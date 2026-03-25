# Technology Stack: v2.0 Additions

**Project:** Carpetify v2.0 (Multi-User + Extended Modalities)
**Researched:** 2026-03-25
**Overall confidence:** HIGH
**Scope:** New libraries/services ONLY. Existing stack (React 19, Vite 8, Tailwind v4, shadcn/ui, Firebase 12, Anthropic SDK, Zustand, React Query, RHF + Zod, etc.) is validated and unchanged.

---

## Existing Stack (Unchanged)

The v1.0 stack is locked in and working well. v2.0 does NOT change the core stack -- it adds to it.

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Framework | React | 19.2 | KEEP |
| Bundler | Vite | 8.0 | KEEP |
| Language | TypeScript (strict) | 5.9 | KEEP |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.2 | KEEP |
| State | Zustand + React Query | 5.0 / 5.94 | KEEP |
| Forms | React Hook Form + Zod | 7.71 / 4.3 | KEEP |
| Routing | React Router | 7.13 | KEEP |
| Backend | Firebase (Firestore, Storage, Functions v2, Hosting) | 12.11 | KEEP + add Auth |
| AI | Anthropic SDK | 0.80 | KEEP |
| PDF | pdf-parse (server), pdfjs-dist (client) | 2.4 / 10.4 | KEEP |
| Tests | Vitest + Testing Library + Playwright | 4.1 / 1.58 | KEEP |

---

## New Stack Additions for v2.0

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Firebase Auth (Google provider) | 12.11 (already in firebase SDK) | User authentication | Already in the Firebase SDK bundle. Zero new dependencies. Google provider fits Lemon Studios workflow (Google Workspace). |
| Firebase Admin SDK (custom claims) | Already in functions/package.json | Server-side role assignment | Custom claims embed role in JWT token -- no extra Firestore reads in security rules. |

**Why Firebase Auth over alternatives:** The app already uses Firebase for everything. Adding a separate auth provider (Auth0, Clerk, Supabase Auth) would add a dependency, complicate the deploy pipeline, and require bridging auth tokens to Firestore security rules. Firebase Auth is the only option that provides native integration with Firestore security rules via `request.auth.token`.

### Multi-Currency (Co-Production)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `dinero.js` | 2.0.0 | Multi-currency integer arithmetic | Went stable March 2026. Integer-based (no floating-point), 166 ISO 4217 currencies, tree-shakeable, TypeScript-first. Prevents MXN/USD mixing at the type level. |
| `@dinero.js/currencies` | 2.0.0 | Currency definitions | Pre-built currency objects with correct decimal exponents. MXN exponent=2 matches existing centavos pattern. |
| Banxico SIE API | v1 | Official MXN exchange rates | Legally required source for EFICINE co-productions. `SF43718` = USD/MXN FIX rate. Free API, token-based auth. |

**Why dinero.js over manual centavos:** Single-currency centavos works fine (keep for existing MXN-only paths). But co-production needs currency-aware arithmetic where you cannot add MXN + USD without explicit conversion. dinero.js enforces this at the type level. Gradual adoption -- only in co-production module, existing code unchanged.

**Why NOT `currency.js`:** Uses floating-point internally, then rounds. For a legal compliance tool where wrong centavo amounts get applications rejected, integer-only math is non-negotiable.

### Text Diff (Document Version Comparison)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `diff` | 8.0.4 | Text diffing engine | 8M+ weekly downloads. Myers algorithm. Word-level and line-level diffs. Built-in TypeScript types since v8. |
| `diff2html` | 3.x | Diff visualization | Renders unified diffs as side-by-side HTML. Used by GitHub/GitLab. CSS themes included. |

**Why this pair:** `diff` computes the delta, `diff2html` renders it. Clean separation. No alternative provides both computation and rendering.

### Real-Time Collaboration Bridge

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@tanstack-query-firebase/react` | 2.1.1 | React Query + Firestore real-time bridge | Connects onSnapshot to React Query cache. Already using React Query, so this is the natural bridge. Avoids managing onSnapshot subscriptions separately from cache. |

---

## Complete New Dependencies

### Frontend (`package.json`)

```bash
npm install dinero.js @dinero.js/currencies  # Multi-currency
npm install diff diff2html                    # Document diffing
npm install @tanstack-query-firebase/react    # Real-time bridge
```

**Total new frontend dependencies: 5 packages**

### Cloud Functions (`functions/package.json`)

```bash
cd functions && npm install dinero.js @dinero.js/currencies
```

**Total new Cloud Functions dependencies: 2 packages**

### Infrastructure (no npm)

- Firebase Auth: Enable Google provider in Firebase Console
- Firestore Security Rules: Rewrite `firestore.rules` (deploy with `firebase deploy --only firestore:rules`)
- Firebase Secret Manager: Add `BANXICO_API_TOKEN` secret
- Firestore TTL: Enable on `presence` collection group for automatic cleanup

**No new Firebase services.** No RTDB, no additional regions, no additional billing tiers.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Auth | Firebase Auth | Auth0, Clerk, Supabase Auth | Split-brain: separate auth provider requires bridging tokens to Firestore rules. Firebase Auth is native. |
| Roles | Custom claims | Firestore role documents | 10-document-read limit per rule eval. Custom claims are in JWT, zero reads. |
| Presence | Firestore docs + TTL | Firebase RTDB | Adding second database for 4 users is overengineering. |
| Real-time bridge | @tanstack-query-firebase | react-firebase-hooks | react-firebase-hooks is 3+ years stale, doesn't integrate with React Query. |
| Currency | dinero.js v2 | currency.js | currency.js uses float internally. Legal compliance requires integer arithmetic. |
| Exchange rates | Banxico SIE API | Open Exchange Rates | IMCINE legally requires Banxico FIX rate. Third-party rates are non-compliant. |
| Diff engine | diff (jsdiff) | diff-match-patch | DMP is for real-time collab (OT). We need read-only comparison. |
| Diff render | diff2html | Monaco Editor diff | Monaco is a full code editor (huge bundle). Our content is prose, not code. |
| Collab editing | Section-level locking | yjs / automerge (CRDTs) | Form fields, not prose. Section locking is the right granularity. |
| State mgmt | Zustand (keep) | Redux Toolkit | Multi-user doesn't change state complexity enough. Zustand + RQ still right. |
| Rich text | None | ProseMirror / TipTap | Users don't edit generated docs. They review and regenerate. |
| i18n | es.ts (keep) | i18next | No new languages planned. Single locale file works. |

---

## Version Compatibility Matrix

| New Package | Requires | Compatible With Existing |
|-------------|----------|------------------------|
| `dinero.js` 2.0.0 | TypeScript 4.7+ | TypeScript 5.9 -- yes |
| `@dinero.js/currencies` 2.0.0 | dinero.js 2.0.0 | N/A (new) |
| `diff` 8.0.4 | Node 14+ / browser | Node 22 (Functions), browser -- yes |
| `diff2html` 3.x | Browser | Vite + React -- yes |
| `@tanstack-query-firebase/react` 2.1.1 | @tanstack/react-query 5.x, firebase 10+ | RQ 5.94, Firebase 12.11 -- yes |

---

## Migration Strategy

### Auth Migration (biggest impact, do first)

1. `src/lib/firebase.ts` -- Add `getAuth(app)` export (1 line)
2. `src/App.tsx` -- Add auth guard route wrapper
3. All 7 Cloud Functions -- Add `request.auth` checks
4. `firestore.rules` -- Rewrite from wide-open to RBAC
5. `storage.rules` -- Rewrite from wide-open to auth-gated
6. `src/stores/appStore.ts` -- Add user state

**Risk:** All 7 existing Cloud Functions currently ignore auth. Must add auth checks to all callables simultaneously with deploying security rules. Partial deployment = broken app.

### Currency Migration (moderate, do with co-production)

**Gradual approach.** Keep existing centavos for MXN-only paths. Add dinero.js only in new co-production module. Don't refactor proven financial code.

### Real-Time Migration (low impact)

Existing `services/projects.ts` uses one-shot reads. Real-time subscriptions are additive. No breaking changes.

---

## Sources

### HIGH Confidence (Official docs, verified)
- [Firebase Auth Web - Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules - Role-Based Access](https://firebase.google.com/docs/firestore/solutions/role-based-access)
- [Firestore onSnapshot](https://firebase.google.com/docs/firestore/query-data/listen)
- [Dinero.js v2 docs](https://www.dinerojs.com/)
- [Banxico SIE API](https://www.banxico.org.mx/SieAPIRest/service/v1/doc/series)
- [jsdiff (diff npm)](https://www.npmjs.com/package/diff)
- [diff2html](https://diff2html.xyz/)

### MEDIUM Confidence (Verified with multiple sources)
- [TanStack Query Firebase](https://react-query-firebase.invertase.dev/)
- [Dinero.js v2 stable release](https://www.sarahdayan.com/blog/dinerojs-v2-is-out) -- confirmed stable March 2026
