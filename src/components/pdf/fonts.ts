/**
 * PDF font registration for @react-pdf/renderer.
 *
 * Registers NotoSans with Regular (400), Bold (700), and Italic (400 italic)
 * weights for full Spanish character support (accents, n-tilde, etc.).
 *
 * Font files are hosted at /public/fonts/ and served via Vite.
 * Import this module before rendering any PDF document.
 */
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'NotoSans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/NotoSans-Italic.ttf', fontStyle: 'italic', fontWeight: 400 },
  ],
})

// Disable English-only hyphenation for Spanish text.
// Without this, @react-pdf/renderer uses English hyphenation rules
// which produce incorrect word breaks in Spanish.
Font.registerHyphenationCallback((word: string) => [word])
