# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Runner:**
- Not explicitly configured: No pytest.ini, test configuration, or test runner found
- Testing approach: Manual/integration testing via scripts
- Test files minimal in codebase

**Assertion Library:**
- Not detected: No test assertions found in codebase
- Scripts use manual validation and error checking instead

**Run Commands:**
- Tests executed as part of skill/feature scripts
- Example: `python scripts/build_and_test.py --test` for iOS Xcode testing
- No centralized test runner or CI configuration found

## Test File Organization

**Location:**
- Test files co-located with implementation (not separate test directory)
- Examples:
  - `/Users/quantumcode/CODE/CARPETIFY/skills/ios-simulator/scripts/test_recorder.py` - test recording utility
  - `/Users/quantumcode/CODE/CARPETIFY/skills/ios-simulator/scripts/build_and_test.py` - build & test runner

**Naming:**
- Scripts with "test" in name are test-related utilities, not unit tests
  - `test_recorder.py` - records test execution
  - `build_and_test.py` - Xcode build and test automation

**Structure:**
```
skills/
├── [skill-name]/
│   └── scripts/
│       ├── [primary-functionality].py
│       ├── test_*.py (test/validation utilities)
│       └── xcode/ (framework-specific modules)
```

## Test Structure

**Testing Approach (No Unit Tests Detected):**

This codebase emphasizes integration and end-to-end testing over unit tests. Testing occurs at multiple levels:

**1. Script-Level Validation:**
- Input validation before processing
- Output verification after processing
- Example from `/Users/quantumcode/CODE/CARPETIFY/skills/pdf/scripts/fill_fillable_fields.py` (lines 25-43):
  ```python
  has_error = False
  field_info = get_field_info(reader)
  fields_by_ids = {f["field_id"]: f for f in field_info}
  for field in fields:
      existing_field = fields_by_ids.get(field["field_id"])
      if not existing_field:
          has_error = True
          print(f"ERROR: `{field['field_id']}` is not a valid field ID")
      elif field["page"] != existing_field["page"]:
          has_error = True
          print(f"ERROR: Incorrect page number for `{field['field_id']}`...")
  if has_error:
      sys.exit(1)
  ```

**2. Schema Validation (DOCX/PPTX/XLSX):**
- Comprehensive validation classes validate document structure
- Example: `BaseSchemaValidator` in `/Users/quantumcode/CODE/CARPETIFY/skills/docx/scripts/office/validators/base.py`
- Validates:
  - XML well-formedness
  - Namespace declarations
  - Unique ID requirements
  - File references
  - Content type declarations
  - XSD schema compliance

**3. Integration Testing (iOS):**
- `TestRecorder` class in `/Users/quantumcode/CODE/CARPETIFY/skills/ios-simulator/scripts/test_recorder.py`
- Records test execution with screenshots and accessibility snapshots
- Captures state transitions and validates results

**Suite Organization:**

Tests are function-based or class-based validators, not pytest-style test cases:

```python
class BaseSchemaValidator:
    """Validator with multiple validation methods."""

    def validate(self):
        """Main validation method (abstract)."""
        raise NotImplementedError("Subclasses must implement")

    def validate_xml(self):
        """Check XML well-formedness."""
        # Validation logic
        return True/False

    def validate_namespaces(self):
        """Check namespace declarations."""
        # Validation logic
        return True/False

    def validate_unique_ids(self):
        """Check ID uniqueness."""
        # Validation logic
        return True/False
```

**Patterns:**
- Setup: Constructor initializes paths and reads files
  - Example: `TestRecorder.__init__()` creates timestamped output directory
  - Example: `BaseSchemaValidator.__init__()` resolves paths and gathers XML files
- Teardown: Explicit cleanup methods (not shown in samples, not auto-cleanup)
- Assertion: Manual validation with detailed error messages

## Mocking

**Framework:** Not detected - no mocking library found (no unittest.mock, pytest.mock, etc.)

**Patterns:**
- No explicit mocking observed
- Real file I/O used throughout
- Environment variables used for configuration (not mocked)
- Example from `/Users/quantumcode/CODE/CARPETIFY/execution/utils.py`:
  ```python
  def env(key: str, default: str | None = None) -> str:
      """Return an environment variable or raise if missing."""
      value = os.getenv(key, default)
      if value is None:
          raise EnvironmentError(f"Missing required env var: {key}")
      return value
  ```

**What to Mock:**
- External file system operations (if testing without actual files)
- HTTP requests (if testing network-dependent code)
- Environment variables for specific scenarios

**What NOT to Mock:**
- Core business logic (always test real implementations)
- Document processing (always use real document formats)
- Schema validation (always use real XSD schemas)

## Fixtures and Factories

**Test Data:**

Test data is provided as arguments or configuration, not via fixtures:

Example from `/Users/quantumcode/CODE/CARPETIFY/skills/pdf/scripts/fill_fillable_fields.py`:
```python
def fill_pdf_fields(input_pdf_path: str, fields_json_path: str, output_pdf_path: str):
    with open(fields_json_path) as f:
        fields = json.load(f)  # Load test data from JSON
```

**Data Factories:**

Not detected. Use direct instantiation:

Example from `/Users/quantumcode/CODE/CARPETIFY/skills/slack-gif-creator/core/gif_builder.py`:
```python
def save(self, output_path: str | Path, num_colors: int = 128, ...):
    """Save frames as optimized GIF."""
    info = {
        "path": str(output_path),
        "size_kb": file_size_kb,
        "frame_count": len(optimized_frames),
        ...
    }
    return info
```

**Location:**
- Test data: `.json` files in skill directories or as command-line arguments
- Configuration: Environment variables or `.env` file (never committed)
- Sample data: `sample-data.json` and similar files in asset directories

## Coverage

**Requirements:** Not enforced - no coverage configuration found

**View Coverage:**
- Not applicable: No test runner with coverage support
- Coverage would need to be added via pytest-cov or similar if required

## Test Types

**Unit Tests:**
- Not explicitly present
- Validation logic is integrated into feature modules
- Example: PDF field validation in `fill_fillable_fields.py` before processing

**Integration Tests:**
- Primary testing approach
- Example: `TestRecorder` (lines 29-100) records full test flow with screenshots
- Example: Document validators test full document structure

**E2E Tests:**
- Not explicitly configured
- Could be implemented via:
  - Playwright automation (`skills/playwright-browser-automation/`)
  - iOS simulator testing (`skills/ios-simulator/scripts/build_and_test.py`)

## Common Patterns

**Async Testing (JavaScript/Playwright):**
```javascript
async function safeClick(page, selector, options = {}) {
  const maxRetries = options.retries || 3;
  const retryDelay = options.retryDelay || 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout: options.timeout || 5000
      });
      await page.click(selector, {
        force: options.force || false,
        timeout: options.timeout || 5000
      });
      return true;
    } catch (e) {
      if (i === maxRetries - 1) {
        console.error(`Failed to click ${selector}...`);
        throw e;
      }
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await page.waitForTimeout(retryDelay);
    }
  }
}
```

**Error Testing:**
- Validate that errors are raised with correct messages
- Example from `/Users/quantumcode/CODE/CARPETIFY/skills/skill-creator/scripts/utils.py` (lines 12-22):
  ```python
  if lines[0].strip() != "---":
      raise ValueError("SKILL.md missing frontmatter (no opening ---)")

  end_idx = None
  for i, line in enumerate(lines[1:], start=1):
      if line.strip() == "---":
          end_idx = i
          break

  if end_idx is None:
      raise ValueError("SKILL.md missing frontmatter (no closing ---)")
  ```

**State Validation (iOS Testing):**
- TestRecorder captures application state at each test step
- Example from `/Users/quantumcode/CODE/CARPETIFY/skills/ios-simulator/scripts/test_recorder.py` (lines 82-99):
  ```python
  def step(
      self,
      description: str,
      screen_name: str | None = None,
      state: str | None = None,
      assertion: str | None = None,
      metadata: dict | None = None,
  ):
      """
      Record a test step with automatic screenshot.

      Args:
          assertion: Optional assertion to verify
          metadata: Optional metadata for the step
      """
  ```

**Retry Logic:**
- Common pattern for flaky operations (network, UI, timing)
- Example: `safeClick()` retries up to 3 times with exponential backoff
- Example: `retryWithBackoff()` in helpers.js uses exponential delays

---

*Testing analysis: 2026-03-20*
