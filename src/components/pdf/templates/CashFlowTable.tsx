/**
 * Flujo de Efectivo (FORMATO 3) PDF template — A9d.
 *
 * Dense cash flow matrix: rows = funding sources, columns = months.
 * Landscape LETTER layout with 7-8pt font for dense data.
 * Alternating row colors for readability.
 */

import { Document, Page, Text } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface CashFlowSource {
  source: string
  monthly: string[]
  total: string
}

export interface CashFlowTableProps {
  projectTitle: string
  months: string[]
  sources: CashFlowSource[]
  monthlyTotals: string[]
  grandTotal: string
}

export function CashFlowTable({
  projectTitle,
  months,
  sources,
  monthlyTotals,
  grandTotal,
}: CashFlowTableProps) {
  // Column count: source label + N months + total
  const colCount = months.length + 2
  // Source label gets more weight, remaining columns are even
  const sourceWeight = 0.2
  const remainingWeight = (1 - sourceWeight) / (colCount - 1)
  const weightings = [sourceWeight, ...Array(colCount - 1).fill(remainingWeight)]

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={pdfStyles.landscapePage}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>FLUJO DE EFECTIVO (FORMATO 3)</Text>

        {/* Cash flow matrix */}
        <Table weightings={weightings}>
          {/* Header row: Fuente | Month1 | Month2 | ... | Total */}
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Fuente</Text>
            </TD>
            {months.map((month, idx) => (
              <TD key={idx} style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
                <Text>{month}</Text>
              </TD>
            ))}
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Total</Text>
            </TD>
          </TH>

          {/* Source rows */}
          {sources.map((src, idx) => (
            <TR key={idx} style={idx % 2 === 0 ? pdfStyles.alternatingRowEven : undefined}>
              <TD style={pdfStyles.tableCell}>
                <Text>{src.source}</Text>
              </TD>
              {src.monthly.map((amount, midx) => (
                <TD key={midx} style={pdfStyles.amountCell}>
                  <Text>{amount}</Text>
                </TD>
              ))}
              <TD style={{ ...pdfStyles.amountCell, fontWeight: 700 }}>
                <Text style={{ fontWeight: 700 }}>{src.total}</Text>
              </TD>
            </TR>
          ))}

          {/* Totals row */}
          <TR>
            <TD style={{ ...pdfStyles.tableCell, fontWeight: 700 }}>
              <Text style={{ fontWeight: 700 }}>TOTAL</Text>
            </TD>
            {monthlyTotals.map((total, idx) => (
              <TD key={idx} style={{ ...pdfStyles.amountCell, fontWeight: 700 }}>
                <Text style={{ fontWeight: 700 }}>{total}</Text>
              </TD>
            ))}
            <TD style={{ ...pdfStyles.amountCell, fontWeight: 700 }}>
              <Text style={{ fontWeight: 700 }}>{grandTotal}</Text>
            </TD>
          </TR>
        </Table>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Seccion A — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
