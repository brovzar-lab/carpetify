# CARPETIFY — Claude Code Bootstrap Prompt

> **App Name:** Carpetify  
> **Purpose:** Take a feature film screenplay (PDF) + basic project info and systematically generate a complete EFICINE Article 189 submission dossier ("carpeta") for production investment.  
> **Stack:** React + Firebase + PDF parsing  
> **Date:** March 2026  
> **Legal basis:** Artículo 189 LISR, Reglas Generales DOF 12-enero-2024 (modificadas 23-dic-2025), Lineamientos EFICINE Producción enero 2026

---

## ⚠️ CRITICAL: LANGUAGE POLICY — READ FIRST

**Before building ANY component, read `POLITICA_IDIOMA.md` in the project root.**

This application serves Mexican film producers submitting to a Mexican government program. The language architecture is:

| Layer | Language | Scope |
|-------|----------|-------|
| **Code infrastructure** | English | React components, Firebase functions, utility code, git, technical comments |
| **Domain model** | Spanish | Schema field names, enum values, data labels, validation messages, all EFICINE/IMCINE terminology |
| **UI (everything user-facing)** | Spanish | Labels, buttons, placeholders, errors, tooltips, navigation, help text — 100% español mexicano |
| **AI generation prompts** | Spanish | All runtime prompts in `prompts/` folder — system prompts, user prompts, output instructions |
| **Generated documents** | Spanish | Every PDF, every contract, every letter, every table — 100% español mexicano profesional |

**Non-negotiable rules:**
1. The user NEVER sees English text in the app interface
2. Generated documents use IMCINE/EFICINE terminology without translation (see protected terms list in `POLITICA_IDIOMA.md`)
3. Amounts always formatted as `$X,XXX,XXX MXN` — no decimals, no centavos in budgets
4. Dates always in Spanish: "15 de julio de 2026", "Agosto 2026"
5. AI prompts for document generation are 100% Spanish (see `prompts/` folder)

**Reference files:**
- `POLITICA_IDIOMA.md` — Complete language policy, protected terminology, UI rules, prose guidelines
- `prompts/README.md` — Index of Spanish runtime prompts with execution order
- `prompts/*.md` — Individual Spanish prompts for each AI-generated document

---

## WHAT IS EFICINE AND HOW THE MECHANISM WORKS

EFICINE is NOT a grant. It is NOT a rebate to the producer. It is a DONOR-SIDE tax incentive under Article 189 of Mexico's Income Tax Law (LISR).

**How it works:**
1. A PRIVATE COMPANY (the "contribuyente aportante") donates cash to an IMCINE-approved film project
2. That company receives an ISR tax CREDIT equal to 100% of the donated amount (capped at 10% of their prior-year ISR)
3. The PRODUCER (the "ERPI" — Empresa Responsable del Proyecto de Inversión) receives the cash and uses it to make the film
4. The producer must exhibit the film commercially within the agreed timeline

**Key 2026 numbers:**
- Annual fiscal cap: $650M MXN total, split into two equal periods of $325M each
- Maximum per project: $25M MXN OR up to 80% of total project cost (whichever is less)
- ERPI must cover minimum 20% of total cost from own resources + third parties
- Sum of ALL federal resources (including EFICINE) cannot exceed 80% of total project cost
- Minimum score required: 90/100 points from the CE Producción evaluation council
- Projects can be submitted up to 3 times if rejected; 4th attempt is invalid
- Registration periods 2026: Period 1 (Jan 30 – Feb 13), Period 2 (Jul 1 – Jul 15)

**What EFICINE funds CANNOT be used for:**
- Expenses incurred BEFORE receiving the stimulus
- Distribution, marketing, or commercialization costs
- Preparation of the carpeta itself
- Services that generate direct profit for the ERPI (completion bonds, mark-ups, distribution fees, gestores above 4-5%)
- Compensation to individuals who are also the ERPI entity
- Fixed asset acquisition
- Investment in financial instruments

---

## THE CARPETA: COMPLETE DOCUMENT MAP

The carpeta is structured into 5 major sections (A through E), each mandatory. Missing ANY document = automatic rejection without evaluation.

### SECTION A — PROPUESTA CINEMATOGRÁFICA (up to 62/100 points)

| # | Document | Format | Max Length | Points | What AI Can Generate |
|---|----------|--------|------------|--------|---------------------|
| A1 | Resumen Ejecutivo | FORMATO 1 (official template) | Per template | — | YES — from screenplay analysis |
| A2 | Sinopsis | PDF, free text | 3 cuartillas max | — | YES — from screenplay |
| A3 | Guion | PDF, professional screenplay format | Full script | 40/100 | NO — user uploads this |
| A4 | Propuesta Creativa de Dirección | PDF, free text | 3 cuartillas max + filmography + links | 12/100 | PARTIAL — generate template, user fills director-specific content |
| A5 | Material Visual y Propuestas del Personal Creativo | PDF, mixed media | 30 cuartillas max + 2 hyperlinks | 10/100 | PARTIAL — generate structure/template |
| A6 | Solidez del Equipo Creativo | FORMATO 2 (official template) | Per template | 2/100 | YES — template with fields |
| A7 | Propuesta de Producción | PDF, free text | 3 cuartillas max | 12/100 | YES — from screenplay breakdown |
| A8a | Plan de Rodaje | PDF, schedule format | Congruent with script | 10/100 (shared) | YES — from screenplay breakdown |
| A8b | Ruta Crítica | PDF, timeline format | Monthly detail, all stages | 10/100 (shared) | YES — generate from screenplay analysis |
| A9a | Resumen del Presupuesto | PDF, by accounts (cuentas) | In MXN | 10/100 (shared) | YES — from screenplay breakdown + rate tables |
| A9b | Desglose del Presupuesto | PDF, by accounts and sub-accounts (cuentas y subcuentas) | In MXN, detailed | 10/100 (shared) | YES — from screenplay breakdown + rate tables |
| A9d | Flujo de Efectivo | FORMATO 3 (official template) | By accounts, by contributors, by production stage | 10/100 (shared) | YES — derived from budget + financial scheme |
| A9e | Cotizaciones Opcionales | PDF | Strategic line items | — | NO — user provides |
| A10 | Propuesta de Exhibición | PDF, free text | Per guidelines | 4/100 | PARTIAL — generate template with market analysis |
| A11 | Puntos Adicionales (optional) | Documentation per criteria | Per criteria | +5 bonus | PARTIAL — flag eligibility, generate required docs |

### SECTION B — PERSONAL CREATIVO (pass/fail — if missing, project NOT evaluated)

| # | Document | Format | What It Proves |
|---|----------|--------|----------------|
| B1 | CVs of Creative Team | FORMATO 2 | Production, Direction, Screenwriting, Cinematography, Art Direction, Editing experience |
| B1a | Producer Experience | Within FORMATO 2 | At least 1 feature exhibited commercially/festivals/VOD platforms |
| B1b | Director Experience | Within FORMATO 2 | At least 1 feature OR 2 short films completed |
| B2 | Nationality Credentials | INE/passport/cédula/residency card per person | Mexican nationality or work permit |
| B3 | Contracts: ERPI ↔ Producer | Signed contract | Title, role, fee (matching budget), contract term covering prep through post, signatures |
| B3 | Contracts: ERPI ↔ Director | Signed contract | Same requirements as producer contract |
| B3f | Image Authorization (documentary only) | Signed letter | If applicable |

### SECTION C — ERPI (EMPRESA RESPONSABLE) (pass/fail)

| # | Document | Format | What It Proves |
|---|----------|--------|----------------|
| C1 | Estatus EFICINE anterior | FORMATO 4 | Current compliance on all prior EFICINE obligations |
| C2a | Certificado INDAUTOR del guion | INDAUTOR certificate | Script title matches system registration |
| C2b | Contrato cesión derechos patrimoniales + INDAUTOR registration | Signed contract + certificate | Minimum 3% of total project cost to screenwriter (IVA included), PLUS proof of 10% advance payment (CFDI + bank transfer) OR 10% profit participation clause |
| C2c | Cadena de cesiones (if applicable) | FORMATO 5 | Chain of title from original author to ERPI |
| C2d | Cesión obra semejante (if adaptation) | Contract + INDAUTOR cert | Rights to underlying work |
| C3a | Carta compromiso buenas prácticas | FORMATO 6 | Commitment to safe, respectful production environment |
| C3b | Carta compromiso Programa Interacción Cultural y Social | FORMATO 7 | Social program participation commitment |
| C4 | Ficha Técnica | FORMATO 8 | Technical data sheet for contributor platform listing |

### SECTION D — COTIZACIONES (pass/fail)

| # | Document | Format | Requirements |
|---|----------|--------|-------------|
| D1a | Cotización seguro de producción | PDF from insurer | Issued to ERPI + project name, full coverage through final copy, provider signature, dated within 3 months of registration close |
| D1b | Cotización informe contador público | PDF from CPA firm | CPA registered with SAT, firm name, dated within 3 months |

### SECTION E — ESQUEMA FINANCIERO (pass/fail)

| # | Document | Format | Requirements |
|---|----------|--------|-------------|
| E1 | Esquema Financiero | FORMATO 9 | Signed by legal rep, shows ALL sources: ERPI exclusive + third parties + EFICINE stimulus. Must total 100% of budget. ERPI ≥ 20%, EFICINE ≤ 80% or $25M |
| E2 | Carta Aportación Exclusiva ERPI | FORMATO 10 | Signed by legal rep, accompanied by proof of funds |
| E2a-i | Proof: Cash (bank statements) | Full bank statements OR bank certification letter | In ERPI's name, showing sufficient balance |
| E2b | Proof: In-kind | Contracts/quotes/CFDI | Titularity and availability documentation |
| E3 | Documentos donativos terceros (if applicable) | Single PDF file | Acta constitutiva + poder notarial + ID of each donor + carta de apoyo/convenio + proof of funds |
| E4 | Documentos coproductores (if applicable) | Single PDF file | Acta constitutiva + poder notarial + ID + signed contract (title, names, total cost, contribution amount, FX rate if foreign, conditions) + proof of funds |
| E4-viii | Reconocimiento previo coproducción IMCINE (if international coprod) | IMCINE certificate | Must be obtained before submission |
| E5 | Acreditación aportaciones | Per specific rules | All docs < 3 months old. CFDIs or CPA report for prior expenses. In-kind honorarios capped at 10% of total budget and 50% of each person's fee. No screenshots/tickets/credit letters accepted. |

### CHAPTER II — ERPI GENERAL REQUIREMENTS (uploaded separately in the system)

| # | Document | Format |
|---|----------|--------|
| II-1 | Acta Constitutiva | Full notarial instrument(s) showing incorporation + any name changes |
| II-2 | Poder Notarial | General power for acts of dominion OR administration (highlight the power clause) |
| II-3 | ID del Representante Legal | INE/passport/cédula/residency card |
| II-4 | Constancia de Situación Fiscal | Current, matching registered name and address |

---

## SCORING RUBRIC (100 points + 5 bonus)

```
ARTISTIC/CULTURAL/CINEMATIC MERIT (up to 62 points):
├── Guion/Argumento ......................... 40 pts
├── Propuesta Creativa de Dirección ......... 12 pts
└── Material Visual + Personal Creativo ..... 10 pts

PRODUCTION/DISTRIBUTION VIABILITY (up to 38 points):
├── Solidez/Experiencia Equipo .............. 2 pts
├── Propuesta de Producción ................. 12 pts
├── Plan de Rodaje + Ruta Crítica ........... 10 pts
├── Presupuesto (resumen + desglose + flujo)  10 pts
└── Propuesta de Exhibición ................. 4 pts

BONUS (non-cumulative, pick ONE):
├── Female director (not co-directed w/man) .. +5 pts
├── Indigenous/Afro-Mexican director ......... +5 pts
├── Regional project (75%+ outside ZMCM, 
│   50%+ local crew, ERPI domiciled outside 
│   ZMCM) .................................. +5 pts
└── 100% female OR indigenous/afro-Mexican 
    creative team ........................... +5 pts

MINIMUM TO PASS: 90/100
Average winning score (2025 Period 1): 94.63/100
```

---

## FILE NAMING CONVENTION

All files must be named with max 15 characters, no accents/ñ/commas/&/symbols:
```
Pattern: {SECTION}{NUMBER}_{ABBREV}_{PROJ}
Examples:
  A1_RE_GODIN      (Resumen Ejecutivo for "El Godín")
  A2_SIN_GODIN     (Sinopsis)
  A3_GUION_GODIN   (Guion)
  A4_PCD_GODIN     (Propuesta Creativa Dirección)
  A5_MV_GODIN      (Material Visual)
  A6_SEC_GODIN     (Solidez Equipo Creativo)
  A7_PP_GODIN      (Propuesta Producción)
  A8_PR_GODIN      (Plan de Rodaje)
  A8_RC_GODIN      (Ruta Crítica)
  A9_PRES_GODIN    (Presupuesto Resumen)
  A9_DEG_GODIN     (Presupuesto Desglose)
  A9_FE_GODIN      (Flujo de Efectivo)
  A10_EXH_GODIN    (Propuesta Exhibición)
  B1_CV_GODIN      (CVs equipo)
  B2_NAC_GODIN     (Acreditación nacionalidad)
  B3_CON_GODIN     (Contratos)
  C1_EST_GODIN     (Estatus EFICINE)
  C2_IND_GODIN     (INDAUTOR)
  C3_BPC_GODIN     (Buenas prácticas)
  C4_FT_GODIN      (Ficha técnica)
  D1_COT_GODIN     (Cotizaciones)
  E1_EF_GODIN      (Esquema financiero)
  E2_CAE_GODIN     (Carta aportación exclusiva)
```

---

## OFFICIAL FORMATOS (TEMPLATES) THE APP MUST IMPLEMENT

The Lineamientos reference 11 official FORMATOS. The app must generate documents that conform to these structures:

### FORMATO 1 — Resumen Ejecutivo
Fields: Project title, ERPI name, genre (fiction/animation/documentary), category (opera prima/2nd+), estimated duration, shooting format, aspect ratio, synopsis (brief), director name, producer name, total budget, EFICINE amount requested, filming locations, estimated shooting dates, estimated completion date, estimated exhibition date.

### FORMATO 2 — Solidez del Equipo Creativo (CVs)
Fields per person: Full name, role, nationality, filmography (title, year, role, format, exhibition venues), education/training, awards/selections, hyperlinks to previous works.

### FORMATO 3 — Flujo de Efectivo
Structure: Rows = budget line items (by cuentas). Columns = funding sources (ERPI exclusive, each third-party contributor, EFICINE stimulus) × production stages (preproduction, production/rodaje, postproduction through copia final). Must reconcile with budget summary and esquema financiero.

### FORMATO 4 — Estatus Proyectos EFICINE Anteriores
Fields: Prior project titles, authorization dates, current status (bank data, transfer receipts, semestral reports, completion report, CPA report, exhibition report, updated ruta crítica), compliance status.

### FORMATO 5 — Cadena de Cesiones
Fields: Original author, each intermediary holder, dates of each transfer, final assignee (ERPI), description of rights transferred at each step.

### FORMATO 6 — Carta Compromiso Buenas Prácticas
Template letter committing to: respectful workplace, zero tolerance for violence/harassment/abuse, equity measures, environmental responsibility during filming.

### FORMATO 7 — Carta Compromiso Programa Interacción Cultural y Social
Template letter committing to participate in IMCINE's social/cultural interaction program.

### FORMATO 8 — Ficha Técnica
Fields: Project title, genre, duration, format, ERPI name, director, producer, screenwriter, cinematographer, editor, art director, cast (if known), logline, synopsis, director bio, production company bio, visual materials (stills/poster if available).

### FORMATO 9 — Esquema Financiero
Structure: Table showing ALL funding sources with amounts and percentages:
- ERPI Exclusive Contribution (cash + in-kind breakdown)
- Third-party contributions (each donor/coproducer listed separately)
- EFICINE Stimulus (amount requested)
- TOTAL = 100% of budget
Must be dated and signed by ERPI legal representative.

### FORMATO 10 — Carta de Aportación Exclusiva ERPI
Template letter: Legal rep declares ERPI's exclusive contribution amount (cash and/or in-kind), lists any third-party donations received, and commits those resources to the project.

### FORMATO 11 — Relación de CFDIs
Structure: Table listing prior expenditure CFDIs with: folio fiscal, date, issuer, concept, amount, tax amount.

---

## APP ARCHITECTURE — WHAT THE APP DOES

### Core Workflow: Screenplay → Carpeta

```
INPUT:
├── Screenplay PDF (the actual guion)
├── Project metadata (title, genre, director, producer, ERPI info)
├── Team CVs/filmography data
├── Financial data (budget range, funding sources, bank proof)
└── User-provided documents (contracts, INDAUTOR certs, IDs, etc.)

PROCESSING PIPELINE:
│
├── STEP 1: SCREENPLAY ANALYSIS ENGINE
│   ├── Parse screenplay (scene count, page count, locations, characters)
│   ├── Generate scene breakdown (INT/EXT, DAY/NIGHT, location list)
│   ├── Identify production complexity signals (stunts, VFX, water, animals, children, night shoots, company moves)
│   ├── Extract character list with scene counts
│   ├── Estimate shooting days (using Line Producer rates: 25-35 days for Mexican theatrical feature)
│   └── Generate synopsis and logline from screenplay content
│
├── STEP 2: DOCUMENT GENERATION (AI-powered, using three skill personas)
│   │
│   ├── [LINE PRODUCER] generates:
│   │   ├── A7: Propuesta de Producción (3 cuartillas)
│   │   │   └── Production strategy, logistics, crew organization, challenges, timeline rationale, location strategy
│   │   ├── A8a: Plan de Rodaje
│   │   │   └── Day-by-day shooting schedule from breakdown, grouped by location, INT/EXT, DAY/NIGHT
│   │   ├── A8b: Ruta Crítica
│   │   │   └── Month-by-month timeline: preproduction → production → postproduction → copia final → exhibition
│   │   ├── A9a: Resumen del Presupuesto
│   │   │   └── IMCINE-standard account structure, MXN, market rates from Mexico reference file
│   │   ├── A9b: Desglose del Presupuesto
│   │   │   └── Full sub-account breakdown, crew rates, equipment, locations, post, insurance, contingency (10%)
│   │   └── Shooting day estimate + complexity assessment
│   │
│   ├── [FINANCE ADVISOR] generates:
│   │   ├── A9d: Flujo de Efectivo (FORMATO 3)
│   │   │   └── Cash flow by source × stage, reconciled with budget and esquema financiero
│   │   ├── E1: Esquema Financiero (FORMATO 9)
│   │   │   └── Full financing structure: ERPI ≥20%, EFICINE ≤80%/$25M, all sources with amounts/percentages
│   │   ├── E2: Carta Aportación Exclusiva (FORMATO 10)
│   │   │   └── Declaration of ERPI's own contribution with documentation checklist
│   │   ├── Financial viability assessment
│   │   │   └── Cross-check: budget total vs. financing plan, EFICINE cap compliance, federal funding 80% cap
│   │   └── Prohibited expenditure flag
│   │       └── Scan budget for items EFICINE cannot fund (pre-stimulus expenses, distribution, carpeta prep, fixed assets, mark-ups)
│   │
│   ├── [LEMON LAWYER] generates:
│   │   ├── C2b: Contract template — Cesión Derechos Patrimoniales del Guion
│   │   │   └── With mandatory 3% clause, 10% advance or profit participation option
│   │   ├── B3: Contract templates — ERPI ↔ Producer and ERPI ↔ Director
│   │   │   └── With all required elements (title, role, fee matching budget, term, signatures)
│   │   ├── C3a: Carta Buenas Prácticas (FORMATO 6)
│   │   ├── C3b: Carta Interacción Cultural y Social (FORMATO 7)
│   │   ├── Chain of title assessment
│   │   │   └── Identify if FORMATO 5 (cadena de cesiones) or obra semejante docs are needed
│   │   ├── IP risk flags
│   │   │   └── Flag if script is adaptation, based on prior work, or has complex rights history
│   │   └── ERPI eligibility check
│   │       └── Verify: no more than 2 unexhibited prior EFICINE projects, no more than 3 submissions per period
│   │
│   └── [COMBINED] generates:
│       ├── A1: Resumen Ejecutivo (FORMATO 1) — from screenplay + project metadata
│       ├── A2: Sinopsis (3 cuartillas max) — from screenplay
│       ├── A6: Solidez Equipo Creativo (FORMATO 2) — from team CV data
│       ├── A10: Propuesta de Exhibición — from genre analysis + market intelligence
│       ├── C4: Ficha Técnica (FORMATO 8) — from all collected data
│       └── A11: Bonus points eligibility check + required documentation
│
├── STEP 3: VALIDATION ENGINE
│   ├── Cross-reference check: all amounts match across budget, flujo, esquema financiero, and contracts
│   ├── Verify ERPI ≥ 20% contribution
│   ├── Verify EFICINE ≤ 80% and ≤ $25M MXN
│   ├── Verify total federal sources ≤ 80%
│   ├── Verify screenwriter payment ≥ 3% of total cost
│   ├── Verify in-kind contributions ≤ 10% of total budget
│   ├── Verify in-kind per person ≤ 50% of their total fee
│   ├── Flag missing documents (any missing = automatic rejection)
│   ├── Flag date compliance (all supporting docs < 3 months old at registration close)
│   ├── Verify file naming convention (max 15 chars, no special characters)
│   └── Generate completeness checklist with traffic lights (🟢 complete, 🟡 needs attention, 🔴 missing)
│
└── STEP 4: OUTPUT
    ├── Complete carpeta as organized folder structure
    ├── All generated PDFs named per convention
    ├── Submission readiness report with score estimate
    ├── Missing documents checklist for user to complete
    └── Upload guide for estimulosfiscales.hacienda.gob.mx system
```

---

## DETAILED STEP-BY-STEP: FROM SCREENPLAY TO CARPETA

### PHASE 1: INTAKE (User provides)

**Screen 1 — Project Setup**
```
Required:
- Project title (exactly as it will appear in EFICINE system)
- Genre: Fiction / Animation / Documentary
- Category: Opera Prima / Second Feature+
- Estimated duration (minutes)
- Shooting format (digital/35mm/etc.)
- Aspect ratio
- Language(s)
- Estimated total budget (MXN)
- EFICINE amount to request (MXN)

ERPI Information:
- Company name (razón social, exactly as per acta constitutiva)
- RFC
- Legal representative name
- Fiscal domicile
```

**Screen 2 — Screenplay Upload**
```
- Upload screenplay PDF
- App parses: scene count, page count, locations, characters, INT/EXT/DAY/NIGHT breakdown
- User confirms/corrects breakdown data
```

**Screen 3 — Creative Team**
```
For each key creative role (Producer, Director, Screenwriter, DP, Art Director, Editor):
- Full name
- Nationality + ID type
- Filmography (title, year, role, exhibition venue)
- Education/training
- Awards/selections
- Links to prior work
- Fee (MXN) — must match budget
- In-kind contribution amount if any
```

**Screen 4 — Financial Structure**
```
- ERPI exclusive contribution: cash amount + in-kind amount
- Each third-party contributor: name, type (donor/coproducer/distributor/platform), amount, cash/in-kind
- EFICINE request amount
- App auto-calculates percentages and validates compliance
- App flags if any threshold is violated
```

**Screen 5 — Document Upload**
```
User uploads documents the app CANNOT generate:
- Acta constitutiva
- Poder notarial
- Legal rep ID
- Constancia Situación Fiscal
- INDAUTOR certificate(s)
- Bank statements or bank letters
- Insurance quote
- CPA quote
- Signed contracts (if already executed)
- International co-production recognition (if applicable)
- Prior EFICINE compliance docs (if applicable)
```

### PHASE 2: AI GENERATION

The app calls three AI personas sequentially:

**Pass 1 — Line Producer Analysis**
```
Input: Parsed screenplay data + budget parameters
Output:
1. Scene breakdown with complexity flags
2. Estimated shooting days with rationale
3. Preliminary shooting schedule (plan de rodaje)
4. Monthly ruta crítica
5. Budget summary (resumen) by IMCINE standard accounts
6. Budget detail (desglose) with market-rate crew/equipment costs
7. Propuesta de producción (3 cuartillas)
```

**Pass 2 — Finance Advisor Analysis**
```
Input: Budget from Pass 1 + financial structure from intake
Output:
1. Flujo de efectivo (FORMATO 3) — cross-referenced with budget
2. Esquema financiero (FORMATO 9) — with compliance validation
3. Carta aportación exclusiva (FORMATO 10)
4. Financial red flags report
5. Prohibited expenditure scan
```

**Pass 3 — Legal Review**
```
Input: All project data + uploaded legal docs
Output:
1. Contract templates (screenwriter cesión, producer agreement, director agreement)
2. Cartas compromiso (FORMATO 6 and 7)
3. Chain of title assessment
4. IP risk flags
5. ERPI eligibility verification
6. Missing legal document checklist
```

**Pass 4 — Combined Document Generation**
```
Input: All previous outputs + screenplay + project metadata
Output:
1. Resumen ejecutivo (FORMATO 1)
2. Sinopsis (3 cuartillas)
3. Solidez equipo creativo (FORMATO 2)
4. Propuesta de exhibición
5. Ficha técnica (FORMATO 8)
6. Bonus points eligibility assessment
```

### PHASE 3: VALIDATION + OUTPUT

**Validation Checks (automated):**
```
FINANCIAL CONSISTENCY:
□ Budget total = Esquema financiero total = Flujo de efectivo total
□ ERPI contribution ≥ 20% of total
□ EFICINE request ≤ 80% of total AND ≤ $25,000,000 MXN
□ Federal funding total (EFICINE + any FOCINE/IMCINE grants) ≤ 80%
□ Screenwriter fee ≥ 3% of total project cost (IVA included)
□ In-kind total ≤ 10% of total budget
□ Each person's in-kind ≤ 50% of their total fee
□ Flujo de efectivo = Budget resumen by accounts
□ All contributors in flujo match esquema financiero

CONTRACT CONSISTENCY:
□ Producer fee in contract = producer line in budget = producer line in flujo
□ Director fee in contract = director line in budget = director line in flujo
□ Screenwriter fee in cesión contract = screenwriter line in budget
□ Contract terms cover prep through post per ruta crítica
□ Project title identical across ALL documents

DOCUMENT COMPLETENESS:
□ All 5 sections (A through E) have required documents
□ All FORMATOS used where required
□ All documents in Spanish (translations attached for foreign-language originals)
□ File names ≤ 15 chars, no special characters
□ All PDFs ≤ 40 MB

DATE COMPLIANCE:
□ Insurance quote < 3 months old at registration close
□ CPA quote < 3 months old
□ Bank statements < 3 months old
□ All third-party support letters < 3 months old
□ All quotes/cotizaciones < 3 months old
```

**Output Package:**
```
/carpeta_[PROJECT_ABBREVIATION]/
├── README_SUBMISSION_GUIDE.pdf     ← Step-by-step upload instructions
├── VALIDATION_REPORT.pdf           ← All checks with pass/fail status
├── SCORE_ESTIMATE.pdf              ← Estimated score by rubric category
│
├── 00_ERPI/                        ← Chapter II documents
│   ├── II1_ACTA.pdf
│   ├── II2_PODER.pdf
│   ├── II3_ID.pdf
│   └── II4_CSF.pdf
│
├── A_PROPUESTA/                    ← Section A documents
│   ├── A1_RE_[PROJ].pdf
│   ├── A2_SIN_[PROJ].pdf
│   ├── A3_GUION_[PROJ].pdf
│   ├── A4_PCD_[PROJ].pdf
│   ├── A5_MV_[PROJ].pdf
│   ├── A6_SEC_[PROJ].pdf
│   ├── A7_PP_[PROJ].pdf
│   ├── A8_PR_[PROJ].pdf
│   ├── A8_RC_[PROJ].pdf
│   ├── A9_PRES_[PROJ].pdf
│   ├── A9_DEG_[PROJ].pdf
│   ├── A9_FE_[PROJ].pdf
│   └── A10_EXH_[PROJ].pdf
│
├── B_PERSONAL/                     ← Section B documents
│   ├── B1_CV_[PROJ].pdf
│   ├── B2_NAC_[PROJ].pdf
│   └── B3_CON_[PROJ].pdf
│
├── C_ERPI/                         ← Section C documents
│   ├── C1_EST_[PROJ].pdf
│   ├── C2_IND_[PROJ].pdf
│   ├── C3_BPC_[PROJ].pdf
│   └── C4_FT_[PROJ].pdf
│
├── D_COTIZ/                        ← Section D documents
│   └── D1_COT_[PROJ].pdf
│
└── E_FINANZAS/                     ← Section E documents
    ├── E1_EF_[PROJ].pdf
    ├── E2_CAE_[PROJ].pdf
    ├── E3_DON_[PROJ].pdf           ← if applicable
    └── E4_COPROD_[PROJ].pdf        ← if applicable
```

---

## IMCINE STANDARD BUDGET ACCOUNT STRUCTURE

The budget must use IMCINE's standard account categories. Here is the structure:

```
ABOVE THE LINE (ATL):
100 — Guion y Argumento (screenplay, rights, adaptation)
200 — Producción (producer fees, exec producer, line producer)
300 — Dirección (director fee, assistant directors)
400 — Elenco (cast — principals, supporting, extras, casting)

BELOW THE LINE (BTL):
500 — Departamento de Arte (art director, set design, props, wardrobe, makeup, SFX)
600 — Equipo Técnico (DP, camera crew, sound, gaffer, grip, electrical)
700 — Materiales y Equipo (camera rental, lighting, grip equipment, sound equipment, vehicles)
800 — Locaciones (location fees, permits, police, parking, catering, base camp)
900 — Laboratorio y Postproducción (editing, color, VFX, DI, sound mix, music, deliverables)

GENERAL:
1000 — Seguros y Garantías (production insurance, E&O)
1100 — Gastos Generales (office, phones, copying, legal, accounting, travel, per diems)
1200 — Imprevistos/Contingencia (10% standard for Mexico)
```

---

## BUDGET GENERATION RULES (Line Producer Persona)

When generating the budget from a screenplay breakdown:

**Crew Rates (Mexico, 2025-2026 benchmarks, weekly):**
```
Director:           Project fee (varies by budget tier)
Line Producer:      $35,000-$80,000 MXN/week
1st AD:             $25,000-$45,000 MXN/week
DP:                 $40,000-$90,000 MXN/week
Art Director:       $30,000-$60,000 MXN/week
Editor:             $25,000-$50,000 MXN/week
Sound Mixer:        $20,000-$35,000 MXN/week
Gaffer:             $18,000-$30,000 MXN/week
Key Grip:           $18,000-$28,000 MXN/week
Wardrobe:           $15,000-$25,000 MXN/week
Makeup:             $15,000-$25,000 MXN/week
```

**Fringe/Social Costs:**
- Union (STPC): 35-42% on top of gross wage
- Non-union: 25-30%

**Standard Allocations:**
- Contingency: 10% of BTL
- Insurance: ~2-3% of total budget
- CPA report: ~$80,000-$150,000 MXN
- Legal: ~1-2% of total budget
- Post-production: typically 15-25% of total budget
- Catering: $350-$600 MXN per person per day

**Shooting Day Estimation:**
- Low-budget (<$15M MXN): 18-25 days
- Mid-tier ($15-50M MXN): 28-38 days
- Premium ($50M+ MXN): 35-50 days
- Pages per day: 3-5 for drama, 4-6 for comedy
- Add days for: night shoots, stunts, water, multiple locations, children, animals

---

## FINANCIAL VALIDATION RULES (Finance Advisor Persona)

```python
# Core EFICINE compliance checks
assert erpi_contribution >= 0.20 * total_budget
assert eficine_request <= 0.80 * total_budget
assert eficine_request <= 25_000_000  # MXN cap
assert sum(federal_sources) <= 0.80 * total_budget
assert screenwriter_fee >= 0.03 * total_budget  # IVA included
assert total_in_kind_honorarios <= 0.10 * total_budget
for person in in_kind_contributors:
    assert person.in_kind <= 0.50 * person.total_fee
assert gestor_fee <= (0.04 * eficine_request if eficine_request > 10_000_000 else 0.05 * eficine_request)

# Cross-document reconciliation
assert budget_summary_total == budget_detail_total == cash_flow_total == esquema_financiero_total
for contributor in all_contributors:
    assert esquema_financiero[contributor] == cash_flow_total_by_source[contributor]
for account in budget_accounts:
    assert budget_summary[account] == cash_flow_total_by_account[account]
```

---

## LEGAL DOCUMENT RULES (Lemon Lawyer Persona)

### Screenwriter Rights Contract (Cesión Derechos Patrimoniales)

**Mandatory elements:**
1. Parties: Author(s) and ERPI (full legal names)
2. Work identified: Script title (must match EFICINE system registration exactly)
3. Rights transferred: Patrimonial rights (derechos patrimoniales) — reproduction, distribution, public communication, transformation
4. Moral rights acknowledged (derechos morales are non-transferable under Mexican law — include waiver of exercise clause)
5. Compensation: Minimum 3% of total project cost (IVA included)
6. Payment proof: EITHER 10% advance paid (with CFDI + bank transfer proof) OR 10% profit participation clause
7. Territory: Worldwide
8. Term: Sufficient to cover production + exhibition windows
9. Must be registered at INDAUTOR (certificate required)
10. If the guion is obra por encargo (work for hire), different rules apply — 10% advance must be paid, no profit participation option

### Producer/Director Contracts

**Mandatory elements:**
1. Project title (identical to EFICINE registration)
2. Role and duties description
3. Fee amount (MUST match budget line item and flujo de efectivo — highlight in colored box per IMCINE recommendation)
4. If in-kind contribution: must be stated in contract and match esquema financiero
5. Contract term: must cover preproduction through postproduction per ruta crítica
6. Signatures: autograph or digital, both ERPI legal rep and the contracted person

### Chain of Title (FORMATO 5)

Required when rights have passed through intermediaries:
- Document each transfer from original author → each subsequent holder → ERPI
- Each transfer must have supporting documentation (contracts, certificates)
- For adaptations: include rights to underlying work (novel, play, etc.)

---

## EXHIBITION PROPOSAL GUIDELINES

The propuesta de exhibición must include:

1. **Distribution strategy** — commercial, cultural, or mixed circuit (sala comercial = Cinépolis/Cinemex, cultural = Cineteca/filmotecas, mixed = both)
2. **Cultural/social circulation strategy** — how the film contributes to cultural identity
3. **Target audience** — defined by age and gender, coherent with the film's genre and content
4. **Estimated reach** — number of copies/screens/projections, estimated spectators, estimated box office revenue or license fees (must be coherent with budget and genre)
5. **Festival strategy** — if applicable, name specific festivals and justify why they're appropriate for this film's genre/theme

---

## IMPLEMENTATION NOTES FOR CLAUDE CODE

### Tech Stack
```
Frontend: React + Tailwind + shadcn/ui
Backend: Firebase (Auth, Firestore, Storage, Functions)
PDF Parsing: pdf-parse or pdf.js for screenplay extraction
PDF Generation: @react-pdf/renderer or jsPDF for output documents
AI: Anthropic API (Claude) for document generation
Language: Spanish (all generated content must be in Spanish)
Currency: MXN throughout (flag USD/EUR conversions where needed)
```

### Data Model (Firestore)
```
projects/{projectId}
├── metadata (title, genre, category, ERPI info, dates)
├── screenplay (parsed data: scenes, locations, characters, breakdown)
├── team/{memberId} (name, role, nationality, filmography, fee)
├── financials (budget, esquema, flujo, contributions)
├── documents/{docId} (uploaded files: references, URLs, status)
├── generated/{docId} (AI-generated documents: content, version, timestamp)
└── validation (check results, completeness score, flags)
```

### Key UX Principles
- **Wizard flow** — guide user step by step, never show all complexity at once
- **Progressive disclosure** — show what's needed now, reveal complexity as relevant
- **Real-time validation** — show compliance status as data is entered
- **Traffic light dashboard** — 🟢🟡🔴 for every document and every validation check
- **One-click regeneration** — if user changes data, regenerate affected documents
- **Export as ZIP** — final carpeta downloadable as organized folder structure
- **Spanish UI** — entire interface in Spanish, all generated content in Spanish

### AI Prompt Architecture

**CRITICAL: All runtime prompts are in the `prompts/` folder and are written 100% in Spanish.**

Do NOT write inline English prompts for document generation. Always load the corresponding `.md` file from `prompts/` and inject project data into the `{{variable}}` placeholders.

Each document generation call includes:
1. The Spanish system prompt from `prompts/` (sets role, EFICINE context, evaluation criteria, format rules)
2. Project data injected in Spanish (amounts as `$X,XXX,XXX MXN`, dates as "Agosto 2026")
3. The language guardrail block from `POLITICA_IDIOMA.md` (appended automatically to every prompt)
4. Cross-reference data from other generated documents (for consistency)

Execution order (prompts depend on each other's outputs):
```
1. analisis_guion.md          → extracts screenplay data (foundation for everything)
2. a7_propuesta_produccion.md → generates production proposal
3. a8_plan_rodaje_y_ruta.md   → generates schedule + critical path
4. a9_presupuesto.md          → generates budget (summary + detail)
5. documentos_financieros.md  → generates flujo, esquema financiero, carta aportación
6. documentos_legales.md      → generates contract templates, cartas compromiso
7. documentos_combinados.md   → generates resumen ejecutivo, sinopsis, solidez, ficha técnica, exhibición, pitch
```

Post-generation, the app must run validation from `validation/rules.md` to verify cross-document consistency.

**UI text is NOT generated by AI** — it's hardcoded in Spanish in the React components. Use a `locales/es.json` or equivalent i18n file with all UI strings in Spanish. Do NOT use English placeholders that get "translated later." Write Spanish-first.

**Example: To generate A7 (Propuesta de Producción), the app loads `prompts/a7_propuesta_produccion.md`, substitutes `{{variables}}` with project data, appends the language guardrail block, and sends to Claude. The entire prompt-response cycle happens in Spanish. See the actual prompt file for the complete system prompt.**

---

## WHAT THE USER STILL MUST PROVIDE (APP CANNOT GENERATE)

These documents require real-world actions and cannot be AI-generated:

1. **Acta Constitutiva** — notarial instrument (user has it or gets it from their notary)
2. **Poder Notarial** — notarial instrument
3. **ID copies** — physical/digital copies of INE/passport for legal rep and all creative team
4. **Constancia de Situación Fiscal** — downloaded from SAT portal
5. **INDAUTOR certificates** — must be registered at INDAUTOR (user initiates this process)
6. **Bank statements or bank letters** — from ERPI's bank, proving available funds
7. **Insurance quote** — from an actual insurance company
8. **CPA report quote** — from an actual CPA registered with SAT
9. **Signed contracts** — the app generates TEMPLATES, but they must be printed, signed (autograph or digital), and scanned
10. **International co-production recognition** — if applicable, from IMCINE's Dirección de Apoyo a la Producción
11. **E.firma** — required for system registration (user's own SAT credential)
12. **Material Visual (A5)** — reference images, mood boards, location photos, design concepts (user/director provides)
13. **Director's Propuesta Creativa (A4)** — the director must write this personally (app can provide structure/template)
14. **Hyperlinks to prior works** — actual URLs to films on Vimeo/platforms

---

## CRITICAL GOTCHAS THAT KILL APPLICATIONS

Based on the Lineamientos, these are the most common rejection triggers:

1. **ANY missing document** = not evaluated. Period. No exceptions.
2. **Title mismatch** — project title must be IDENTICAL across every single document and the online system
3. **Fee mismatches** — if the producer's fee in the contract says $X but the budget says $Y, rejected
4. **INDAUTOR title mismatch** — the INDAUTOR certificate title must match the registered project title
5. **Expired documents** — anything older than 3 months at registration close date is invalid
6. **Screenshots as bank proof** — screenshots of online banking are explicitly rejected
7. **Missing e.firma** — registration requires the ERPI's electronic signature
8. **Screenwriter underpayment** — below 3% of total cost = rejected
9. **In-kind over 10%** — total in-kind via honorarios exceeding 10% of budget = rejected
10. **File naming violations** — accents, ñ, commas, &, or >15 characters = system may reject
11. **Documents not in Spanish** — foreign-language documents must include Spanish translation
12. **Budget items EFICINE can't fund** — if the flujo shows EFICINE money going to prohibited items, rejected
13. **ERPI paying itself** — individuals who are the ERPI entity cannot receive compensation from EFICINE funds
14. **4th submission attempt** — a project can only be submitted 3 times (rejection for incomplete docs or not being recommended counts; not receiving funds due to cap exhaustion does NOT count)
