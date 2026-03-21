# External Integrations

**Analysis Date:** 2025-03-20

## APIs & External Services

**Anthropic Claude API:**
- SDK: `anthropic` >=0.39.0
- Used in: `skills/mcp-builder/scripts/` - MCP server development and evaluation
- Auth: ANTHROPIC_API_KEY (environment variable)
- Purpose: LLM capabilities for agent decision-making and task execution

**Model Context Protocol (MCP):**
- SDK: `mcp` >=1.1.0
- Used in: `skills/mcp-builder/` - Building MCP servers for tool integration
- Purpose: Standardized protocol for LLMs to interact with external services
- Connection types supported:
  - stdio - Local process execution
  - streamable HTTP - HTTP-based server communication
  - SSE - Server-Sent Events for real-time updates

## Browser Automation

**Web Automation:**
- Playwright ^1.57.0 - Browser automation and web scraping
  - Location: `skills/playwright-browser-automation/`
  - Supported browsers: Chromium, Firefox, WebKit
  - Headless mode: Configurable via environment
  - Header injection: Supports custom HTTP headers via environment variables
  - Entry point: `skills/playwright-browser-automation/run.js`
  - Supports inline code execution, file-based scripts, and stdin input

## Media Processing

**Image & Video Services:**
- FFmpeg (via imageio-ffmpeg) - Video encoding and frame capture
- No external service; local processing only
- Used in: `skills/slack-gif-creator/core/` for GIF creation from frames

**File Storage:**
- Local filesystem only
- Intermediate files: `.tmp/` directory (not committed)
- Output files generated to project directories

## Data Processing

**Document Processing:**
- LibreOffice (soffice) - Office document automation
  - Used in: `skills/xlsx/scripts/office/`
  - Handles: XLSX, DOCX, PPTX files
  - No external service required; local installation needed
- PDF processing: Local PDF manipulation libraries
  - Used in: `skills/pdf/scripts/` for form filling, field extraction

## Authentication & Identity

**External Auth:**
- Not detected as primary system
- Individual skills may include auth (e.g., Stripe, Supabase, GitHub)
- MCP connection types support various auth mechanisms:
  - HTTP headers for token-based auth
  - Environment variables for credentials
  - Service account credentials (if implemented in specific MCP servers)

## Caching

**Caching Strategy:**
- Not detected in core framework
- Individual skills may implement caching (e.g., skill libraries like `cal-com-automation`, `notion-automation`)

## Monitoring & Observability

**Error Tracking:**
- Custom logging via Python logging module
  - Configured in: `execution/utils.py`
  - Log level: INFO
  - Format: timestamp [LEVEL] message
  - Logger name: "carpetify"

**Logging Framework:**
- Python `logging` module (standard library)
- No external APM/monitoring detected

## CI/CD & Deployment

**Version Control:**
- Git repository (/.git present)
- Main branch for deployment

**Continuous Integration:**
- Not detected
- Manual execution model via CLI

**Local Execution:**
- Scripts run via Python (`python3`) or Node.js (`node`)
- npm setup for Playwright skill dependencies
- No containerization (Docker) detected

## Environment Configuration

**Required Environment Variables:**
- ANTHROPIC_API_KEY - For Claude API access (mcp-builder skill)
- HEADLESS - Playwright headless mode (default: true)
- SLOW_MO - Playwright action delay in ms (optional)
- PW_HEADER_NAME / PW_HEADER_VALUE - Single custom HTTP header for auth
- PW_EXTRA_HEADERS - JSON object with multiple headers

**Configuration Files:**
- `.env` - Secrets and API keys (not committed)
- `.env.example` - Not detected; recommend creating for documentation
- JSON config files in individual skills (e.g., `skills/mcp-builder/scripts/example_evaluation.xml`)

**Secrets Storage:**
- `.env` file (recommended practice)
- credentials.json, token.json - OAuth tokens (in .gitignore)
- Never commit secrets to git

## Webhooks & Callbacks

**Incoming Webhooks:**
- Not detected in core framework
- Individual skills may support webhooks (e.g., Slack, GitHub, Stripe skills)

**Outgoing Webhooks/Events:**
- No direct webhook support detected
- MCP protocol enables event-based communication with external services
- Individual MCP servers may implement event streaming

## Integration Patterns

**MCP Server Pattern:**
- `skills/mcp-builder/scripts/connections.py` - Lightweight connection handling
  - Abstracts stdio, HTTP, and SSE connection types
  - Supports async context manager pattern
  - Manages ClientSession lifecycle

**Skill Architecture:**
- Each skill in `skills/` directory is self-contained
- Skills can be standalone or require external service integration
- No shared integration library detected; each skill manages its own dependencies

## External Service Skills

**Skills with External Integrations (partial list detected):**
- `skills/stripe-integration-expert/` - Stripe payment platform
- `skills/cal-com-automation/` - Calendar automation
- `skills/supabase-automation/` - Database and auth (Supabase)
- `skills/mailchimp-automation/` - Email marketing
- `skills/notion-automation/` - Note-taking and database
- `skills/freshservice-automation/` - IT service management
- `skills/bamboohr-automation/` - HR management
- And 200+ other skill integrations (see `skills/MANIFEST.md`)

---

*Integration audit: 2025-03-20*
