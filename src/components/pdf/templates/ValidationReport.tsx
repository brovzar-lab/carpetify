/**
 * Validation Report internal PDF template — _INTERNO/validacion.pdf (D-09).
 *
 * One-page checklist showing:
 *   - Bloqueadores resueltos (checkmarks)
 *   - Advertencias activas (warnings with messages)
 *   - Completitud de documentos (generated/uploaded counts)
 *   - Conciliacion financiera (budget = cash flow = esquema)
 *
 * Portrait LETTER layout.
 */
import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import '../fonts'
import { pdfStyles } from '../styles'

export interface ValidationReportData {
  blockersResolved: Array<{ ruleName: string }>
  activeWarnings: Array<{ ruleName: string; message: string }>
  generatedCount: number
  generatedTotal: number
  uploadedCount: number
  uploadedTotal: number
  reconciliationAmount: string
  reconciliationPassed: boolean
}

export interface ValidationReportProps {
  projectTitle: string
  report: ValidationReportData
}

export function ValidationReport({
  projectTitle,
  report,
}: ValidationReportProps) {
  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>Reporte de Validacion</Text>

        {/* Section 1: Bloqueadores resueltos */}
        <Text style={pdfStyles.subtitle}>Bloqueadores resueltos</Text>
        {report.blockersResolved.length > 0 ? (
          report.blockersResolved.map((blocker, idx) => (
            <Text key={idx} style={{ ...pdfStyles.body, marginBottom: 4 }}>
              {'\u2713'} {blocker.ruleName}
            </Text>
          ))
        ) : (
          <Text style={{ ...pdfStyles.body, color: '#666666' }}>
            Sin bloqueadores detectados
          </Text>
        )}

        {/* Section 2: Advertencias activas */}
        <Text style={pdfStyles.subtitle}>Advertencias activas</Text>
        {report.activeWarnings.length > 0 ? (
          report.activeWarnings.map((warning, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <Text style={{ ...pdfStyles.body, marginBottom: 2 }}>
                {'\u26A0'} {warning.ruleName}
              </Text>
              <Text
                style={{
                  ...pdfStyles.body,
                  fontSize: 9,
                  color: '#666666',
                  marginLeft: 16,
                  marginBottom: 4,
                }}
              >
                {warning.message}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ ...pdfStyles.body, color: '#666666' }}>
            Sin advertencias
          </Text>
        )}

        {/* Section 3: Completitud de documentos */}
        <Text style={pdfStyles.subtitle}>Completitud de documentos</Text>
        <Text style={pdfStyles.body}>
          {report.generatedCount}/{report.generatedTotal} generados,{' '}
          {report.uploadedCount}/{report.uploadedTotal} subidos
        </Text>

        {/* Section 4: Conciliacion financiera */}
        <Text style={pdfStyles.subtitle}>Conciliacion financiera</Text>
        <Text style={pdfStyles.body}>
          Presupuesto = Flujo = Esquema: {report.reconciliationAmount}{' '}
          {report.reconciliationPassed ? '\u2713' : '\u2717 Error de conciliacion'}
        </Text>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Documento interno — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
