import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5201 --strictPort',
    url: 'http://127.0.0.1:5201',
    env: {
      VITE_E2E: 'true',
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-carpetify.firebaseapp.com',
      VITE_FIREBASE_DATABASE_URL: 'http://127.0.0.1:9000?ns=demo-carpetify',
      VITE_FIREBASE_PROJECT_ID: 'demo-carpetify',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-carpetify.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:demo',
    },
    reuseExistingServer: false,
  },
  use: {
    baseURL: 'http://127.0.0.1:5201',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    locale: 'es-MX',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
