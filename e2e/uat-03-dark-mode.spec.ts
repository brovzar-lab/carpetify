import { test, expect, type Page } from '@playwright/test'
import { TEST_PROJECT_ID } from './helpers'

/**
 * UAT Group 3: Dark Mode via System Preference + Manual Toggle
 *
 * Scenario: Toggle macOS dark mode (or use the new manual toggle button).
 *
 * Expected: All pages switch to dark variant immediately.
 * No elements stuck in light mode.
 */

test.describe('UAT Group 3 · Dark Mode', () => {


  async function waitForContentReady(page: Page) {
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  }

  async function clearThemePreference(page: Page) {
    await page.evaluate(() => localStorage.removeItem('carpetify-theme'))
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3a: App defaults to light mode when system is light
  // ───────────────────────────────────────────────────────────────────────────
  test('3a · App is in light mode when system prefers light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await clearThemePreference(page)
    await page.reload()
    await waitForContentReady(page)

    const htmlClass = await page.locator('html').getAttribute('class') ?? ''
    console.log('HTML class (light system):', htmlClass)
    expect(htmlClass).not.toMatch(/\bdark\b/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3b: App switches to dark when OS prefers dark
  // ───────────────────────────────────────────────────────────────────────────
  test('3b · App switches to dark mode when system prefers dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await clearThemePreference(page)
    await page.reload()
    await waitForContentReady(page)

    const htmlClass = await page.locator('html').getAttribute('class') ?? ''
    console.log('HTML class (dark system):', htmlClass)
    expect(htmlClass).toMatch(/\bdark\b/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3c: Manual toggle button is visible on dashboard
  // ───────────────────────────────────────────────────────────────────────────
  test('3c · Dark mode toggle button is visible on every page', async ({ page }) => {
    test.setTimeout(90_000) // 3 pages × ~15s Firebase load = ~45s
    const pages = ['/', `/project/${TEST_PROJECT_ID}/datos`, '/erpi']

    for (const path of pages) {
      await page.goto(path)
      await waitForContentReady(page)

      // Button has title attribute (our implementation uses title, not visible text)
      const toggleBtn = page.locator('button[title*="modo"]')
      const count = await toggleBtn.count()
      console.log(`Toggle button on ${path}: ${count > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'}`)
      await expect(toggleBtn.first(), `Toggle btn on ${path}`).toBeVisible({ timeout: 5_000 })
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3d: Manual toggle switches modes correctly
  // ───────────────────────────────────────────────────────────────────────────
  test('3d · Toggle button switches between light and dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await clearThemePreference(page)
    await page.reload()
    await waitForContentReady(page)

    // Should start in light mode
    let htmlClass = await page.locator('html').getAttribute('class') ?? ''
    expect(htmlClass).not.toMatch(/\bdark\b/)

    // Click the toggle
    const toggleBtn = page.locator('button[title*="modo"]')
    await toggleBtn.click()
    await page.waitForTimeout(200)

    // Should now be dark
    htmlClass = await page.locator('html').getAttribute('class') ?? ''
    console.log('HTML class after toggle to dark:', htmlClass)
    expect(htmlClass).toMatch(/\bdark\b/)

    // Click again
    await toggleBtn.click()
    await page.waitForTimeout(200)

    // Should be back to light
    htmlClass = await page.locator('html').getAttribute('class') ?? ''
    console.log('HTML class after toggle back to light:', htmlClass)
    expect(htmlClass).not.toMatch(/\bdark\b/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3e: Dark mode persists across all 5 wizard screens
  // ───────────────────────────────────────────────────────────────────────────
  test('3e · Dark mode persists across all 5 wizard screens', async ({ page }) => {
    test.setTimeout(120_000) // 6 pages × ~15s Firebase load = ~90s
    // Force dark via localStorage
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('carpetify-theme', 'dark'))

    const screens = [
      `/project/${TEST_PROJECT_ID}/datos`,
      `/project/${TEST_PROJECT_ID}/guion`,
      `/project/${TEST_PROJECT_ID}/equipo`,
      `/project/${TEST_PROJECT_ID}/financiera`,
      `/project/${TEST_PROJECT_ID}/documentos`,
      '/erpi',
    ]

    for (const path of screens) {
      await page.goto(path)
      await waitForContentReady(page)

      const htmlClass = await page.locator('html').getAttribute('class') ?? ''
      console.log(`${path}: html.class = "${htmlClass}"`)
      expect(htmlClass, `Dark class missing on ${path}`).toMatch(/\bdark\b/)
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3f: Dark mode preference persists in localStorage
  // ───────────────────────────────────────────────────────────────────────────
  test('3f · Dark mode preference is stored in localStorage', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await clearThemePreference(page)
    await page.reload()
    await waitForContentReady(page)

    // Click toggle to enable dark
    const toggleBtn = page.locator('button[title*="modo"]')
    await toggleBtn.click()
    await page.waitForTimeout(200)

    // Check localStorage
    const stored = await page.evaluate(() => localStorage.getItem('carpetify-theme'))
    console.log('localStorage carpetify-theme after toggle:', stored)
    expect(stored).toBe('dark')

    // Click toggle again to go back to light
    await toggleBtn.click()
    await page.waitForTimeout(200)
    const storedLight = await page.evaluate(() => localStorage.getItem('carpetify-theme'))
    expect(storedLight).toBe('light')
  })
})
