import { test, expect, type Page } from '@playwright/test'
import { TEST_PROJECT_ID } from './helpers'

/**
 * UAT Group 4: No English Visible Anywhere
 *
 * Scenario: Scan every screen — dashboard, 5 wizard screens, ERPI settings.
 * All visible text: buttons, labels, placeholders, errors, tooltips, empty states.
 *
 * Expected: 100% Mexican Spanish. Zero English text.
 */

// ─────────────────────────────────────────────────────────────────────────────
// English words that must NOT appear in the Carpetify UI
// These are common UI action words, NOT technical terms
// ─────────────────────────────────────────────────────────────────────────────
const BLOCKED_ENGLISH_WORDS = [
  'Submit', 'Cancel', 'Save', 'Delete', 'Remove', 'Add', 'Create',
  'Next', 'Previous', 'Back', 'Continue', 'Finish', 'Done', 'Apply',
  'Close', 'Open', 'New', 'Edit', 'Update', 'Reset', 'Clear', 'Confirm',
  'Upload', 'Download', 'Search', 'Filter', 'Select', 'Choose',
  'Loading', 'Success', 'Warning', 'Retry',
  'Dashboard', 'Settings', 'Profile', 'Logout', 'Login',
  'Password', 'Username',
  'Project', 'File', 'Name', 'Title', 'Description', 'Date',
  'Required', 'Optional', 'Placeholder',
]

// These are acceptable even if they appear (shared across Spanish/English)
const ALLOWED_EXCEPTIONS = new Set([
  'Status',      // technical
  'Email',       // universally used in Spanish UI
  'Error',       // "Error al guardar" is a valid Spanish phrase
  'OK',          // universal
])

const PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Datos del Proyecto', path: `/project/${TEST_PROJECT_ID}/datos` },
  { name: 'Guión (Guion)', path: `/project/${TEST_PROJECT_ID}/guion` },
  { name: 'Equipo Creativo', path: `/project/${TEST_PROJECT_ID}/equipo` },
  { name: 'Estructura Financiera', path: `/project/${TEST_PROJECT_ID}/financiera` },
  { name: 'Documentos', path: `/project/${TEST_PROJECT_ID}/documentos` },
  { name: 'ERPI Settings', path: '/erpi' },
]

async function waitForContentReady(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
}

function findEnglishViolations(text: string): string[] {
  const violations: string[] = []
  for (const word of BLOCKED_ENGLISH_WORDS) {
    if (ALLOWED_EXCEPTIONS.has(word)) continue
    const pattern = new RegExp(`\\b${word}\\b`, 'i')
    if (pattern.test(text)) {
      violations.push(word)
    }
  }
  return violations
}

test.describe('UAT Group 4 · No English Visible Anywhere', () => {
  for (const { name, path } of PAGES) {
    test(`4 · ${name}: all interactive text is in Spanish`, async ({ page }) => {
      await page.goto(path)
      await waitForContentReady(page)

      // Collect all visible, interactive text
      const buttons = await page.getByRole('button').allTextContents()
      const links   = await page.getByRole('link').allTextContents()
      const headings = await page.getByRole('heading').allTextContents()

      // Collect input placeholders
      const inputs = await page.locator('input[placeholder], textarea[placeholder]').all()
      const placeholders: string[] = []
      for (const input of inputs) {
        const ph = await input.getAttribute('placeholder')
        if (ph) placeholders.push(ph)
      }

      const allText = [...buttons, ...links, ...headings, ...placeholders].join(' ')

      const violations = findEnglishViolations(allText)

      if (violations.length > 0) {
        console.error(`[${name}] English violations: ${violations.join(', ')}`)
        console.error(`Collected text sample: ${allText.slice(0, 300)}`)
      } else {
        console.log(`[${name}] ✓ All text in Spanish`)
      }

      expect(
        violations,
        `Page "${name}" has English text: ${violations.join(', ')}`,
      ).toHaveLength(0)
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Bonus: Check all placeholder text is in Spanish on Screen 1
  // ─────────────────────────────────────────────────────────────────────────
  test('4-bonus · All input placeholders on Datos screen are in Spanish', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/datos`)
    await waitForContentReady(page)

    const inputs = await page.locator('input[placeholder], textarea[placeholder]').all()
    const violations: string[] = []

    for (const input of inputs) {
      const ph = (await input.getAttribute('placeholder')) ?? ''
      if (!ph) continue
      const wordViolations = findEnglishViolations(ph)
      if (wordViolations.length > 0) {
        violations.push(`Placeholder "${ph}" contains: ${wordViolations.join(', ')}`)
      }
    }

    if (violations.length > 0) {
      console.error('Placeholder violations:', violations)
    } else {
      console.log(`✓ All ${inputs.length} placeholders in Spanish`)
    }

    expect(violations, violations.join('\n')).toHaveLength(0)
  })
})
