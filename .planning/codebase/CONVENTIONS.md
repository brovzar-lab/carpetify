# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- Python: `snake_case.py` - all lowercase with underscores
  - Examples: `fill_fillable_fields.py`, `gif_builder.py`, `validate.py`
- JavaScript: `camelCase.js` or `snake_case.js`
  - Examples: `helpers.js`, `validate.py`
- Entry points use descriptive names matching their purpose
  - Examples: `build_and_test.py`, `test_recorder.py`, `package_skill.py`

**Functions/Methods:**
- Python: `snake_case` for functions and methods
  - Examples: `fill_pdf_fields()`, `optimize_colors()`, `deduplicate_frames()`, `parse_skill_md()`
- JavaScript: `camelCase` for functions and methods
  - Examples: `launchBrowser()`, `waitForPageReady()`, `safeClick()`, `extractTableData()`
- Private/internal functions prefixed with underscore in Python
  - Examples: `_validate_single_file_xsd()`, `_get_original_file_errors()`, `_remove_ignorable_elements()`

**Variables:**
- Python: `snake_case` for all variables
  - Examples: `file_size_kb`, `remove_duplicates`, `has_error`, `merged_headers`
- JavaScript: `camelCase` for variables
  - Examples: `browserType`, `maxRetries`, `defaultOptions`
- Constants: `UPPER_SNAKE_CASE` in Python
  - Examples: `IGNORED_VALIDATION_ERRORS`, `UNIQUE_ID_REQUIREMENTS`, `EASING_FUNCTIONS`

**Types:**
- Python classes: `PascalCase`
  - Examples: `GIFBuilder`, `BaseSchemaValidator`, `TestRecorder`, `BuildRunner`
- Type hints: Full module path for clarity
  - Examples: `list[np.ndarray]`, `dict | None`, `tuple[float, float]`

## Code Style

**Formatting:**
- No explicit linter/formatter detected (no .eslintrc, .prettierrc, black config found)
- Follow PEP 8 style implicitly (observed in codebase)
- Consistent indentation: 4 spaces in Python, 2 spaces in JavaScript (observed)
- Line length: No strict enforcement, but kept under 100 characters in most cases

**Linting:**
- Not detected: No linting configuration found
- Convention: Follow implicit patterns observed in existing code
- Type hints used throughout Python code (modern Python 3.10+)

## Import Organization

**Order (Python):**
1. Standard library imports (os, sys, json, pathlib, subprocess, etc.)
2. Third-party imports (PIL, lxml, numpy, imageio, playwright, etc.)
3. Local/relative imports (from . import or from execution import)

**Example from `/Users/quantumcode/CODE/CARPETIFY/skills/slack-gif-creator/core/gif_builder.py`:**
```python
from pathlib import Path
from typing import Optional

import imageio.v3 as imageio
import numpy as np
from PIL import Image
```

**Order (JavaScript):**
1. Core module imports (require statements)
2. Destructuring imports for frequently used items
3. Function definitions

**Example from `/Users/quantumcode/CODE/CARPETIFY/skills/playwright-browser-automation/lib/helpers.js`:**
```javascript
const { chromium, firefox, webkit } = require('playwright');
```

**Path Aliases:**
- Not detected: Project does not use path aliases (@/ style imports)
- Relative imports used throughout

## Error Handling

**Patterns:**
- Explicit exception types used, not bare except clauses
  - Examples: `except lxml.etree.XMLSyntaxError`, `except EnvironmentError`, `except Exception as e`
- Validate inputs before processing
  - Check for None, empty lists, missing files
  - Raise ValueError for invalid input with descriptive messages
- Continue on non-critical errors (optional operations)
  - Example in `/Users/quantumcode/CODE/CARPETIFY/skills/docx/scripts/office/validators/base.py` line 138: `except Exception: pass`
- Fail fast for critical operations
  - Example: `sys.exit(1)` for validation failures in `fill_fillable_fields.py` line 43

**Error Message Style:**
- Descriptive messages that explain what went wrong and why
  - Example: `"Missing required env var: {key}"`
  - Example: `'ERROR: Invalid value "{field_value}" for checkbox field "{field_id}". The checked value is "{checked_val}" and the unchecked value is "{unchecked_val}"'`

**Return Values for Errors:**
- Functions return `None` or empty collections for missing data
  - Example: `_get_original_file_errors()` returns empty set on missing original file
- Boolean returns for validation results (True = valid, False = invalid)
  - Example: `validate_xml()`, `validate_unique_ids()`, `validate_all_relationship_ids()`

## Logging

**Framework:** Python uses `logging` module, JavaScript uses `console`

**Python Logging:**
- Configured once at module level in `/Users/quantumcode/CODE/CARPETIFY/execution/utils.py`:
  ```python
  logging.basicConfig(
      level=logging.INFO,
      format="%(asctime)s [%(levelname)s] %(message)s",
  )
  log = logging.getLogger("carpetify")
  ```
- Usage: `log.info("Wrote %s", path)` with %s formatting, not f-strings

**JavaScript Logging:**
- Simple console methods used
  - `console.log()` for general info
  - `console.warn()` for warnings
  - `console.error()` for errors
- Emoji used for visual distinction in some cases (✅ ❌ 🔍) in output strings

**When to Log:**
- Log file operations: reading, writing, creating directories
- Log workflow progress: step completion, counts
- Log warnings for non-critical issues: timeouts, fallbacks, missing optional features
- Do NOT log verbose variable states unless explicitly debugging

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic
  - Example: `/Users/quantumcode/CODE/CARPETIFY/skills/slack-gif-creator/core/gif_builder.py` lines 76-87 explain palette generation strategy
- Why something is done, not what (code shows what)
- Edge cases and special handling
- Important gotchas or non-intuitive behavior

**JSDoc/TSDoc:**
- Used extensively for function documentation
- Includes parameters, return types, and descriptions

**Example from `/Users/quantumcode/CODE/CARPETIFY/skills/slack-gif-creator/core/gif_builder.py`:**
```python
def add_frame(self, frame: np.ndarray | Image.Image):
    """
    Add a frame to the GIF.

    Args:
        frame: Frame as numpy array or PIL Image (will be converted to RGB)
    """
```

**Example from `/Users/quantumcode/CODE/CARPETIFY/skills/playwright-browser-automation/lib/helpers.js`:**
```javascript
/**
 * Safe click with retry logic
 * @param {Object} page - Playwright page
 * @param {string} selector - Element selector
 * @param {Object} options - Click options
 */
async function safeClick(page, selector, options = {}) {
```

## Function Design

**Size:** Functions typically 10-50 lines, up to 100+ for complex operations
- Single responsibility: one operation per function
- Extract internal helpers for complex logic
  - Examples: `_validate_single_file_xsd()`, `_get_schema_path()`, `_remove_ignorable_elements()`

**Parameters:**
- Use type hints in Python (required)
- Accept `options` dict/object for multiple optional parameters rather than many args
  - Example: `optimize_colors(self, num_colors: int = 128, use_global_palette: bool = True)`
  - Example: `async function createPage(context, options = {})`
- Use default values for optional parameters

**Return Values:**
- Explicit return types via type hints
- Return dict/object for multiple related values
  - Example: `GIFBuilder.save()` returns dict with file info
  - Example: `TestRecorder.step()` returns dict with test artifacts
- Return None for void-like operations
- Empty collections ([], {}, set()) for "no results", not None

## Module Design

**Exports:**
- Python: Functions and classes explicitly defined at module level, module docstring at top
  - Example: Module docstring at top of `gif_builder.py` explains purpose
- JavaScript: `module.exports = { ... }` at end with all public functions
  - Example: `/Users/quantumcode/CODE/CARPETIFY/skills/playwright-browser-automation/lib/helpers.js` lines 425-441

**Barrel Files:**
- Not used in this codebase
- Direct imports from specific modules

**Module Organization:**
- One primary class per module when class-based
  - Example: `GIFBuilder` class in `gif_builder.py`
- Utility functions grouped by purpose in utility modules
  - Example: `execution/utils.py` has env(), read_json(), write_json(), tmp_path()

---

*Convention analysis: 2026-03-20*
