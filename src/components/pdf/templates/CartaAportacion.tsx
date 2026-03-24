/**
 * Carta de Aportacion Exclusiva (FORMATO 10) PDF template — E2.
 *
 * Formal letter with contribution amount table.
 * Portrait LETTER layout.
 */
import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface ContributionRow {
  concepto: string
  monto: string
}

export interface CartaAportacionProps {
  projectTitle: string
  content: string
  contributionTable: ContributionRow[]
}

export function CartaAportacion({
  projectTitle,
  content,
  contributionTable,
}: CartaAportacionProps) {
  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0)

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>
          CARTA DE APORTACION EXCLUSIVA (FORMATO 10)
        </Text>

        {/* Letter body */}
        <View>
          {paragraphs.map((paragraph, idx) => (
            <Text key={idx} style={pdfStyles.body}>
              {paragraph.trim()}
            </Text>
          ))}
        </View>

        {/* Contribution table */}
        {contributionTable.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Table weightings={[0.6, 0.4]}>
              <TH>
                <TD style={pdfStyles.tableHeader}>
                  <Text>Concepto</Text>
                </TD>
                <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
                  <Text>Monto</Text>
                </TD>
              </TH>
              {contributionTable.map((row, idx) => (
                <TR key={idx}>
                  <TD style={pdfStyles.tableCell}>
                    <Text>{row.concepto}</Text>
                  </TD>
                  <TD style={pdfStyles.amountCell}>
                    <Text>{row.monto}</Text>
                  </TD>
                </TR>
              ))}
            </Table>
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Seccion E — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
