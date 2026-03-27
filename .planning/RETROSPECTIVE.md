# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — EFICINE Carpeta Generator

**Shipped:** 2026-03-25
**Phases:** 9 | **Plans:** 31 | **Tasks:** 64

### What Was Built
- 5-screen Spanish intake wizard with multi-project support, auto-save, compliance panel, dark mode
- Screenplay PDF processing pipeline (upload → extract → Claude analysis)
- 4-pass AI document generation producing 21 documents with staleness tracking and one-click regeneration
- 17-rule validation engine with real-time traffic lights, viability + artistic scoring
- Export manager: 15 PDF templates, IMCINE file naming, language check, ZIP packaging
- Full data wiring: all validation rules receive correct Firestore data, scoring signals populated

### What Worked
- **Phase-by-phase data dependency chain** — each phase cleanly consumed the prior phase's output, enabling parallel development within phases
- **Tiered validation (D-11)** — instant/medium/all tiers kept the UI responsive while running 17 rules
- **TDD for validation rules** — RED→GREEN approach caught bugs early in Phases 4, 6, 9
- **Milestone audit + gap closure cycle** — the audit after Phase 6 caught 4 cross-phase wiring gaps that per-phase verification missed; phases 7-9 closed them systematically
- **Pre-written AI prompts** — Handlebars template injection with `{{variables}}` produced consistent, domain-accurate documents

### What Was Inefficient
- **3 gap closure phases (7-9)** — per-phase verification passed but cross-phase integration had namespace mismatches, stub functions, and role name inconsistencies. Earlier integration testing would have caught these during the original phases
- **Phase 01 VERIFICATION.md never re-verified** — LANG-03 gap was fixed by Phase 06 but the verification file still shows `gaps_found`
- **Pre-existing TS errors accumulated** — 30 TypeScript errors built up across phases 3-5 and weren't fixed until a quick task at the end

### Patterns Established
- **Centavos-only financial arithmetic** — all money stored as integer centavos, formatted only at display via `formatMXN()`
- **Locale-first strings** — all UI strings in `src/locales/es.ts`, never hardcoded in components
- **Validation as pure functions** — each rule is a testable pure function; engine orchestrates, hook subscribes
- **EXPORT_FILE_MAP as source of truth** — single registry maps docId → filename template → PDF template → folder
- **`useAutoSave` with debounce + retry** — 1500ms debounce, 3 retries with exponential backoff, flush on unmount

### Key Lessons
1. **Cross-phase integration needs testing at milestone level, not just per-phase** — the namespace mismatch (VALD-06) was invisible to per-phase verification because the writer (Phase 1) and reader (Phase 4) were verified independently
2. **Stubs should be flagged as explicit TODOs with tracking** — `extractLinks()` returning `[]` and `outputFiles` never populated were silent failures that only surfaced in the milestone audit
3. **Fix TS errors continuously, not in batches** — accumulating 30 errors across phases creates a cleanup task; fixing per-commit keeps the build green

### Cost Observations
- Model mix: ~70% Opus (planning, execution), ~25% Sonnet (verification, checking), ~5% Haiku (Claude API in Cloud Functions)
- 5-day build from scaffold to shipped v1.0
- Gap closure phases (7-9) added ~1 day but were essential for production readiness

---

## Milestone: v2.0 — Multi-User & Extended Modalities

**Shipped:** 2026-03-27
**Phases:** 7 | **Plans:** 21 | **Tasks:** 46

### What Was Built
- Firebase Auth with Google sign-in, 4-role RBAC, and email-based project invitations via Resend
- Real-time collaboration: simultaneous editing, section locking with idle auto-release, presence indicators
- Field-level activity log with 30-second coalescing, day-grouped feed, filter pills, and badge count
- Document version history with 10-version prune, side-by-side diff (prose + structured), and one-click revert
- AI pre-submission review: 5 IMCINE evaluator personas, 2-pass architecture (parallel + coherence), checklist summary

### What Worked
- Wave-based parallel execution: Plans 14-01 and 14-02 ran simultaneously without conflicts (backend + frontend split)
- UI-SPEC design contracts prevented ad-hoc styling decisions during execution — 6-dimension checker caught typography and spacing issues early
- Gap closure cycle (audit -> plan gaps -> execute -> re-audit) cleanly resolved the Phase 12 verification gap and Firestore rule omission
- Copy-forward revert pattern (D-09) was simpler to implement than pointer-based revert would have been
- Client-side activity logging (D-11 override) was the right call — avoided Cloud Function cold-starts for every auto-save

### What Was Inefficient
- Phase 12 shipped without VERIFICATION.md — caught only at milestone audit, requiring a gap closure phase
- Phase 11 TeamMembers component was built but not rendered in any UI — caught by verifier but should have been caught during plan execution
- Wave 0 test stubs (Phases 13-15) were not always resolved by the implementing plans — required gap closure or manual intervention
- D-10 (staleness cascade) and D-11 (Cloud Function logging) in Phase 13/14 CONTEXT.md conflicted with RESEARCH.md recommendations — required user override decisions during plan verification

### Patterns Established
- UI-SPEC -> Plan -> Execute pipeline for frontend phases (Phases 13, 14, 15 all used this)
- Wave 0 test stubs as the first plan in every phase for Nyquist compliance
- `writeActivityEntry` fire-and-forget pattern for non-critical logging from hooks
- Soft cascade (warning-only) as default for document content changes vs hard cascade for input data changes
- `--no-verify` on parallel executor commits, hooks validated once post-wave

### Key Lessons
1. Always create VERIFICATION.md during execute-phase — never skip the verifier step
2. Context decisions that conflict with research findings should be flagged to the user immediately, not silently overridden by the planner
3. Wave 0 test stubs should be mandatory (not optional) — the planner should always create a 00-PLAN.md when VALIDATION.md exists
4. Integration checker at milestone audit is essential — it caught the userProjects Firestore rule gap that phase-level verification missed

### Cost Observations
- Model mix: Opus for planning/execution, Sonnet for checking/verification
- 7 phases completed in ~2 days of development sessions
- Parallel execution (Wave 1 plans running simultaneously) saved significant wall-clock time on Phases 14 and 15

---

## Cross-Milestone Trends

| Metric | v1.0 | v2.0 |
|--------|------|------|
| Phases | 9 | 7 |
| Plans | 31 | 21 |
| Tasks | 64 | 46 |
| Requirements | 49 | 21 |
| LOC | ~30K | ~40K |
| Duration | 5 days | 2 days |
| Gap closure phases | 3 | 1 |
| UI-SPEC phases | 0 | 3 |

**Trend:** v2.0 was more complex (auth + collaboration + versioning + AI review) but executed faster per-phase due to established patterns from v1.0. UI-SPEC design contracts and Wave 0 test stubs were new practices that improved quality but added planning overhead.
