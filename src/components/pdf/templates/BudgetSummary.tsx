/**
 * Presupuesto Resumen PDF template — A9a.
 *
 * Summary budget table with account number, concept name, and subtotal.
 * Total row at bottom with bold styling. Portrait LETTER layout.
 */
import React from 'react'
import { Document, Page, Text } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface BudgetSummaryCuenta {
  numeroCuenta: number
  nombreCuenta: string
  subtotalFormatted: string
}

export interface BudgetSummaryProps {
  projectTitle: string
  cuentas: BudgetSummaryCuenta[]
  totalFormatted: string
}

export function BudgetSummary({
  projectTitle,
  cuentas,
  totalFormatted,
}: BudgetSummaryProps) {
  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>PRESUPUESTO RESUMEN</Text>

        {/* Budget summary table */}
        <Table weightings={[0.15, 0.55, 0.3]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Cuenta</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Concepto</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Subtotal</Text>
            </TD>
          </TH>
          {cuentas.map((cuenta, idx) => (
            <TR key={idx} style={idx % 2 === 0 ? pdfStyles.alternatingRowEven : undefined}>
              <TD style={pdfStyles.tableCell}>
                <Text>{cuenta.numeroCuenta}</Text>
              </TD>
              <TD style={pdfStyles.tableCell}>
                <Text>{cuenta.nombreCuenta}</Text>
              </TD>
              <TD style={pdfStyles.amountCell}>
                <Text>{cuenta.subtotalFormatted}</Text>
              </TD>
            </TR>
          ))}
          {/* Total row */}
          <TR>
            <TD style={pdfStyles.tableCell}>
              <Text />
            </TD>
            <TD style={{ ...pdfStyles.tableCell, fontWeight: 700 }}>
              <Text style={{ fontWeight: 700 }}>TOTAL</Text>
            </TD>
            <TD style={{ ...pdfStyles.amountCell, fontWeight: 700 }}>
              <Text style={{ fontWeight: 700 }}>{totalFormatted}</Text>
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
