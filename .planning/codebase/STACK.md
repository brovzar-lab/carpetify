# Technology Stack

**Analysis Date:** 2025-03-20

## Languages

**Primary:**
- Python 3.9.6 - Core execution scripts, skill implementations
- JavaScript (Node.js) - Browser automation with Playwright
- Markdown - Documentation and skill definitions

**Secondary:**
- YAML - Configuration (Claude/Gemini/Agent instructions)
- JSON - Configuration files, data interchange

## Runtime

**Environment:**
- Node.js v25.6.1 - JavaScript/Playwright execution
- Python 3.9.6 - Python script execution

**Package Manager:**
- npm - JavaScript dependencies (Playwright skill)
- pip - Python dependencies (no central lock file; managed per-skill)
- No monolithic lock file strategy detected

## Frameworks

**Browser Automation:**
- Playwright ^1.57.0 - Browser automation and web testing
  - Location: `skills/playwright-browser-automation/`
  - Supports: Chromium, Firefox, WebKit engines

**Python Core:**
- python-dotenv >=1.0.0 - Environment variable management
- anthropic >=0.39.0 - Anthropic Claude API client (in mcp-builder)
- mcp >=1.1.0 - Model Context Protocol (in mcp-builder)

**Image/Media Processing:**
- Pillow >=10.0.0 - Image manipulation
- imageio >=2.31.0 - Image I/O and video reading
- imageio-ffmpeg >=0.4.9 - FFmpeg bindings for video encoding
- numpy >=1.24.0 - Numerical computing (for frame data)
  - Location: `skills/slack-gif-creator/core/`

**Office Document Processing:**
- LibreOffice (soffice) - OpenOffice/LibreOffice automation
  - Location: `skills/xlsx/scripts/office/`

**PDF Processing:**
- Libraries in `skills/pdf/scripts/` - PDF manipulation (form filling, extraction)

## Key Dependencies

**Critical Infrastructure:**
- anthropic - Claude API access for agent operations
- mcp - Model Context Protocol for extensible tool communication
- python-dotenv - Secure environment variable loading (.env)

**Media & Image Processing:**
- imageio + imageio-ffmpeg - Video frame capture and encoding pipeline
- Pillow - Core image operations
- numpy - Array-based image data manipulation

**Browser Automation:**
- Playwright - Cross-browser automation (headless + headed modes)

## Configuration

**Environment:**
- `.env` file (not committed, in .gitignore) - Stores API keys, auth tokens
- Environment variables via `python-dotenv.load_dotenv()`
- Playwright helpers read environment variables:
  - `HEADLESS` - Control headless mode (default: true)
  - `SLOW_MO` - Add delay between actions (ms)
  - `PW_HEADER_NAME` / `PW_HEADER_VALUE` - Single HTTP header for authentication
  - `PW_EXTRA_HEADERS` - JSON object for multiple headers

**Build:**
- npm scripts in `skills/playwright-browser-automation/package.json`:
  - `setup` - Install dependencies and Chromium browser
  - `install-all-browsers` - Install Chromium, Firefox, WebKit

## Platform Requirements

**Development:**
- Python 3.9+ with pip
- Node.js 14.0+ with npm
- LibreOffice (for XLSX/DOCX processing in skills)

**Production:**
- Node.js 14.0+ for Playwright skill execution
- Python 3.9+ for execution scripts
- FFmpeg (via imageio-ffmpeg wheel) for video encoding
- LibreOffice (for document processing skills)
- Anthropic API access for Claude models

## Scripts & Entry Points

**Python:**
- `execution/utils.py` - Shared utility functions for all execution scripts
  - Environment loading via `load_dotenv()`
  - JSON read/write helpers
  - Temp file management (`.tmp/` directory)
  - Logging setup

**JavaScript:**
- `skills/playwright-browser-automation/run.js` - Universal Playwright executor
  - Auto-installs Playwright if missing
  - Accepts code from: file path, inline string, or stdin
  - Supports multiple browser types (chromium, firefox, webkit)
  - Uses helpers from `lib/helpers.js`

---

*Stack analysis: 2025-03-20*
