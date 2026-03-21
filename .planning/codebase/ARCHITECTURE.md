# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Three-layer agent architecture that separates concerns into Intent (what to do), Decision-making (how to route), and Execution (deterministic code).

**Key Characteristics:**
- Directives as executable SOPs in natural language
- Orchestration layer handles intelligent routing and error recovery
- Deterministic Python execution layer with testable, reliable scripts
- Self-annealing loop: errors → fixes → directive updates → stronger system
- Environment-driven secrets management, temporary file handling, cloud-based deliverables

## Layers

**Layer 1 — Directives (Intent):**
- Purpose: Define procedural steps, inputs, outputs, edge cases for workflows
- Location: `directives/`
- Contains: Markdown SOPs with goal, inputs, tools, steps, outputs, learnings sections
- Depends on: None (defines what should happen)
- Used by: Orchestration layer to understand task requirements

**Layer 2 — Orchestration (Decision-Making):**
- Purpose: Route work to appropriate tools, interpret results, handle errors, update directives
- Location: This is the LLM agent operating within the system (no explicit code location)
- Contains: Decision logic for tool selection, error handling, user communication
- Depends on: Directives and Execution scripts
- Used by: User (human intent entry point)

**Layer 3 — Execution (Deterministic Code):**
- Purpose: Handle API calls, data transformations, file I/O, cloud uploads—all testable and reliable
- Location: `execution/`
- Contains: Python scripts with clear inputs, outputs, error handling
- Depends on: `.env` for credentials, `execution/utils.py` for shared helpers
- Used by: Orchestration layer to perform work

## Data Flow

**Typical Workflow:**

1. User provides intent → Orchestrator reads relevant directive
2. Orchestrator gathers inputs (asks user if missing)
3. Orchestrator validates inputs against directive requirements
4. Orchestrator calls appropriate execution script(s) in correct sequence
5. Script executes work: reads `.env` for secrets, writes intermediates to `.tmp/`, produces output
6. Orchestrator interprets results, handles errors
7. Orchestrator delivers cloud-based deliverable to user
8. Orchestrator updates directive's "Edge Cases & Learnings" with new knowledge

**Error Recovery Loop:**

1. Script fails with error → Orchestrator reads stack trace
2. Orchestrator identifies root cause (API limits, missing secret, logic bug, etc.)
3. Orchestrator fixes script and re-tests (unless paid credits/tokens consumed)
4. Orchestrator updates directive with new edge case info
5. System is now stronger for next similar failure

**State Management:**
- **In-flight state:** `.tmp/` directory (intermediate files, always regeneratable)
- **Configuration:** `.env` file (secrets, API keys, environment variables)
- **Persistent directives:** `directives/` (living documents, updated over time)
- **Persistent scripts:** `execution/` (refined through self-annealing)
- **Final deliverables:** Cloud services (Google Sheets, Slides, etc.)

## Key Abstractions

**Directive:**
- Purpose: Codify a repeatable workflow into a natural-language SOP
- Examples: `directives/scrape_pricing.md`, `directives/weekly_kpi_digest.md`
- Pattern: Goal + Inputs + Tools/Scripts + Steps + Outputs + Edge Cases

**Execution Script:**
- Purpose: Implement one deterministic task (API call, data transform, file I/O)
- Examples: `execution/scrape_pricing.py`, `execution/send_email.py`
- Pattern: Load env vars → perform work → write intermediates → produce output

**Shared Utilities (`execution/utils.py`):**
- `env(key)` — retrieve environment variable with required/default semantics
- `log` — pre-configured logger
- `read_json(path)`, `write_json(path, data)` — JSON I/O helpers
- `tmp_path(filename)` — get a path inside `.tmp/` for intermediates

**Skill:**
- Purpose: Portable, reusable capability packaged with documentation and code
- Examples: `skills/playwright-browser-automation/`, `skills/api-design-reviewer/`
- Pattern: SKILL.md documentation + optional code (JS, templates, helpers)
- Scope: 402 skills across 27 categories, installed and indexed

## Entry Points

**User Intent:**
- Location: User provides prompt/request
- Triggers: User request containing task that should map to a directive
- Responsibilities: Gather context, identify relevant directive, ask for missing inputs

**Orchestrator Decision Point:**
1. Check if directive exists: `directives/[name].md`
2. Check if execution script exists: `execution/[script].py`
3. Validate inputs against directive requirements
4. Call script with correct parameters
5. Handle result or error

**Directive Template:**
- Location: `directives/_TEMPLATE.md`
- Used as: Starting point for creating new directives
- Ensures: Consistent structure across all SOPs

## Error Handling

**Strategy:** Expect failures, capture learning, improve system.

**Patterns:**

1. **Missing Environment Variable:**
   - Script calls `env(key)` which raises if missing
   - Orchestrator catches, directs user to set variable
   - Script re-runs after variable is set

2. **API Rate Limit:**
   - Script fails with rate limit error
   - Orchestrator reads API docs for batch/bulk endpoints
   - Orchestrator rewrites script to use batch with exponential backoff
   - Orchestrator updates directive with: "API rate-limits at X req/min. Script uses batch endpoint."

3. **Missing Input:**
   - Orchestrator checks directive's "Inputs" section
   - If input missing from user, asks user explicitly
   - User provides input, workflow continues

4. **Unrecoverable Error:**
   - Orchestrator interprets error, logs context
   - Orchestrator reports issue to user with suggested fix
   - Directive updated with edge case if applicable

## Cross-Cutting Concerns

**Logging:**
- Tool: Python `logging` module, pre-configured in `execution/utils.py`
- Pattern: All scripts import `log` from utils, use `log.info()`, `log.error()` for tracking
- Location: Console output (no persistent log files by design)

**Validation:**
- Inputs: Orchestrator validates against directive "Inputs" section before calling script
- Outputs: Orchestrator checks that deliverable exists and is accessible
- Secrets: Scripts use `env(key)` which fails fast if missing

**Authentication:**
- Pattern: All secrets stored in `.env` file (in `.gitignore`)
- Access: Scripts call `env(key)` to retrieve credentials at runtime
- Cloud OAuth: `credentials.json`, `token.json` for Google Workspace auth (in `.gitignore`)

**Temporary Files:**
- Location: `.tmp/` directory (in `.gitignore`)
- Lifecycle: Created during execution, never committed, safe to delete and regenerate
- Pattern: Use `tmp_path(filename)` utility to get consistent paths

---

*Architecture analysis: 2026-03-20*
