/**
 * Esquema Financiero (FORMATO 9) PDF template — E1.
 *
 * Funding sources table showing source name, amount, percentage, and type.
 * Portrait LETTER layout with total row at bottom.
 */

import { Document, Page, Text } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface FinancialSource {
  fuente: string
  monto: string
  porcentaje: string
  tipo: string
}

export interface FinancialSchemeProps {
  projectTitle: string
  sources: FinancialSource[]
  total: string
}

export function FinancialScheme({
  projectTitle,
  sources,
  total,
}: FinancialSchemeProps) {
  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>ESQUEMA FINANCIERO (FORMATO 9)</Text>

        {/* Financial scheme table */}
        <Table weightings={[0.35, 0.25, 0.15, 0.25]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Fuente</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Monto</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Porcentaje</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Tipo</Text>
            </TD>
          </TH>

          {sources.map((src, idx) => (
            <TR key={idx} style={idx % 2 === 0 ? pdfStyles.alternatingRowEven : undefined}>
              <TD style={pdfStyles.tableCell}>
                <Text>{src.fuente}</Text>
              </TD>
              <TD style={pdfStyles.amountCell}>
                <Text>{src.monto}</Text>
              </TD>
              <TD style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                <Text>{src.porcentaje}</Text>
              </TD>
              <TD style={pdfStyles.tableCell}>
                <Text>{src.tipo}</Text>
              </TD>
            </TR>
          ))}

          {/* Total row */}
          <TR>
            <TD style={{ ...pdfStyles.tableCell, fontWeight: 700 }}>
              <Text style={{ fontWeight: 700 }}>TOTAL</Text>
            </TD>
            <TD style={{ ...pdfStyles.amountCell, fontWeight: 700 }}>
              <Text style={{ fontWeight: 700 }}>{total}</Text>
            </TD>
            <TD style={pdfStyles.tableCell}>
              <Text style={{ fontWeight: 700 }}>100%</Text>
            </TD>
            <TD style={pdfStyles.tableCell}>
              <Text />
            </TD>
          </TR>
        </Table>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Seccion E — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
