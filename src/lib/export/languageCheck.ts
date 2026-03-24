/**
 * LANG-05 Pre-export language check utility.
 *
 * Scans generated document content for:
 * 1. Anglicisms (flagged = should replace, noted = industry-accepted)
 * 2. Currency format violations (wrong MXN patterns)
 * 3. English date patterns (English month names)
 * 4. Title consistency mismatches (blocker)
 *
 * Per D-05/D-07/D-08 from CONTEXT.md.
 */

// ---------- Types ----------

export type FindingSeverity = 'blocker' | 'flagged' | 'noted'

export interface LanguageCheckFinding {
  type: 'anglicism' | 'currency' | 'date' | 'title'
  severity: FindingSeverity
  word: string
  /** Surrounding text excerpt for context */
  context: string
  docId: string
  docName: string
  /** Suggested Spanish replacement (anglicisms only) */
  replacement?: string
}

export interface LanguageCheckResult {
  findings: LanguageCheckFinding[]
  anglicisms: LanguageCheckFinding[]
  formatIssues: LanguageCheckFinding[]
  titleMismatches: LanguageCheckFinding[]
  /** true when no blockers exist */
  passed: boolean
  /** true when title mismatches exist */
  hasBlockers: boolean
}

// ---------- Anglicism dictionaries ----------

interface AnglicismEntry {
  word: string
  replacement: string
  severity: 'flagged'
}

/**
 * Anglicisms that should NOT appear in EFICINE documents.
 * Each has a suggested Spanish replacement.
 */
const ANGLICISM_BLOCKLIST: AnglicismEntry[] = [
  { word: 'shooting', replacement: 'rodaje', severity: 'flagged' },
  { word: 'cast', replacement: 'elenco', severity: 'flagged' },
  { word: 'location', replacement: 'locacion', severity: 'flagged' },
  { word: 'budget', replacement: 'presupuesto', severity: 'flagged' },
  { word: 'schedule', replacement: 'cronograma', severity: 'flagged' },
  { word: 'deadline', replacement: 'fecha limite', severity: 'flagged' },
  { word: 'feedback', replacement: 'retroalimentacion', severity: 'flagged' },
  { word: 'marketing', replacement: 'mercadotecnia', severity: 'flagged' },
  { word: 'target', replacement: 'objetivo', severity: 'flagged' },
  { word: 'streaming', replacement: 'transmision', severity: 'flagged' },
  { word: 'release', replacement: 'estreno', severity: 'flagged' },
  { word: 'screening', replacement: 'proyeccion', severity: 'flagged' },
  { word: 'premiere', replacement: 'estreno', severity: 'flagged' },
  { word: 'workshop', replacement: 'taller', severity: 'flagged' },
  { word: 'networking', replacement: 'vinculacion', severity: 'flagged' },
  { word: 'performance', replacement: 'interpretacion', severity: 'flagged' },
  { word: 'pitch', replacement: 'presentacion', severity: 'flagged' },
  { word: 'highlight', replacement: 'resaltar', severity: 'flagged' },
  { word: 'backstage', replacement: 'tras bambalinas', severity: 'flagged' },
  { word: 'copyright', replacement: 'derechos de autor', severity: 'flagged' },
  { word: 'crew', replacement: 'equipo tecnico', severity: 'flagged' },
  { word: 'script', replacement: 'guion', severity: 'flagged' },
  { word: 'producer', replacement: 'productor', severity: 'flagged' },
  { word: 'director', replacement: 'director', severity: 'flagged' },
  { word: 'editor', replacement: 'editor', severity: 'flagged' },
  { word: 'trailer', replacement: 'avance', severity: 'flagged' },
  { word: 'post-production', replacement: 'postproduccion', severity: 'flagged' },
  { word: 'pre-production', replacement: 'preproduccion', severity: 'flagged' },
  { word: 'storyline', replacement: 'argumento', severity: 'flagged' },
  { word: 'sponsor', replacement: 'patrocinador', severity: 'flagged' },
]

/**
 * Industry-accepted terms that are standard in Mexican film production.
 * Marked as 'noted' -- informational only, no replacement needed.
 */
const ANGLICISM_ACCEPTED: string[] = [
  'catering',
  'DCP',
  'storyboard',
  'dolly',
  'steadicam',
  'drone',
  'playback',
  'claqueta',
  'gaffer',
  'grip',
  'boom',
  'travelling',
  'stop motion',
]

// ---------- Format patterns ----------

/**
 * Detects dollar amounts that don't follow the $X,XXX MXN convention.
 * Catches: "$X pesos", "$X.XX", "$X,XXX" without MXN suffix.
 */
const INVALID_CURRENCY_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    // "$X,XXX pesos" -- should use MXN suffix, not "pesos"
    pattern: /\$[\d,]+\s+pesos/gi,
    description: 'Usar "$X,XXX,XXX MXN" en lugar de "pesos"',
  },
  {
    // "$X,XXX.XX" -- no decimals in MXN display format
    pattern: /\$[\d,]+\.\d{2}\b/g,
    description: 'Sin decimales. Usar "$X,XXX,XXX MXN"',
  },
  {
    // "$XXXX" without MXN suffix (4+ digits without commas or MXN)
    // Only match if NOT followed by MXN within a few chars
    pattern: /\$\d{4,}(?!\s*MXN)(?!\d)/g,
    description: 'Falta sufijo MXN. Usar "$X,XXX,XXX MXN"',
  },
]

/**
 * Detects English month names in text.
 */
const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const ENGLISH_DATE_PATTERN = new RegExp(
  `\\b(${ENGLISH_MONTHS.join('|')})\\b`,
  'gi',
)

// ---------- Main function ----------

/**
 * Run pre-export language check on generated document content.
 *
 * Scans all provided documents for anglicisms, currency format violations,
 * English date patterns, and title consistency.
 *
 * @param docs - Array of documents with their content to scan
 * @param expectedTitle - The project title that should appear in each document
 * @returns Aggregated language check result
 */
export function runLanguageCheck(
  docs: Array<{ docId: string; docName: string; content: string }>,
  expectedTitle: string,
): LanguageCheckResult {
  const findings: LanguageCheckFinding[] = []
  const anglicisms: LanguageCheckFinding[] = []
  const formatIssues: LanguageCheckFinding[] = []
  const titleMismatches: LanguageCheckFinding[] = []

  for (const doc of docs) {
    // --- Anglicism scan ---
    scanAnglicisms(doc, anglicisms, findings)

    // --- Currency format scan ---
    scanCurrencyFormat(doc, formatIssues, findings)

    // --- English date scan ---
    scanEnglishDates(doc, formatIssues, findings)

    // --- Title consistency ---
    checkTitlePresence(doc, expectedTitle, titleMismatches, findings)
  }

  const hasBlockers = titleMismatches.length > 0
  // Per D-07: flagged anglicisms are dismissable warnings, not blockers
  // passed is true only when no blockers exist
  const passed = !hasBlockers

  return {
    findings,
    anglicisms,
    formatIssues,
    titleMismatches,
    passed,
    hasBlockers,
  }
}

// ---------- Internal helpers ----------

function extractContext(content: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - 30)
  const end = Math.min(content.length, matchIndex + matchLength + 30)
  let excerpt = content.substring(start, end)
  if (start > 0) excerpt = '...' + excerpt
  if (end < content.length) excerpt = excerpt + '...'
  return excerpt
}

function scanAnglicisms(
  doc: { docId: string; docName: string; content: string },
  anglicisms: LanguageCheckFinding[],
  findings: LanguageCheckFinding[],
): void {
  const content = doc.content

  // Check flagged anglicisms (blocklist)
  for (const entry of ANGLICISM_BLOCKLIST) {
    const regex = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, 'gi')
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const finding: LanguageCheckFinding = {
        type: 'anglicism',
        severity: 'flagged',
        word: match[0],
        context: extractContext(content, match.index, match[0].length),
        docId: doc.docId,
        docName: doc.docName,
        replacement: entry.replacement,
      }
      anglicisms.push(finding)
      findings.push(finding)
    }
  }

  // Check accepted anglicisms (noted)
  for (const word of ANGLICISM_ACCEPTED) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi')
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const finding: LanguageCheckFinding = {
        type: 'anglicism',
        severity: 'noted',
        word: match[0],
        context: extractContext(content, match.index, match[0].length),
        docId: doc.docId,
        docName: doc.docName,
      }
      anglicisms.push(finding)
      findings.push(finding)
    }
  }
}

function scanCurrencyFormat(
  doc: { docId: string; docName: string; content: string },
  formatIssues: LanguageCheckFinding[],
  findings: LanguageCheckFinding[],
): void {
  for (const { pattern, description } of INVALID_CURRENCY_PATTERNS) {
    // Reset regex state for each doc
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(doc.content)) !== null) {
      const finding: LanguageCheckFinding = {
        type: 'currency',
        severity: 'flagged',
        word: match[0],
        context: extractContext(doc.content, match.index, match[0].length),
        docId: doc.docId,
        docName: doc.docName,
        replacement: description,
      }
      formatIssues.push(finding)
      findings.push(finding)
    }
  }
}

function scanEnglishDates(
  doc: { docId: string; docName: string; content: string },
  formatIssues: LanguageCheckFinding[],
  findings: LanguageCheckFinding[],
): void {
  const regex = new RegExp(ENGLISH_DATE_PATTERN.source, ENGLISH_DATE_PATTERN.flags)
  let match: RegExpExecArray | null
  while ((match = regex.exec(doc.content)) !== null) {
    const finding: LanguageCheckFinding = {
      type: 'date',
      severity: 'flagged',
      word: match[0],
      context: extractContext(doc.content, match.index, match[0].length),
      docId: doc.docId,
      docName: doc.docName,
      replacement: 'Usar formato espanol',
    }
    formatIssues.push(finding)
    findings.push(finding)
  }
}

function checkTitlePresence(
  doc: { docId: string; docName: string; content: string },
  expectedTitle: string,
  titleMismatches: LanguageCheckFinding[],
  findings: LanguageCheckFinding[],
): void {
  // Only check docs with substantial content (> 100 chars)
  if (doc.content.length <= 100) return

  // Case-sensitive search for the expected title
  if (!doc.content.includes(expectedTitle)) {
    const finding: LanguageCheckFinding = {
      type: 'title',
      severity: 'blocker',
      word: expectedTitle,
      context: `Titulo "${expectedTitle}" no encontrado en ${doc.docName}`,
      docId: doc.docId,
      docName: doc.docName,
    }
    titleMismatches.push(finding)
    findings.push(finding)
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
