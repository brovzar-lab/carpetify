# Carpetify — Testing

## Project Status
**Pre-code / Specification phase.** No test framework, test files, or CI/CD configuration exists yet.

## Testing Strategy (Derived from Spec)

### Validation-Heavy Domain
EFICINE submissions are rejected for any inconsistency. The app's core value proposition is preventing these rejections. Testing must focus heavily on:

1. **Cross-module validation rules** — 13 rules in `references/validation_rules.md`
2. **Financial reconciliation** — budget total = cash flow total = financial scheme total
3. **Title consistency** — identical across all generated documents
4. **Fee cross-matching** — contract amounts = budget amounts = cash flow amounts
5. **Threshold compliance** — ERPI ≥20%, EFICINE ≤80%/$25M, screenwriter ≥3%, in-kind ≤10%
6. **Date compliance** — all supporting docs < 3 months old

### Recommended Test Categories

#### Unit Tests
- Financial calculation functions (percentage calculations, threshold checks)
- Currency formatting (`$X,XXX,XXX MXN`)
- Date formatting (Spanish format)
- File name sanitization (≤15 chars, ASCII only, no accents/ñ)
- Schema validation against JSON Schema definitions

#### Integration Tests
- Firestore read/write operations
- AI prompt variable injection (correct Spanish output)
- PDF parsing accuracy (scene count, location extraction)
- PDF generation (correct formatting, size limits)
- Cross-document consistency checks

#### End-to-End Tests
- Complete wizard flow (5 screens)
- Document generation pipeline (7 sequential AI passes)
- Export pipeline (PDF generation → ZIP compilation)
- Validation engine (all 13 rules with valid and invalid inputs)

#### Domain-Specific Tests
- **Financial golden equation:** Test that modifying any budget line correctly propagates to cash flow and financial scheme
- **Title propagation:** Test that changing project title updates all generated documents
- **Threshold boundary tests:** Test values at exactly 20%, 80%, 3%, 10%, $25M boundaries
- **Modality routing:** Test that each project type (`produccion_nuevo`, `postproduccion`, etc.) activates correct document requirements
- **Prohibited expenditure detection:** Test that EFICINE funds flagged on prohibited categories

### Build Phase Testing Strategy (from `CLAUDE.md`)
Each phase should be tested before moving to the next:

| Phase | Test Focus |
|-------|-----------|
| 1 — Scaffold + Intake | Form validation, Firestore schema, auth flow, wizard navigation |
| 2 — Screenplay Parser | PDF extraction accuracy, scene breakdown correctness |
| 3 — Validation Engine | All 13 cross-module rules, traffic light dashboard |
| 4 — AI Document Generation | Prompt injection correctness, Spanish output quality, document dependencies |
| 5 — Export Manager | PDF generation, file naming, ZIP structure, size limits |

## Test Framework
Not yet selected. Likely candidates given the React + Firebase stack:
- **Unit/Integration:** Vitest or Jest
- **E2E:** Playwright or Cypress
- **Firebase:** Firebase Emulator Suite for local Firestore/Auth/Functions testing

## CI/CD
No CI/CD pipeline configured. No `firebase.json`, no GitHub Actions, no deployment configuration exists yet.
