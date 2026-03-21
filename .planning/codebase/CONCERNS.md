# Carpetify — Technical Concerns

## Project Status
**Pre-code / Specification phase.** Concerns relate to specification quality, architectural risks, and implementation challenges rather than existing code debt.

## High Priority

### 1. AI Output Quality & Consistency
- **Risk:** Claude-generated Spanish documents must meet professional Mexican film industry standards. Evaluators read hundreds of carpetas — generic or AI-sounding prose will score poorly.
- **Evidence:** `directives/politica_idioma.md` explicitly warns against vague AI output: *"La película será filmada en diversas locaciones"* is flagged as unacceptable vs. specific location/scene detail.
- **Mitigation needed:** Rigorous prompt engineering, output quality testing with domain experts, human review workflow before export.

### 2. Cross-Document Financial Consistency
- **Risk:** The "golden equation" (`budget = cash flow = financial scheme = SHCP system`) is the #1 source of EFICINE rejections. Any $1 MXN mismatch = automatic rejection.
- **Evidence:** `references/validation_rules.md` Rule 1 + `directives/app_spec.md` "CRITICAL GOTCHAS" section.
- **Mitigation needed:** Single source of truth for financial data, computed fields (not manually entered), cascade updates when any financial value changes.

### 3. Sequential AI Pipeline Dependencies
- **Risk:** The 7-pass AI pipeline is strictly sequential — each prompt depends on prior outputs. If Pass 1 (screenplay analysis) produces incorrect data, all downstream documents inherit the error.
- **Evidence:** `prompts/README.md` shows the dependency chain.
- **Mitigation needed:** User confirmation step after Pass 1 (screenplay analysis), ability to regenerate from any point in the pipeline, clear dependency tracking.

## Medium Priority

### 4. Deleted Source Files
- **Concern:** `execution/utils.py` and `requirements.txt` were deleted (visible in git status). This suggests a prior Python-based approach was abandoned.
- **Impact:** Low — the project is restarting with React + Firebase per current specs.

### 5. Large Specification Surface Area
- **Concern:** The specification documents are extremely detailed (~800 lines in `app_spec.md` alone, 6 JSON schemas totaling ~1500 lines, 10 AI prompts). Implementation must track hundreds of specific EFICINE rules.
- **Risk:** Specifications may have internal inconsistencies or gaps that surface during implementation.
- **Mitigation needed:** Phase-by-phase implementation with validation testing at each step (per `CLAUDE.md` build phases).

### 6. PDF File Size & Naming Constraints
- **Risk:** Generated PDFs must be ≤40 MB each with file names ≤15 characters (ASCII only, no accents/ñ). Spanish project titles with accents must be sanitized.
- **Evidence:** `schemas/export_manager.json` specifies `pattern: "^[A-Za-z0-9_]{1,15}$"`.
- **Mitigation needed:** File naming sanitizer with explicit test coverage for edge cases (ñ, accents, long titles).

### 7. No Authentication/Authorization Design
- **Concern:** Firebase Auth is listed as part of the stack, but no auth design details exist (roles, permissions, data isolation between projects/users).
- **Risk:** Multi-user scenarios not addressed — can one user see another's projects? Who can edit vs. view?

### 8. Prompt Injection via Screenplay Content
- **Risk:** User-uploaded screenplays are parsed and injected into AI prompts. Malicious screenplay content could attempt prompt injection to alter document generation.
- **Mitigation needed:** Sanitize screenplay text before prompt injection, use system prompt separation, validate AI outputs against expected structure.

## Low Priority

### 9. No Offline Support Design
- **Concern:** Firebase-dependent architecture requires internet for all operations. Film producers may work in locations with poor connectivity.

### 10. Skills Directory Bloat
- **Concern:** `skills/` contains ~80+ skill directories that appear to be Claude Code marketplace skills unrelated to the Carpetify project. These bloat the repository.
- **Impact:** No functional impact, but adds noise to the repo.

### 11. Missing Error Recovery for AI Pipeline
- **Concern:** No specification for what happens when an AI generation call fails mid-pipeline (e.g., API timeout at Pass 4). Partial state management not addressed.

### 12. Currency Conversion for International Co-productions
- **Concern:** International co-production mode requires foreign currency → MXN conversion at registration date exchange rate. No specification for how exchange rates are obtained or validated.
- **Evidence:** `schemas/modulo_e.json` mentions `tipo_cambio_mxn` requirement.

## Security Considerations

### Sensitive Data Handling
- `.env` file exists (should contain API keys, Firebase config)
- Bank statements, legal documents, and personal IDs will be stored in Firebase Storage
- ERPI financial data (budgets, contribution amounts) is sensitive business data
- **Need:** Firebase Security Rules for Firestore + Storage, proper authentication gates, data encryption at rest

### Regulatory Compliance
- Mexican data protection law (LFPDPPP) may apply to personal data (IDs, addresses, financial info)
- EFICINE submission data may have retention requirements
- No privacy policy or data handling specification exists yet
