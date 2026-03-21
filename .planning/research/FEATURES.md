# Feature Landscape

**Domain:** AI-powered government submission dossier generator (EFICINE Article 189 film tax incentive)
**Researched:** 2026-03-21

---

## Table Stakes

Features the tool MUST have or it provides zero value over manual carpeta assembly. Missing any of these makes the tool unusable for its stated purpose.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **5-screen intake wizard** | Structured data collection is the foundation; without it, AI generation has no inputs | Medium | Screens: project setup, screenplay upload, creative team, financial structure, document upload. All in Mexican Spanish. |
| **Screenplay PDF parsing** | The screenplay is the primary input; everything derives from it (breakdown, schedule, budget, synopsis) | High | Extract scene count, locations, characters, INT/EXT/DAY/NIGHT. PDF text extraction is notoriously unreliable across screenplay formats. |
| **AI document generation pipeline** | The core value prop. Without AI-generated documents, the user is just filling forms manually | High | 4 sequential passes: Line Producer, Finance Advisor, Legal, Combined. ~20 documents generated. Pre-written Spanish prompts with {{variable}} injection. |
| **Cross-document financial reconciliation** | The "golden equation" (Rule 1) -- budget total == cash flow total == financial scheme total. Mismatch by $1 MXN = rejection | High | This is the #1 rejection reason per PROJECT.md. Four numbers must match exactly. Budget accounts must reconcile with cash flow line items. |
| **Title consistency enforcement** | Rule 2 -- project title must be character-identical across all ~30 documents. Single source of truth for title | Low | Simple but critical. Store title once, inject everywhere. Never let user type it twice. |
| **Fee cross-matching** | Rule 3 -- producer/director/screenwriter fees must triple/quadruple-match across contracts, budget, and cash flow | Medium | Fees entered once in intake, propagated to budget line items, contract templates, and cash flow. Validation checks all match. |
| **EFICINE compliance validation** | Rules on ERPI >= 20%, EFICINE <= 80% and <= $25M, federal sources <= 80%, screenwriter >= 3%, in-kind <= 10% | Medium | Auto-calculate from financial structure input. Flag violations immediately. These are hard blockers -- no workarounds. |
| **Document completeness checklist** | Rule 8 -- missing ANY required document = automatic rejection without evaluation | Low | Track which of the ~30 documents are generated, uploaded, or missing. Simple status tracking. |
| **Traffic light dashboard** | Visual status of the entire carpeta -- what's done, what needs attention, what's blocking export | Medium | Per-document and per-validation-rule status. Green/yellow/red. The user's primary navigation surface after intake. |
| **PDF generation with IMCINE naming** | Rule 9 -- all output files must be PDF, <= 40MB, filename <= 15 chars, no accents/special chars | Medium | Generate PDFs from stored document data. Apply naming convention automatically. Sanitize filenames. |
| **ZIP export** | The final deliverable -- organized folder structure (A_PROPUESTA/, B_PERSONAL/, C_ERPI/, D_COTIZ/, E_FINANZAS/) | Medium | Must match SHCP portal upload structure. Include only complete, validated documents. |
| **User document upload management** | ~10 documents cannot be AI-generated (acta constitutiva, INDAUTOR certs, IDs, bank statements, signed contracts) | Low | Upload, store in Firebase Storage, associate with correct carpeta section. Track upload status. |
| **Mexican Spanish UI (100%)** | Target user is a Mexican producer. English text = confusion and unprofessionalism. Not an i18n toggle -- hard-coded Spanish | Low | No i18n framework needed. Constants/locales file with Spanish strings. Protected EFICINE/IMCINE terminology never translated. |
| **Amount/date formatting** | $X,XXX,XXX MXN and "15 de julio de 2026" everywhere -- contracts, budgets, UI | Low | Format utilities applied consistently. Comma thousands, no decimals, peso sign, MXN suffix. |
| **Multi-project support (up to 3)** | Lemon Studios submits up to 3 projects per EFICINE period | Medium | Project selector, isolated data per project, shared ERPI info across projects. |
| **Registration period awareness** | Each project targets Period 1 (Jan-Feb) or Period 2 (Jul). Drives date validation (3-month document expiry) | Low | Period selection drives Rule 4 date compliance calculations. |

---

## Differentiators

Features that make Carpetify significantly better than manual assembly or generic document tools. These justify the tool's existence beyond basic automation.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **One-click regeneration** | Change a data point (e.g., budget total), and all affected documents regenerate automatically with new numbers | High | Requires dependency tracking between data fields and documents. The key advantage over manual assembly where one change means updating 15 documents. |
| **Score estimation engine** | Estimate project's EFICINE score before submission using the rubric signals (propuesta length, filmography links, budget contingency, etc.) | Medium | Not a prediction -- a quality assurance tool. Flag warning signals like "propuesta de direccion < 2 cuartillas" or "no festival strategy for art-house genre." Average winning score is 94.63/100, minimum 90. |
| **Real-time validation as you type** | Don't wait until export to discover problems. Flag EFICINE compliance violations, missing data, and cross-document inconsistencies as the user enters data | High | Requires reactive validation engine that runs after each field change. Much more valuable than batch validation at export time. |
| **Prohibited expenditure scanning** | Automatically scan budget/cash flow for EFICINE-prohibited categories (pre-stimulus expenses, distribution, carpeta prep, mark-ups, fixed assets) | Medium | Rule 7. AI or rule-based scanner that flags line items funded by EFICINE that shouldn't be. Prevents a common rejection trap. |
| **ERPI eligibility pre-check** | Before the user invests time building a carpeta, verify: < 2 unexhibited prior projects, <= 3 submissions this period, <= 3 total attempts for this project | Low | Rule 6. Quick check at project creation time. Saves user from building an ineligible carpeta. |
| **Bonus points advisor** | Automatically detect eligibility for +5 bonus points (female director, indigenous director, regional decentralization, qualifying creative team) and generate required documentation | Medium | Rule 13. Could be the difference between 89 (rejected) and 94 (approved). Flag which bonus category applies and what documentation is needed. |
| **Budget with Mexican market rates** | Generate budgets using actual Mexican film industry crew rates, equipment costs, and location fees -- not generic placeholders | Medium | Requires a reference rate table for the Mexican market. Makes generated budgets credible to evaluators who know market rates. IMCINE standard account structure (100-1200). |
| **Contract template generation** | AI-generated cesion de derechos, producer/director contracts with correct fee amounts, project title, and required EFICINE clauses | Medium | Legal documents with proper Mexican legal language. Fees auto-populated from budget. Required clauses (3% screenwriter minimum, 10% advance or profit participation). |
| **Date compliance tracking** | Track document issue dates and flag when supporting docs will expire (3-month window before registration close) | Low | Rule 4. Calendar-aware validation. Tell user "your insurance quote expires on [date], get a new one before [registration close]." |
| **Ruta critica / cash flow sync** | Validate that timeline stages align with spending periods in cash flow | Medium | Rule 11. If ruta critica says filming in Month 3, EFICINE production funds should flow in that period. Catches timeline/budget misalignment. |
| **Co-production rules engine** | If international co-production: enforce territorial budget split, exchange rate documentation, IMCINE recognition requirement | Medium | Rule 12. Conditional complexity -- only applies to co-productions but when it does, missing any element = rejection. |
| **Hyperlink accessibility checker** | Verify that filmmaker portfolio links and material visual links are publicly accessible (no passwords, no email gates) | Low | Rule 10. Simple HTTP check. Prevents embarrassing rejection for a dead or gated link. |

---

## Anti-Features

Features to explicitly NOT build. Each would add complexity without proportional value for an internal tool serving one producer at Lemon Studios.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User authentication / accounts** | Internal tool for one user at one company. Auth adds complexity, login friction, and password reset flows with zero value | Skip entirely for v1. Firebase backend without Auth. If needed later, add Firebase Auth with a single Google account. |
| **Multi-user collaboration** | One producer fills everything. Real-time collaboration (CRDT, presence, permissions) is massive engineering for a single-user workflow | Single browser session. If the producer needs to share, they export the ZIP. |
| **SaaS features (billing, onboarding, plans)** | Not a product for sale. No revenue model. Building billing/plans is pure waste | Keep it a tool, not a platform. |
| **Mobile responsive UI** | Producer works at a desk with a large screen, assembling a 30-document dossier. Mobile is unusable for this workflow | Desktop-only. Don't spend time on mobile breakpoints. |
| **Document translation** | Everything is in Spanish. The government portal is in Spanish. Evaluators read Spanish. Translation adds no value | Hardcode Spanish everywhere. No i18n framework. |
| **Direct SHCP portal integration** | The SHCP upload portal (estimulosfiscales.hacienda.gob.mx) has no API. Scraping a government tax portal is legally risky and fragile | Export ZIP, user uploads manually. Include an upload guide document. |
| **Screenplay writing/editing** | The screenplay already exists. Carpetify consumes it, doesn't create it. Building a screenplay editor is a separate product (Celtx, Final Draft, etc.) | Accept PDF upload only. Parse, don't edit. |
| **EFICINE postproduccion support** | Different program, different rules, different scoring rubric (65 pts for filmed material vs. 40 for screenplay). Would double the validation/generation logic | Explicitly scope to EFICINE Produccion only. The postproduction rubric is documented in scoring_rubric.md for reference but not implemented. |
| **Historical analytics / reporting** | Tracking submission history across years, win rates, score trends -- nice for a SaaS product, irrelevant for 3 projects/period | The tool generates carpetas. Period. No dashboards beyond the per-project traffic light. |
| **AI-powered screenplay quality feedback** | Tempting to have the AI critique the screenplay for EFICINE scoring potential. But the screenplay is the director/writer's creative work -- the tool's job is compliance, not creative judgment | Parse the screenplay for production data (scenes, locations, characters). Don't score or critique its artistic merit. |
| **Automatic INDAUTOR registration** | INDAUTOR (copyright office) registration requires in-person or portal interaction with the author's credentials. Cannot be automated by a third-party tool | Accept the INDAUTOR certificate as a user upload. Track its presence in the completeness checklist. |
| **E-signature integration** | Contracts need wet signatures or advanced e-signatures (FIEL/e.firma) for Mexican legal validity. DocuSign-style simple e-sig may not satisfy IMCINE | Generate contract PDFs with signature lines. User prints, signs, scans, and re-uploads. |

---

## Feature Dependencies

```
Screenplay PDF Upload
  --> Screenplay Parsing (text extraction, scene breakdown)
    --> AI Document Generation (all passes need parsed screenplay data)
      --> Line Producer Pass (A7, A8a, A8b, A9a, A9b)
        --> Finance Advisor Pass (A9d, E1, E2 -- needs budget from Line Producer)
          --> Legal Pass (C2b, B3 contracts -- needs fees from budget)
            --> Combined Pass (A1, A2, A6, A10, C4 -- needs data from all prior passes)

Intake Wizard (project setup, team, financial structure)
  --> All AI Generation Passes (need project metadata, team data, financial inputs)
  --> Validation Engine (needs data to validate against)

AI Document Generation
  --> Cross-Document Validation (can only validate once documents exist)
    --> Traffic Light Dashboard (displays validation results)
      --> Export Manager (only exports validated, complete carpeta)

Financial Structure Input (Screen 4)
  --> EFICINE Compliance Validation (ERPI >= 20%, EFICINE <= 80%, etc.)
  --> Budget Generation (needs to know funding sources for cash flow)
  --> Score Estimation (needs financial coherence signals)

User Document Uploads (Screen 5)
  --> Document Completeness Checklist (tracks what's uploaded vs. missing)
  --> Date Compliance Validation (checks issue dates on uploaded docs)
  --> Export Manager (includes uploaded docs in ZIP)
```

### Critical Path

The longest dependency chain is:

**Screenplay Upload --> Parse --> Line Producer --> Finance Advisor --> Legal --> Combined --> Validation --> Export**

This is an 8-step sequential pipeline. Each step depends on the previous. This drives the phased build approach: you cannot build the Finance Advisor pass without the Line Producer pass existing first.

### Parallel Work

These can be built independently:
- Intake wizard (no AI dependency)
- User document upload management (no AI dependency)
- Validation engine rules (can be built against mock data)
- PDF generation / export manager (can be built against mock document data)

---

## MVP Recommendation

### Phase 1: Foundation (build first)

Prioritize:
1. **Intake wizard (all 5 screens)** -- the data collection foundation
2. **Screenplay PDF upload + parsing** -- the primary input
3. **Mexican Spanish UI** -- hardcode from day one, retrofitting is painful
4. **Multi-project support** -- data model must support this from the start

### Phase 2: Generation Core

5. **AI document generation pipeline** (all 4 passes) -- the core value
6. **Cross-document financial reconciliation** -- the #1 rejection preventer
7. **Title/fee consistency enforcement** -- simple propagation from single source of truth
8. **Budget with Mexican market rates** -- credible output

### Phase 3: Validation + Quality

9. **EFICINE compliance validation** -- percentage checks, caps, prohibited expenditures
10. **Traffic light dashboard** -- visual status of everything
11. **Document completeness checklist** -- track what's done vs. missing
12. **Score estimation engine** -- quality assurance before export
13. **Real-time validation** -- catch problems as they happen

### Phase 4: Export + Polish

14. **PDF generation with IMCINE naming** -- final output format
15. **ZIP export with folder structure** -- the deliverable
16. **One-click regeneration** -- change data, regenerate affected docs
17. **Date compliance tracking** -- document expiry awareness
18. **Bonus points advisor** -- maximize scoring potential

### Defer

- **Co-production rules engine**: Only needed if Lemon Studios has international co-productions. Build when the first one comes up. Medium complexity for a conditional feature.
- **Hyperlink accessibility checker**: Nice to have, but the producer can check their own links. Low priority.
- **Ruta critica / cash flow sync validation**: Warning-level rule (Rule 11), not a blocker. Build after all blocker-level validations work.

---

## Sources

- Project specification: `/Users/quantumcode/CODE/CARPETIFY/directives/app_spec.md`
- Validation rules: `/Users/quantumcode/CODE/CARPETIFY/references/validation_rules.md`
- Scoring rubric: `/Users/quantumcode/CODE/CARPETIFY/references/scoring_rubric.md`
- Project context: `/Users/quantumcode/CODE/CARPETIFY/.planning/PROJECT.md`
- [Quark - AI-Powered Document Assembly for Compliance](https://www.quark.com/ccms-structured-authoring/automated-document-assembly-compliance)
- [FlowForma - Document Automation for Government](https://www.flowforma.com/blog/document-automation-for-government)
- [Wrapbook - 6 Best Film Budgeting Software of 2026](https://www.wrapbook.com/blog/best-film-budgeting-software)
- [Filmustage - AI Pre-Production Assistant](https://filmustage.com/)
- [Studiovity - AI Film Production Management](https://studiovity.com/)
