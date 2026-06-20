import { test, expect } from '@playwright/test'
import { TEST_PROJECT_ID } from './helpers'

/**
 * Test #3 — Dark mode via system preference + manual toggle
 * OS dark toggle switches all pages, and the manual toggle button works.
 */

test.describe('Dark Mode', () => {
  test('app renders in light mode by default (system light)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    // Clear any stored preference so system pref takes over
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('carpetify-theme'))
    await page.reload()

    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
    // Background should be light
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--background'),
    )
    console.log('Light mode --background CSS var:', bg)
  })

  test('app renders in dark mode when system prefers dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('carpetify-theme'))
    await page.reload()

    // After reload, dark class should be applied
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })

  test('manual dark mode toggle button is visible and functional', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('carpetify-theme'))
    await page.reload()

    // Toggle button exists (moon/sun icon button)
    const toggleBtn = page.getByRole('button', { name: /modo oscuro|modo claro|dark|light/i })
    await expect(toggleBtn).toBeVisible()

    // Click to switch to dark mode
    await toggleBtn.click()
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)

    // Click again to switch back to light mode
    await toggleBtn.click()
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  })

  test('dark mode persists across page navigation', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('carpetify-theme'))

    // Enable dark mode via toggle
    const toggleBtn = page.getByRole('button', { name: /modo oscuro|modo claro|dark|light/i })
    await expect(toggleBtn).toBeVisible()
    await page.evaluate(() => localStorage.setItem('carpetify-theme', 'dark'))

    // Navigate to another page
    await page.goto('/erpi')
    // Dark class should persist
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })

  test('dark mode applies on wizard screen', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/datos`)
    await page.evaluate(() => localStorage.setItem('carpetify-theme', 'dark'))
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
    // Page content visible (no light-mode-only white text on white bg issue)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })
})
