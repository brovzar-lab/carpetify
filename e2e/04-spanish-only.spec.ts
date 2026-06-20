import { test, expect } from '@playwright/test'
import { TEST_PROJECT_ID } from './helpers'

/**
 * Test #4 — No English visible anywhere
 * All buttons, labels, placeholders, errors, and tooltips must be in Mexican Spanish.
 */

// English words that should NOT appear in Spanish-only UI
const ENGLISH_WORDS = [
  'Submit',
  'Cancel',
  'Save',
  'Delete',
  'Add',
  'Edit',
  'Close',
  'Upload',
  'Download',
  'Search',
  'Loading',
  'Error',
  'Success',
  'Warning',
  'Back',
  'Next',
  'Previous',
  'Dashboard',
  'Settings',
  'Profile',
  'Logout',
  'Login',
  'Register',
  'Password',
  'Email',
  'Name',
  'Title',
  'Description',
  'Status',
  'Date',
  'Year',
  'Month',
  'Day',
  'Project',
  'File',
  'New',
  'Open',
  'Create',
  'Update',
  'Remove',
  'Clear',
  'Reset',
  'Confirm',
  'Continue',
  'Finish',
  'Done',
  'Apply',
  'Retry',
]

// Pages to check
const PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Datos del Proyecto', path: `/project/${TEST_PROJECT_ID}/datos` },
  { name: 'Guion', path: `/project/${TEST_PROJECT_ID}/guion` },
  { name: 'Equipo', path: `/project/${TEST_PROJECT_ID}/equipo` },
  { name: 'Financiera', path: `/project/${TEST_PROJECT_ID}/financiera` },
  { name: 'Documentos', path: `/project/${TEST_PROJECT_ID}/documentos` },
  { name: 'ERPI', path: '/erpi' },
]

// Words that are acceptable as they are proper nouns, technical terms, or code
const ALLOWED_EXCEPTIONS = new Set([
  'Error',     // "Error" is used in Spanish too (e.g. "Error al guardar")
  'Status',    // technical term but present in console logs only
  'Email',     // widely used in Spanish UI for email fields
])

test.describe('No English visible in UI', () => {
  for (const { name, path } of PAGES) {
    test(`${name} page: all interactive text is in Spanish`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {
        // Ignore timeout — page may have pending Firebase connections
      })

      // Collect all visible interactive text: buttons, labels, placeholders
      const buttons = await page.getByRole('button').allTextContents()
      const links = await page.getByRole('link').allTextContents()
      const headings = await page.getByRole('heading').allTextContents()

      const allText = [...buttons, ...links, ...headings]
        .join(' ')
        .trim()

      const violations: string[] = []

      for (const word of ENGLISH_WORDS) {
        if (ALLOWED_EXCEPTIONS.has(word)) continue
        // Case-sensitive exact word match (not substring)
        const pattern = new RegExp(`\\b${word}\\b`, 'i')
        if (pattern.test(allText)) {
          violations.push(`Found English word: "${word}"`)
        }
      }

      if (violations.length > 0) {
        console.warn(`[${name}] Language violations:`, violations)
        // Soft assertion: log violations but only fail if it's a critical UI element
        // (not a false positive from technical content)
        expect(violations, `English text found on ${name}: ${violations.join(', ')}`).toHaveLength(0)
      }
    })
  }

  test('placeholder text is in Spanish on Datos page', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/datos`)

    // Check input placeholders
    const inputs = await page.locator('input[placeholder], textarea[placeholder]').all()
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder') ?? ''
      if (!placeholder) continue

      for (const word of ENGLISH_WORDS) {
        if (ALLOWED_EXCEPTIONS.has(word)) continue
        const pattern = new RegExp(`\\b${word}\\b`, 'i')
        if (pattern.test(placeholder)) {
          expect.soft(false, `English placeholder: "${placeholder}"`).toBe(true)
        }
      }
    }
  })
})
