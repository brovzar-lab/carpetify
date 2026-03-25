# Phase 5: Export Manager - Research

**Researched:** 2026-03-23
**Domain:** PDF generation from structured data, ZIP compilation, file naming sanitization, pre-export language validation
**Confidence:** HIGH

## Summary

Phase 5 transforms Firestore-stored structured data (21 AI-generated documents + user-uploaded files) into a downloadable ZIP package that meets SHCP portal requirements. The core challenge is three-fold: (1) rendering structured JSON and prose content into properly formatted PDFs with Spanish characters, tables, and IMCINE FORMATO structures, (2) organizing all files into the mandated folder structure with strict filename constraints (max 15 chars, ASCII only), and (3) implementing pre-export validation gates that block export when any BLOCKER rule fails while also performing a language quality scan for anglicisms and formatting consistency.

The project already has `pdf-lib` v1.17.1 as a dependency in `functions/` (unused so far) and `@react-pdf/renderer` is mentioned in the CLAUDE.md as the planned output PDF tool. The existing codebase stores generated documents in Firestore at `projects/{projectId}/generated/{docId}` with content that is either `prose` (string), `structured` (JSON), or `table` (JSON arrays). User-uploaded documents are stored in Firebase Storage at `projects/{projectId}/uploads/` with metadata tracked in the `documents` subcollection. The export pipeline must handle both types: rendering AI-generated content to new PDFs and passing through user-uploaded PDFs as-is.

**Primary recommendation:** Use `@react-pdf/renderer` v4.3.2 for PDF generation (React JSX-based, aligns with existing React stack), `JSZip` v3.10.1 for client-side ZIP compilation, and build the export as a client-side operation that reads from Firestore/Storage and assembles the package in the browser. No Cloud Function needed for export since all data is already available client-side.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXPRT-01 | Generate PDFs from stored document data with IMCINE file naming (max 15 chars, ASCII only) | @react-pdf/renderer for PDF generation, filename sanitizer utility with ASCII-only regex `^[A-Za-z0-9_]{1,15}$`, document-to-filename mapping registry |
| EXPRT-02 | Compile complete carpeta as ZIP with organized folder structure (00_ERPI/, A_PROPUESTA/, etc.) | JSZip for client-side ZIP creation, folder structure constants from export_manager.json, parallel file fetching |
| EXPRT-03 | Export includes validation report, score estimate, and submission upload guide | Three meta-documents rendered as PDFs using @react-pdf/renderer, placed at ZIP root level |
| EXPRT-04 | Export only proceeds when all blocker validations pass; warnings flagged but don't block | Pre-export validation gate reads from Phase 4 validation engine results, ExportBlockedDialog component |
| EXPRT-05 | Generated documents conform to IMCINE's official FORMATO structures (FORMATO 1-11) | FORMATO-specific PDF templates as React components with correct table/field structure |
| LANG-05 | Pre-export language check scans for anglicisms, verifies format consistency, confirms title identity | Custom word-list based anglicism scanner (no NLP library needed), regex-based format verification for $X,XXX MXN and Spanish dates |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | 4.3.2 | Generate PDFs from React components | React-native JSX approach matches existing stack; supports flexbox layout, custom fonts, page breaks; React 19 compatible since v4.1.0 |
| @ag-media/react-pdf-table | 2.0.3 | Declarative table components for @react-pdf/renderer | Purpose-built for react-pdf; provides TH/TR/TD components with weighted columns; essential for budget, cash flow, and FORMATO tables |
| jszip | 3.10.1 | Client-side ZIP file creation | De facto standard for browser ZIP generation; 3M+ weekly downloads; simple API; handles nested folder structures |
| file-saver | 2.0.5 | Trigger browser file download from Blob | Standard companion to JSZip; handles saveAs across browsers; 4M+ weekly downloads |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdf-lib | 1.17.1 | Merge/manipulate existing PDFs | Already in functions/ deps; use for user-uploaded PDF passthrough if size validation or page-level operations needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer | pdfmake | pdfmake has better built-in table support and JSON-declarative API, but doesn't integrate with React component model; team already knows React JSX patterns |
| @react-pdf/renderer | jsPDF + jspdf-autotable | More popular but imperative API; harder to maintain templates as document count grows |
| jszip | client-zip | client-zip is faster and smaller (2.6kB) but JSZip is more battle-tested, has better docs, and the file sizes here (~30 PDFs, <40MB each) don't need streaming |

**Installation (frontend):**
```bash
npm install @react-pdf/renderer @ag-media/react-pdf-table jszip file-saver
npm install -D @types/file-saver
```

**Version verification:**
- @react-pdf/renderer: 4.3.2 (verified via npm registry 2026-03-23)
- @ag-media/react-pdf-table: 2.0.3 (verified via npm registry 2026-03-23)
- jszip: 3.10.1 (verified via npm registry 2026-03-23)
- file-saver: 2.0.5 (verified via npm registry 2026-03-23)
- pdf-lib: 1.17.1 (already installed in functions/)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── export/
│   │   ├── ExportScreen.tsx          # Main export wizard screen (7th wizard step)
│   │   ├── ExportProgress.tsx        # Progress bar during ZIP compilation
│   │   ├── ExportBlockedDialog.tsx   # Shows blocker validations preventing export
│   │   ├── ExportWarningsPanel.tsx   # Shows warnings (non-blocking)
│   │   └── LanguageCheckResults.tsx  # Pre-export language scan results
│   └── pdf/
│       ├── templates/
│       │   ├── ProseDocument.tsx      # Generic prose doc template (A1, A2, A7, etc.)
│       │   ├── BudgetSummary.tsx      # A9a presupuesto resumen table
│       │   ├── BudgetDetail.tsx       # A9b presupuesto desglosado table
│       │   ├── CashFlowTable.tsx      # A9d flujo de efectivo (FORMATO 3)
│       │   ├── FinancialScheme.tsx    # E1 esquema financiero (FORMATO 9)
│       │   ├── FichaTecnica.tsx       # C4 ficha tecnica (FORMATO 8)
│       │   ├── ResumenEjecutivo.tsx   # A1 resumen ejecutivo (FORMATO 1)
│       │   ├── SolidezEquipo.tsx      # A6 solidez equipo (FORMATO 2)
│       │   ├── ContractDocument.tsx   # B3, C2b contract prose with formal layout
│       │   ├── CartaCompromiso.tsx    # C3a (FORMATO 6), C3b (FORMATO 7)
│       │   ├── CartaAportacion.tsx    # E2 carta aportacion (FORMATO 10)
│       │   ├── ValidationReport.tsx   # Meta-doc: validation results
│       │   ├── ScoreEstimate.tsx      # Meta-doc: score estimate
│       │   └── SubmissionGuide.tsx    # Meta-doc: upload instructions
│       ├── styles.ts                  # Shared PDF stylesheet (fonts, margins, colors)
│       └── fonts.ts                   # Font.register() calls for Spanish character support
├── lib/
│   ├── export/
│   │   ├── fileNaming.ts             # Filename sanitization + document-to-filename map
│   │   ├── folderStructure.ts        # Folder organization constants
│   │   ├── zipCompiler.ts            # JSZip orchestration
│   │   ├── pdfRenderer.ts            # @react-pdf/renderer document-to-blob conversion
│   │   └── languageCheck.ts          # Anglicism scanner + format consistency checker
│   └── ...existing files
├── services/
│   └── export.ts                      # Fetch all project data for export
└── hooks/
    └── useExport.ts                   # Export orchestration hook with progress tracking
```

### Pattern 1: Document-to-PDF Template Routing
**What:** A registry that maps each DocumentId to the correct PDF template component and filename
**When to use:** During export, when iterating over all 21 generated documents
**Example:**
```typescript
// src/lib/export/fileNaming.ts
import type { DocumentId } from '@/types/generation'

interface ExportFileEntry {
  section: string        // Folder: 'A_PROPUESTA', 'B_PERSONAL', etc.
  filenameTemplate: string // e.g. 'A1_RE_{PROJ}'
  templateType: 'prose' | 'budget-summary' | 'budget-detail' | 'cash-flow' | 'financial-scheme' | 'ficha-tecnica' | 'contract' | 'carta' | 'resumen-ejecutivo' | 'solidez-equipo' | 'carta-aportacion'
}

export const EXPORT_FILE_MAP: Record<DocumentId, ExportFileEntry> = {
  A1:  { section: 'A_PROPUESTA', filenameTemplate: 'A1_RE_{PROJ}', templateType: 'resumen-ejecutivo' },
  A2:  { section: 'A_PROPUESTA', filenameTemplate: 'A2_SIN_{PROJ}', templateType: 'prose' },
  A7:  { section: 'A_PROPUESTA', filenameTemplate: 'A7_PP_{PROJ}', templateType: 'prose' },
  A8a: { section: 'A_PROPUESTA', filenameTemplate: 'A8_PR_{PROJ}', templateType: 'prose' },
  A8b: { section: 'A_PROPUESTA', filenameTemplate: 'A8_RC_{PROJ}', templateType: 'prose' },
  A9a: { section: 'A_PROPUESTA', filenameTemplate: 'A9_PRES_{PROJ}', templateType: 'budget-summary' },
  A9b: { section: 'A_PROPUESTA', filenameTemplate: 'A9_DEG_{PROJ}', templateType: 'budget-detail' },
  A9d: { section: 'A_PROPUESTA', filenameTemplate: 'A9_FE_{PROJ}', templateType: 'cash-flow' },
  A10: { section: 'A_PROPUESTA', filenameTemplate: 'A10_EXH_{PROJ}', templateType: 'prose' },
  A11: { section: 'A_PROPUESTA', filenameTemplate: 'A11_BP_{PROJ}', templateType: 'prose' },
  'B3-prod': { section: 'B_PERSONAL', filenameTemplate: 'B3_CP_{PROJ}', templateType: 'contract' },
  'B3-dir':  { section: 'B_PERSONAL', filenameTemplate: 'B3_CD_{PROJ}', templateType: 'contract' },
  C2b: { section: 'C_ERPI', filenameTemplate: 'C2_CES_{PROJ}', templateType: 'contract' },
  C3a: { section: 'C_ERPI', filenameTemplate: 'C3_BPC_{PROJ}', templateType: 'carta' },
  C3b: { section: 'C_ERPI', filenameTemplate: 'C3_PIC_{PROJ}', templateType: 'carta' },
  C4:  { section: 'C_ERPI', filenameTemplate: 'C4_FT_{PROJ}', templateType: 'ficha-tecnica' },
  E1:  { section: 'E_FINANZAS', filenameTemplate: 'E1_EF_{PROJ}', templateType: 'financial-scheme' },
  E2:  { section: 'E_FINANZAS', filenameTemplate: 'E2_CAE_{PROJ}', templateType: 'carta-aportacion' },
  // PITCH and A4/A6 handled separately
}

/**
 * Sanitize project title to create the {PROJ} abbreviation.
 * Max 4 chars, ASCII uppercase, no accents/symbols.
 */
export function sanitizeProjectAbbrev(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Strip accents
    .replace(/[^A-Za-z0-9]/g, '')     // ASCII only
    .substring(0, 4)
    .toUpperCase()
}

/**
 * Generate final filename (without .pdf extension) from template.
 * Enforces max 15 chars, ASCII-only pattern.
 */
export function generateFilename(template: string, projectTitle: string): string {
  const proj = sanitizeProjectAbbrev(projectTitle)
  const name = template.replace('{PROJ}', proj)
  // Enforce constraints
  const sanitized = name.replace(/[^A-Za-z0-9_]/g, '').substring(0, 15)
  return sanitized
}
```

### Pattern 2: Client-Side PDF Rendering Pipeline
**What:** Convert Firestore document data to PDF blobs using @react-pdf/renderer's `pdf()` function
**When to use:** During export, for each AI-generated document
**Example:**
```typescript
// src/lib/export/pdfRenderer.ts
import { pdf } from '@react-pdf/renderer'
import { ProseDocument } from '@/components/pdf/templates/ProseDocument'
import { BudgetSummary } from '@/components/pdf/templates/BudgetSummary'
// ... other template imports

type TemplateType = ExportFileEntry['templateType']

/**
 * Render a generated document's content to a PDF Blob.
 * Routes to the correct template based on contentType/templateType.
 */
export async function renderDocumentToPdf(
  docId: string,
  content: unknown,
  templateType: TemplateType,
  projectMeta: { titulo: string; erpiNombre: string },
): Promise<Blob> {
  const component = getTemplateComponent(templateType, content, projectMeta)
  const blob = await pdf(component).toBlob()
  return blob
}
```

### Pattern 3: ZIP Assembly with Progress Tracking
**What:** Orchestrate the full export: validate, render PDFs, fetch uploads, compile ZIP
**When to use:** When user clicks "Exportar Carpeta"
**Example:**
```typescript
// src/lib/export/zipCompiler.ts
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export interface ExportProgress {
  phase: 'validating' | 'rendering' | 'fetching' | 'compiling' | 'complete' | 'error'
  current: number
  total: number
  currentFile?: string
}

export async function compileExportZip(
  projectAbbrev: string,
  generatedPdfs: Array<{ folder: string; filename: string; blob: Blob }>,
  uploadedFiles: Array<{ folder: string; filename: string; blob: Blob }>,
  metaDocs: Array<{ filename: string; blob: Blob }>,
  onProgress: (progress: ExportProgress) => void,
): Promise<void> {
  const zip = new JSZip()
  const root = zip.folder(`carpeta_${projectAbbrev}`)!

  // Add meta documents at root level
  for (const meta of metaDocs) {
    root.file(`${meta.filename}.pdf`, meta.blob)
  }

  // Add generated PDFs to section folders
  for (const doc of generatedPdfs) {
    const folder = root.folder(doc.folder)!
    folder.file(`${doc.filename}.pdf`, doc.blob)
  }

  // Add uploaded files to section folders
  for (const upload of uploadedFiles) {
    const folder = root.folder(upload.folder)!
    folder.file(`${upload.filename}.pdf`, upload.blob)
  }

  onProgress({ phase: 'compiling', current: 0, total: 1 })
  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `carpeta_${projectAbbrev}.zip`)
  onProgress({ phase: 'complete', current: 1, total: 1 })
}
```

### Pattern 4: Pre-Export Language Check
**What:** Scan all generated document content for anglicisms, format violations, and title inconsistencies
**When to use:** Before PDF rendering begins, as a validation gate
**Example:**
```typescript
// src/lib/export/languageCheck.ts

/** Common anglicisms that should not appear in EFICINE documents */
const ANGLICISM_BLOCKLIST = [
  'budget', 'schedule', 'cast', 'location', 'deadline',
  'feedback', 'pitch', 'target', 'marketing', 'streaming',
  'release', 'screening', 'premiere', 'workshop', 'networking',
  // ... extend with domain-specific terms
]

/** Verify $X,XXX,XXX MXN format consistency */
const MXN_PATTERN = /\$[\d,]+\s*MXN/g
const INVALID_MXN = /\$[\d.]+(?:\.\d{2})?\s*(?:pesos|mxn|MXN)?/gi

/** Verify Spanish date format */
const SPANISH_DATE_PATTERN = /\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/g
const ENGLISH_DATE_PATTERN = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d/gi

export interface LanguageCheckResult {
  anglicisms: Array<{ word: string; context: string; docId: string }>
  formatIssues: Array<{ type: 'currency' | 'date'; found: string; docId: string }>
  titleMismatches: Array<{ docId: string; foundTitle: string; expectedTitle: string }>
  passed: boolean
}
```

### Anti-Patterns to Avoid
- **Server-side PDF generation for export:** All document data is already client-accessible via Firestore. Generating PDFs in Cloud Functions would add latency, cold start issues, and memory pressure. Do it in the browser.
- **Generating PDFs on-the-fly during browsing:** PDF generation is expensive. Only generate during export. The DocumentViewer component should continue showing raw text/JSON as it does now.
- **One monolithic PDF per section:** Each document should be a separate PDF file per SHCP portal requirements. The portal accepts individual file uploads, not merged documents.
- **Using default @react-pdf/renderer fonts for Spanish:** The default PDF fonts (Helvetica, Courier, Times-Roman) do NOT support accented characters. You MUST register a custom TTF font that includes full Latin Extended characters.
- **Hardcoding filenames:** Use the template-based approach from the EXPORT_FILE_MAP registry. Filenames depend on project abbreviation which varies per project.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation from React components | Custom canvas/PDF writing | @react-pdf/renderer v4.3.2 | Page breaks, text wrapping, flexbox layout, font embedding -- all solved |
| Table rendering in PDFs | Manual View/Text grid positioning | @ag-media/react-pdf-table v2.0.3 | Column weighting, cell spanning, row breaks across pages |
| ZIP file creation | Manual binary ZIP writing | JSZip v3.10.1 | ZIP format is complex; folder hierarchy, compression, large file support |
| File download trigger | Manual anchor/click hack | file-saver v2.0.5 | Cross-browser saveAs, handles Blob conversion, UTF-8 BOM support |
| Accent stripping for filenames | Manual character mapping | String.normalize('NFD') + regex | Unicode normalization handles all accent variants correctly |
| Spanish character support in PDF | Character-by-character encoding | Font.register() with TTF font (e.g., Noto Sans) | Font embedding is the standard approach; trying to map characters to standard fonts is fragile |

**Key insight:** The export pipeline has two fundamentally different document types: (1) generated documents that need PDF rendering from structured data, and (2) uploaded documents that are already PDFs and just need passthrough. Do NOT try to re-render uploaded PDFs -- fetch them from Storage and add directly to the ZIP.

## Common Pitfalls

### Pitfall 1: Missing Spanish Characters in Generated PDFs
**What goes wrong:** PDFs show squares, question marks, or garbled text for accented characters (a, e, i, n, etc.)
**Why it happens:** @react-pdf/renderer's default fonts (Helvetica, Times, Courier) only cover basic ASCII. Spanish requires Latin Extended character support.
**How to avoid:** Register a custom TTF font BEFORE any PDF rendering. Use Noto Sans or Roboto which include full Latin-1 Supplement + Latin Extended-A coverage. Register at app initialization, not per-render.
**Warning signs:** First test PDF shows "?" or empty boxes where accented characters should be.
```typescript
// src/components/pdf/fonts.ts
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'NotoSans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/NotoSans-Italic.ttf', fontStyle: 'italic' },
    { src: '/fonts/NotoSans-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})
```

### Pitfall 2: Filename Length Violation
**What goes wrong:** Generated filenames exceed 15 characters, causing SHCP portal rejection.
**Why it happens:** Project title abbreviation + section prefix + separator exceeds limit. E.g., `A9_PRES_LONGNAME.pdf` = 18 chars.
**How to avoid:** Enforce the 15-char limit in the `generateFilename()` function. Truncate the result, not the abbreviation. Use max 3-4 char project abbreviation. Validate ALL filenames before export, not just at generation time.
**Warning signs:** Any filename longer than 15 chars (excluding .pdf extension) or containing non-ASCII characters.

### Pitfall 3: Memory Pressure During Batch PDF Generation
**What goes wrong:** Browser tab crashes or becomes unresponsive when generating 21+ PDFs simultaneously.
**Why it happens:** @react-pdf/renderer creates large intermediate representations. Generating all PDFs in parallel exhausts browser memory.
**How to avoid:** Generate PDFs sequentially or in small batches (3-4 at a time). Show progress to user. Use `pdf().toBlob()` which is more memory-efficient than `pdf().toBuffer()`.
**Warning signs:** Browser tab becomes unresponsive after "Exportar" button click.

### Pitfall 4: Uploaded File Size Exceeding 40MB
**What goes wrong:** Export includes oversized PDFs that will be rejected by SHCP portal.
**Why it happens:** User uploaded large scanned documents (contracts, IDs at high DPI).
**How to avoid:** Check file size during upload (Phase 1 already has upload flow) AND during pre-export validation. Flag any file >40MB as a BLOCKER. Show file size in the export checklist.
**Warning signs:** Total ZIP size >200MB for a single project.

### Pitfall 5: Title Inconsistency Across Documents
**What goes wrong:** Project title appears differently in different generated documents.
**Why it happens:** AI-generated content may slightly rephrase the title, or user edited a document's content and changed the title mention.
**How to avoid:** The LANG-05 pre-export language check must scan every generated document for exact title match. Use the canonical `titulo_proyecto` from project metadata as the source of truth.
**Warning signs:** Any document containing the project title with different capitalization, accents, or wording.

### Pitfall 6: Cash Flow Table Overflowing PDF Page Width
**What goes wrong:** The flujo de efectivo (FORMATO 3) has 12+ monthly columns that don't fit on a single page width.
**Why it happens:** Tables with many columns need landscape orientation and small font size.
**How to avoid:** Use landscape Page orientation for financial tables. Set font size to 7-8pt for dense tables. Consider splitting into multiple pages if >12 months.
**Warning signs:** Columns overlapping or text truncated in the cash flow PDF.

### Pitfall 7: CORS Issues Fetching Uploaded Files from Storage
**What goes wrong:** During export, fetching user-uploaded PDFs from Firebase Storage fails with CORS errors.
**Why it happens:** Firebase Storage download URLs may require proper CORS configuration, especially when fetching as Blob.
**How to avoid:** Use `getDownloadURL()` from Firebase Storage SDK which returns a properly authenticated URL. Fetch with `fetch(url).then(r => r.blob())`. Ensure Firebase Storage CORS is configured for the app's domain.
**Warning signs:** Export fails at "fetching uploaded files" step with network errors.

## Code Examples

### Font Registration for Spanish Characters
```typescript
// src/components/pdf/fonts.ts
// Source: @react-pdf/renderer docs (https://react-pdf.org/fonts)
import { Font } from '@react-pdf/renderer'

// Register Noto Sans for full Spanish character support
// Host TTF files in public/fonts/ directory
Font.register({
  family: 'NotoSans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/NotoSans-Italic.ttf', fontStyle: 'italic', fontWeight: 400 },
  ],
})

// Disable hyphenation for Spanish (default hyphenation is English-only)
Font.registerHyphenationCallback((word) => [word])
```

### Shared PDF Stylesheet
```typescript
// src/components/pdf/styles.ts
import { StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    padding: 40,
    lineHeight: 1.4,
  },
  pageHeader: {
    fontSize: 8,
    color: '#666',
    marginBottom: 20,
    textAlign: 'right',
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    marginTop: 16,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  // Landscape page for financial tables
  landscapePage: {
    fontFamily: 'NotoSans',
    fontSize: 8,
    padding: 30,
    lineHeight: 1.2,
  },
  tableHeader: {
    fontWeight: 700,
    fontSize: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tableCell: {
    fontSize: 8,
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  amountCell: {
    fontSize: 8,
    padding: 4,
    textAlign: 'right',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
  },
})
```

### Prose Document Template
```typescript
// src/components/pdf/templates/ProseDocument.tsx
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from '../styles'

interface ProseDocumentProps {
  title: string
  content: string
  projectTitle: string
  section: string
}

export function ProseDocument({ title, content, projectTitle, section }: ProseDocumentProps) {
  return (
    <Document title={title} author="Carpetify" language="es-MX">
      <Page size="LETTER" style={pdfStyles.page}>
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>
        <Text style={pdfStyles.title}>{title}</Text>
        <Text style={pdfStyles.body}>{content}</Text>
        <Text style={pdfStyles.footer} fixed>
          {section} - {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
```

### Budget Table Template
```typescript
// src/components/pdf/templates/BudgetSummary.tsx
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import { pdfStyles } from '../styles'

interface BudgetSummaryProps {
  projectTitle: string
  cuentas: Array<{
    numeroCuenta: number
    nombreCuenta: string
    subtotalFormatted: string
  }>
  totalFormatted: string
}

export function BudgetSummaryDoc({ projectTitle, cuentas, totalFormatted }: BudgetSummaryProps) {
  return (
    <Document title="Presupuesto Resumen" language="es-MX">
      <Page size="LETTER" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>PRESUPUESTO RESUMEN</Text>
        <Text style={{ fontSize: 10, marginBottom: 12, textAlign: 'center' }}>
          {projectTitle}
        </Text>
        <Table>
          <TH>
            <TD style={pdfStyles.tableHeader} weighting={0.15}>Cuenta</TD>
            <TD style={pdfStyles.tableHeader} weighting={0.55}>Concepto</TD>
            <TD style={pdfStyles.tableHeader} weighting={0.3}>Subtotal</TD>
          </TH>
          {cuentas.map((c) => (
            <TR key={c.numeroCuenta}>
              <TD style={pdfStyles.tableCell} weighting={0.15}>{String(c.numeroCuenta)}</TD>
              <TD style={pdfStyles.tableCell} weighting={0.55}>{c.nombreCuenta}</TD>
              <TD style={pdfStyles.amountCell} weighting={0.3}>{c.subtotalFormatted}</TD>
            </TR>
          ))}
          <TR>
            <TD style={pdfStyles.tableHeader} weighting={0.15}></TD>
            <TD style={pdfStyles.tableHeader} weighting={0.55}>TOTAL</TD>
            <TD style={{ ...pdfStyles.amountCell, fontWeight: 700 }} weighting={0.3}>
              {totalFormatted}
            </TD>
          </TR>
        </Table>
      </Page>
    </Document>
  )
}
```

### Export Hook with Progress
```typescript
// src/hooks/useExport.ts
import { useState, useCallback } from 'react'
import type { ExportProgress } from '@/lib/export/zipCompiler'

export function useExport(projectId: string) {
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const startExport = useCallback(async () => {
    setIsExporting(true)
    try {
      // 1. Run pre-export validation
      setProgress({ phase: 'validating', current: 0, total: 1 })
      // ... validation logic

      // 2. Render all generated docs to PDF
      setProgress({ phase: 'rendering', current: 0, total: 21 })
      // ... sequential PDF rendering with progress updates

      // 3. Fetch uploaded files from Storage
      setProgress({ phase: 'fetching', current: 0, total: uploadCount })
      // ... fetch with progress

      // 4. Compile ZIP and trigger download
      setProgress({ phase: 'compiling', current: 0, total: 1 })
      // ... ZIP compilation

      setProgress({ phase: 'complete', current: 1, total: 1 })
    } catch (error) {
      setProgress({ phase: 'error', current: 0, total: 0, currentFile: String(error) })
    } finally {
      setIsExporting(false)
    }
  }, [projectId])

  return { startExport, progress, isExporting }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jsPDF imperative API | @react-pdf/renderer declarative JSX | 2022+ | Component-based templates are more maintainable for 20+ document types |
| Server-side PDF generation | Client-side with @react-pdf/renderer | 2023+ | Eliminates server cold starts, reduces Cloud Function cost |
| Manual table positioning | @ag-media/react-pdf-table | 2023+ | Weighted columns with auto page-break handling |
| Standard PDF fonts | Custom TTF font registration | Always required for non-ASCII | Essential for any language with diacritical marks |

**Deprecated/outdated:**
- `reactPDF.render()` API: replaced by `pdf().toBlob()` in @react-pdf/renderer v4.x
- `scheduler` dependency: was required in @react-pdf/renderer 4.1.x, resolved in 4.2+
- `file-saver` v1.x: v2.x has better TypeScript support and handles large blobs

## Open Questions

1. **Font file hosting strategy**
   - What we know: TTF fonts need to be accessible via URL. Can be hosted in `public/fonts/` (served by Vite), or loaded from CDN (Google Fonts), or bundled as assets.
   - What's unclear: Whether Firebase Hosting serves font files with correct MIME types by default.
   - Recommendation: Host in `public/fonts/` for reliability. Download Noto Sans TTF files from Google Fonts and include in repo. This avoids CDN dependency and CORS issues.

2. **Maximum total ZIP size**
   - What we know: Individual PDFs must be <=40MB. A typical carpeta has ~30 files.
   - What's unclear: Whether there's a total ZIP size limit imposed by browser Blob API or SHCP portal.
   - Recommendation: Test with a realistic project. JSZip can handle multi-hundred-MB ZIPs in modern browsers. If issues arise, use `StreamSaver.js` for large exports.

3. **FORMATO template fidelity**
   - What we know: IMCINE has official FORMATO structures (FORMATO 1-11) that documents must match.
   - What's unclear: Whether the exact table layout, column widths, and field positions are published and available as reference, or if there is flexibility in layout as long as content matches.
   - Recommendation: Build templates that match the required fields and table structure from the schemas. Allow slight layout variation since the portal accepts PDF uploads (not form fills).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | vite.config.ts (test section) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPRT-01 | Filename sanitization produces valid ASCII filenames <= 15 chars | unit | `npx vitest run src/lib/export/__tests__/fileNaming.test.ts -t "sanitize" --reporter=verbose` | No -- Wave 0 |
| EXPRT-01 | PDF rendering produces non-empty Blob for each template type | unit | `npx vitest run src/components/pdf/__tests__/pdfRenderer.test.ts --reporter=verbose` | No -- Wave 0 |
| EXPRT-02 | ZIP compilation creates correct folder structure with expected files | unit | `npx vitest run src/lib/export/__tests__/zipCompiler.test.ts --reporter=verbose` | No -- Wave 0 |
| EXPRT-03 | Validation report, score estimate, and guide PDFs render without error | unit | `npx vitest run src/components/pdf/__tests__/metaDocs.test.ts --reporter=verbose` | No -- Wave 0 |
| EXPRT-04 | Export is blocked when blocker validations exist | unit | `npx vitest run src/lib/export/__tests__/exportGate.test.ts --reporter=verbose` | No -- Wave 0 |
| EXPRT-05 | FORMATO templates have correct table structure and required fields | unit | `npx vitest run src/components/pdf/__tests__/formatoTemplates.test.ts --reporter=verbose` | No -- Wave 0 |
| LANG-05 | Language check detects anglicisms, format violations, title mismatches | unit | `npx vitest run src/lib/export/__tests__/languageCheck.test.ts --reporter=verbose` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/export/__tests__/fileNaming.test.ts` -- covers EXPRT-01 filename sanitization
- [ ] `src/lib/export/__tests__/zipCompiler.test.ts` -- covers EXPRT-02 folder structure
- [ ] `src/lib/export/__tests__/languageCheck.test.ts` -- covers LANG-05 anglicism detection
- [ ] `src/lib/export/__tests__/exportGate.test.ts` -- covers EXPRT-04 blocker gate
- [ ] Font files: `public/fonts/NotoSans-*.ttf` -- required for all PDF rendering tests

## Sources

### Primary (HIGH confidence)
- @react-pdf/renderer npm registry -- version 4.3.2 confirmed, React 19 compatible since v4.1.0
- @react-pdf/renderer official docs (https://react-pdf.org/) -- components, fonts, advanced features
- JSZip official docs (https://stuk.github.io/jszip/) -- API, examples, version 3.10.1
- file-saver GitHub (https://github.com/eligrey/FileSaver.js) -- version 2.0.5, saveAs API
- @ag-media/react-pdf-table GitHub (https://github.com/ag-media/react-pdf-table) -- version 2.0.3, table API
- export_manager.json schema -- file naming rules, folder structure, compilation checklist
- validation_rules.md -- 13 cross-module rules with BLOCKER/WARNING classification
- Existing codebase analysis -- DocumentViewer, DOCUMENT_REGISTRY, BudgetOutput types, storage service

### Secondary (MEDIUM confidence)
- npm-compare.com -- library comparison data for PDF generation options
- DEV Community articles -- ecosystem patterns for React PDF generation in 2025
- GitHub issues for @react-pdf/renderer -- font/Unicode issues documented in issues #852, #1771, #1775, #3172

### Tertiary (LOW confidence)
- Anglicism detection approach -- no established JavaScript library exists; custom word-list approach is pragmatic but may miss edge cases. Validate with real EFICINE document samples.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified against npm registry, React 19 compatibility confirmed, libraries well-established
- Architecture: HIGH - based on analysis of existing codebase patterns (WizardShell, DocumentViewer, DOCUMENT_REGISTRY), export_manager.json schema, and app_spec.md output package specification
- Pitfalls: HIGH - font/Unicode issues well-documented in GitHub issues; filename constraints clearly specified in export_manager.json; memory pressure is a known browser PDF concern
- Language check: MEDIUM - no established anglicism detection library; word-list approach is pragmatic but unverified against real EFICINE documents

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable libraries, no fast-moving concerns)
