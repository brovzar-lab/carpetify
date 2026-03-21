# Technology Stack

**Project:** Carpetify (EFICINE Article 189 Submission Dossier Generator)
**Researched:** 2026-03-21
**Overall confidence:** HIGH

## Recommended Stack

### Core Framework & Build

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | 19.x | UI framework | Already decided. React 19 is stable, works with all chosen libraries | HIGH |
| Vite | 8.x | Build tool / dev server | CRA is deprecated. Vite 8 uses Oxc for transforms, sub-2s dev starts, native ESM. No Babel dependency. | HIGH |
| TypeScript | 5.7+ | Type safety | Non-negotiable for a financial/legal compliance tool. Catches amount mismatches at compile time. | HIGH |
| React Router | 7.13+ | Client-side routing | v7 merges Remix into React Router. Single package (no react-router-dom needed). SPA mode fits this internal tool. | HIGH |

### UI Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2+ | Utility-first CSS | Already decided. v4 is 5x faster builds, zero-config, CSS-native with @property and cascade layers. | HIGH |
| shadcn/ui | v4 CLI | Component library | Already decided. Not a dependency -- copies components into your project. Works with Tailwind v4 + Radix primitives. Wizard steps, forms, dialogs, tables all available. | HIGH |
| Lucide React | latest | Icons | Default icon set for shadcn/ui. Tree-shakeable. | HIGH |
| class-variance-authority | latest | Component variants | Required by shadcn/ui for variant management | HIGH |

### Backend (Firebase)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| firebase | 12.11+ | Client SDK (Firestore, Storage) | Already decided. v12 is current stable. Modular/tree-shakeable API. No Auth needed for v1. | HIGH |
| firebase-admin | 13.7+ | Server-side SDK (Cloud Functions) | Required for Functions runtime. Use for Anthropic API calls to keep API key server-side. | HIGH |
| firebase-functions | 7.2+ | Cloud Functions v2 | v2 functions are the current standard. Use onCall for client-invoked AI generation, onRequest for webhooks if needed. Requires Node.js 20+. | HIGH |

### PDF Parsing (Screenplay Input)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| unpdf | latest | PDF text extraction | Modern UnJS library wrapping pdf.js. Works in Cloud Functions (serverless-compatible). Better maintained than pdf-parse (unmaintained 4+ years). Edge-runtime compatible if ever needed. | MEDIUM |
| pdfjs-dist | 5.x (fallback) | Full PDF rendering | If unpdf's extraction quality is insufficient for screenplay formatting (INT/EXT markers, scene headers), fall back to pdfjs-dist for page-level text with coordinates. | MEDIUM |

**Why not pdf-parse:** Unmaintained since 2020. Still gets downloads from legacy projects, but unpdf is its spiritual successor with active maintenance.

### PDF Generation (Document Output)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @react-pdf/renderer | 4.3+ | PDF generation from React components | Declarative, React-native API. Define document layouts as JSX components. Perfect for structured EFICINE FORMATOS (tables, headers, styled text). Runs in both browser and Node.js (Cloud Functions). | HIGH |

**Why not jsPDF:** jsPDF requires imperative, coordinate-based API (`doc.text(x, y, "text")`). For ~20 structured documents with tables, headers, and consistent formatting, the declarative React component model of @react-pdf/renderer is dramatically more maintainable. The EFICINE documents have complex table layouts (FORMATO 3 cash flow, FORMATO 9 financial scheme) that would be painful in jsPDF.

**Why not pdfmake:** Less React-native. pdfmake uses JSON document definitions which work but lose the composability of React components. @react-pdf/renderer lets you build reusable PDF components (e.g., a `<FormatoHeader>` component shared across all FORMATOS).

### AI Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @anthropic-ai/sdk | 0.80+ | Claude API client | Official Anthropic SDK. Use from Firebase Cloud Functions ONLY (API key stays server-side). Supports streaming for long document generation. | HIGH |

**Architecture note:** All Claude API calls happen in Cloud Functions, never from the browser. The client calls a Firebase callable function, which invokes Claude, stores the result in Firestore, and returns a reference. This keeps the API key secure and avoids CORS issues.

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Hook Form | 7.x | Form state management | Uncontrolled components = fewer re-renders. Critical for the 5-screen wizard with many fields. Integrates with Zod via @hookform/resolvers. | HIGH |
| @hookform/resolvers | latest | Zod-to-RHF bridge | Connects Zod schemas to React Hook Form validation | HIGH |
| Zod | 4.3+ | Schema validation | TypeScript-first. Define schemas once, use for form validation AND Firestore data validation AND cross-document consistency checks. The 13 EFICINE validation rules map directly to Zod refinements. | HIGH |

**Why not Formik:** More re-renders (controlled components), larger bundle, less actively maintained. React Hook Form is the clear winner for 2025-2026.

### Data Fetching & State

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @tanstack/react-query | 5.91+ | Server state management | Manages Firestore read caching, AI generation mutation states, invalidation on regeneration. onMutate for optimistic updates when saving form data. | HIGH |
| Zustand | 5.x | Client state | Lightweight store for wizard step state, active project selection, UI state (sidebar, modals). No Redux boilerplate. | MEDIUM |

**Why not Redux:** Massive overkill for an internal single-user tool. Zustand gives global state in ~10 lines.

### Export & Packaging

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| JSZip | 3.10 | ZIP file generation | Battle-tested, 3M+ weekly downloads. Creates the organized folder structure (A_PROPUESTA/, B_PERSONAL/, etc.) client-side. | HIGH |
| file-saver | 2.x | Download trigger | Cross-browser `saveAs()` for triggering ZIP download. Companion to JSZip. | HIGH |

**Why not client-zip:** Smaller and faster, but JSZip has a much larger ecosystem and handles the folder structure API more intuitively. The carpeta ZIP is not large enough for streaming to matter.

### Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | 4.x | Date formatting | Locale-aware. `format(date, "d 'de' MMMM 'de' yyyy", { locale: es })` gives "15 de julio de 2026". Tree-shakeable. | HIGH |
| date-fns/locale/es | included | Spanish locale | Mexican Spanish date formatting built-in | HIGH |

**Why not dayjs/moment:** date-fns is tree-shakeable (import only what you use), moment is deprecated, dayjs works but date-fns has better TypeScript support.

### Dev Dependencies

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | 9.x | Linting | Flat config format (eslint.config.js). Use @eslint/js + typescript-eslint. | HIGH |
| Prettier | 3.x | Formatting | With prettier-plugin-tailwindcss for class sorting | HIGH |
| vitest | 3.x | Testing | Native Vite integration. Same config, same transforms. No Jest config gymnastics. | HIGH |
| @testing-library/react | latest | Component testing | Standard React testing companion | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite 8 | Next.js | SSR/RSC unnecessary for internal SPA tool. Adds complexity without benefit. No SEO needed. |
| Build tool | Vite 8 | Create React App | Deprecated. Dead project. |
| PDF parsing | unpdf | pdf-parse | Unmaintained since 2020. unpdf wraps the same pdf.js but with active maintenance. |
| PDF generation | @react-pdf/renderer | jsPDF | Imperative API is unmaintainable for 20+ structured documents with tables. |
| PDF generation | @react-pdf/renderer | pdfmake | JSON definitions less composable than React components for this many templates. |
| Forms | React Hook Form | Formik | More re-renders, larger bundle, less active development. |
| Forms | React Hook Form | TanStack Form | Too new, smaller ecosystem, RHF is battle-tested. |
| Validation | Zod | Yup | Zod has better TypeScript inference, more expressive for financial rules (.refine()). |
| State | Zustand | Redux Toolkit | Overkill for single-user internal tool. |
| State | Zustand | Jotai | Either works. Zustand slightly better for the "global project state" pattern needed here. |
| CSS | Tailwind v4 | CSS Modules | Already decided. Tailwind + shadcn/ui is the prescribed stack. |
| Dates | date-fns | dayjs | date-fns is tree-shakeable, better TS types, native ES module. |
| ZIP | JSZip | client-zip | JSZip more mature, better folder API, size difference irrelevant for this use case. |
| Testing | Vitest | Jest | Vitest uses same Vite config. Zero additional setup. Faster. |

## Installation

```bash
# Initialize project
npm create vite@latest carpetify -- --template react-ts

# Core UI
npm install react-router tailwindcss @tailwindcss/vite lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui (run after project init)
npx shadcn@latest init

# Firebase
npm install firebase
npm install -D firebase-tools

# PDF
npm install @react-pdf/renderer unpdf

# AI (Cloud Functions only -- not in frontend package.json)
# In functions/package.json:
# npm install @anthropic-ai/sdk firebase-admin firebase-functions

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Data Fetching & State
npm install @tanstack/react-query zustand

# Export
npm install jszip file-saver
npm install -D @types/file-saver

# Utilities
npm install date-fns

# Dev
npm install -D eslint @eslint/js typescript-eslint prettier prettier-plugin-tailwindcss vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Project Structure

```
carpetify/
├── src/
│   ├── components/       # React components (English names)
│   │   ├── ui/           # shadcn/ui components
│   │   ├── wizard/       # 5-screen intake wizard
│   │   ├── dashboard/    # Traffic light validation dashboard
│   │   ├── documents/    # Document viewer/editor
│   │   └── export/       # Export manager
│   ├── lib/              # Utilities, Firebase config
│   ├── hooks/            # Custom React hooks
│   ├── schemas/          # Zod schemas (mirror Firestore structure)
│   ├── locales/          # es.json with all Spanish UI strings
│   ├── pdf/              # @react-pdf/renderer document templates
│   │   ├── formatos/     # FORMATO 1-11 PDF templates
│   │   └── components/   # Reusable PDF components (headers, tables)
│   ├── services/         # Firebase callable function wrappers
│   └── validation/       # 13 EFICINE cross-document rules in Zod
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   │   ├── ai/           # Claude API integration
│   │   ├── parsing/      # PDF text extraction (unpdf)
│   │   └── validation/   # Server-side validation
│   └── package.json      # Separate deps: @anthropic-ai/sdk, firebase-admin
├── prompts/              # Spanish AI prompts (pre-written, DO NOT MODIFY)
├── schemas/              # JSON schemas (reference)
├── references/           # Scoring rubric, validation rules
└── directives/           # Language policy, app spec
```

## Key Architecture Decisions

1. **Anthropic SDK lives in Cloud Functions only.** Never expose the API key to the browser. Client calls `httpsCallable('generateDocument')`, Cloud Function calls Claude, stores result in Firestore.

2. **PDF generation happens client-side** with @react-pdf/renderer. The AI generates structured content (stored as JSON/Markdown in Firestore), and the React PDF components render it into formatted PDFs on demand. This keeps Cloud Functions lean and avoids storing large PDF blobs.

3. **PDF parsing happens server-side** in Cloud Functions using unpdf. Screenplay PDFs are uploaded to Firebase Storage, a Cloud Function triggers on upload, extracts text, and stores parsed data in Firestore.

4. **Zod schemas are the single source of truth** for data shape. Used for: form validation (via @hookform/resolvers), Firestore document validation, cross-document consistency checks (the 13 EFICINE rules), and TypeScript type inference.

5. **No i18n library.** The app is Spanish-only. Use a `locales/es.json` constants file for all UI strings. No react-intl, no i18next -- those add abstraction for a single-locale app.

## Sources

- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui installation](https://ui.shadcn.com/docs/installation)
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer)
- [unpdf on GitHub](https://github.com/unjs/unpdf)
- [Firebase JS SDK releases](https://github.com/firebase/firebase-js-sdk/releases)
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk)
- [React Hook Form](https://react-hook-form.com/)
- [Zod v4 release notes](https://zod.dev/v4)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router v7](https://reactrouter.com/)
- [JSZip](https://stuk.github.io/jszip/)
- [unpdf vs pdf-parse vs pdfjs-dist comparison (2026)](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026)
