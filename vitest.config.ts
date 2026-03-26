import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': '/src',
      '@functions': path.resolve(__dirname, 'functions/src'),
      'firebase-admin/firestore': path.resolve(__dirname, 'functions/node_modules/firebase-admin/lib/firestore/index.js'),
      'firebase-admin/app': path.resolve(__dirname, 'functions/node_modules/firebase-admin/lib/app/index.js'),
    },
  },
})
