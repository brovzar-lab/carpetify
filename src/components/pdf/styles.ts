/**
 * Shared PDF stylesheet for all export document templates.
 *
 * Uses NotoSans font registered in fonts.ts.
 * Utilitarian/clean styling per D-01 -- no branding, no decorative elements.
 * IMCINE explicitly recommends "sin portadas decorativas."
 *
 * All styles use StyleSheet.create from @react-pdf/renderer.
 */
import { StyleSheet } from '@react-pdf/renderer'

// Import fonts to ensure registration runs before any PDF render
import './fonts'

export const pdfStyles = StyleSheet.create({
  // ---------- Page layouts ----------

  /** Portrait LETTER page (default for most documents) */
  page: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 50,
    lineHeight: 1.5,
  },

  /** Landscape LETTER page (cash flow A9d, budget detail A9b, ruta critica A8b) */
  landscapePage: {
    fontFamily: 'NotoSans',
    fontSize: 8,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 1.2,
  },

  // ---------- Headers ----------

  /** Page header: project title right-aligned at page top */
  pageHeader: {
    fontFamily: 'NotoSans',
    fontSize: 8,
    color: '#666666',
    textAlign: 'right',
    marginBottom: 16,
  },

  /** Document title centered (e.g., "PRESUPUESTO RESUMEN", "RESUMEN EJECUTIVO") */
  title: {
    fontFamily: 'NotoSans',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 1.2,
  },

  /** Section headings within documents */
  subtitle: {
    fontFamily: 'NotoSans',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    marginTop: 12,
    lineHeight: 1.2,
  },

  // ---------- Body text ----------

  /** Prose content, justified alignment */
  body: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 8,
  },

  // ---------- Table styles ----------

  /** Table column headers with gray background */
  tableHeader: {
    fontFamily: 'NotoSans',
    fontSize: 8,
    fontWeight: 700,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    padding: 4,
    lineHeight: 1.2,
  },

  /** Standard table cell */
  tableCell: {
    fontFamily: 'NotoSans',
    fontSize: 8,
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    lineHeight: 1.2,
  },

  /** Right-aligned cell for monetary amounts */
  amountCell: {
    fontFamily: 'NotoSans',
    fontSize: 8,
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    textAlign: 'right',
    lineHeight: 1.2,
  },

  // ---------- Footer ----------

  /** Page footer: section label + project title, centered */
  footer: {
    fontFamily: 'NotoSans',
    fontSize: 7,
    color: '#999999',
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    lineHeight: 1.0,
  },

  // ---------- Contract / Legal styles (D-03) ----------

  /** Yellow highlighted fee box for contracts per D-03 */
  feeHighlight: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderStyle: 'solid',
    padding: '8pt 12pt',
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    fontFamily: 'NotoSans',
    marginVertical: 8,
  },

  /** Legal clause text (contracts B3, C2b) */
  legalClause: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.5,
  },

  /** Legal section heading (for contract clauses) */
  legalHeading: {
    fontFamily: 'NotoSans',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },

  // ---------- Table alternating rows (D-02) ----------

  /** Even row background for dense tables */
  alternatingRowEven: {
    backgroundColor: '#f9f9f9',
  },

  // ---------- Internal document stamp (D-10) ----------

  /** Red stamp for "DOCUMENTO INTERNO -- NO INCLUIR EN LA CARPETA EFICINE" */
  internalStamp: {
    fontFamily: 'NotoSans',
    color: '#dc3545',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 16,
  },

  // ---------- Signature line ----------

  /** Signature line for letters and contracts */
  signatureLine: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginTop: 40,
    paddingTop: 4,
    width: 200,
    textAlign: 'center',
  },

  // ---------- Key-value pair layout ----------

  /** Label in a key-value pair (e.g., ficha tecnica fields) */
  kvLabel: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    fontWeight: 700,
    width: '40%',
    padding: 4,
  },

  /** Value in a key-value pair */
  kvValue: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    width: '60%',
    padding: 4,
  },
})
