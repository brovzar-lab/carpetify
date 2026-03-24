/**
 * Presupuesto Desglosado PDF template — A9b.
 *
 * Detailed budget breakdown by account with partidas (line items).
 * Landscape LETTER layout per RESEARCH.md pitfall 6.
 * Account header rows with tableHeader background, partida rows
 * with alternating colors, account subtotal rows in bold.
 */
import React from 'react'
import { Document, Page, Text } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface BudgetPartida {
  concepto: string
  cantidad: number
  unidad: string
  costoUnitario: string
  subtotal: string
}

export interface BudgetDetailCuenta {
  numeroCuenta: number
  nombreCuenta: string
  partidas: BudgetPartida[]
  subtotalFormatted: string
}

export interface BudgetDetailProps {
  projectTitle: string
  cuentas: BudgetDetailCuenta[]
  totalFormatted: string
}

export function BudgetDetail({
  projectTitle,
  cuentas,
  totalFormatted,
}: BudgetDetailProps) {
  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={pdfStyles.landscapePage}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>PRESUPUESTO DESGLOSADO</Text>

        {/* Budget detail table */}
        <Table weightings={[0.08, 0.3, 0.08, 0.12, 0.18, 0.18]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Cuenta</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Concepto</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Cant.</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Unidad</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Costo Unitario</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Subtotal</Text>
            </TD>
          </TH>

          {cuentas.map((cuenta) => (
            <React.Fragment key={cuenta.numeroCuenta}>
              {/* Account header row */}
              <TR>
                <TD style={pdfStyles.tableHeader}>
                  <Text style={{ fontWeight: 700 }}>{cuenta.numeroCuenta}</Text>
                </TD>
                <TD style={pdfStyles.tableHeader}>
                  <Text style={{ fontWeight: 700 }}>{cuenta.nombreCuenta}</Text>
                </TD>
                <TD style={pdfStyles.tableHeader}>
                  <Text />
                </TD>
                <TD style={pdfStyles.tableHeader}>
                  <Text />
                </TD>
                <TD style={pdfStyles.tableHeader}>
                  <Text />
                </TD>
                <TD style={pdfStyles.tableHeader}>
                  <Text />
                </TD>
              </TR>

              {/* Partida rows */}
              {cuenta.partidas.map((partida, pidx) => (
                <TR
                  key={pidx}
                  style={pidx % 2 === 0 ? pdfStyles.alternatingRowEven : undefined}
                >
                  <TD style={pdfStyles.tableCell}>
                    <Text />
                  </TD>
                  <TD style={pdfStyles.tableCell}>
                    <Text>{partida.concepto}</Text>
                  </TD>
                  <TD style={{ ...pdfStyles.tableCell, textAlign: 'center' }}>
                    <Text>{partida.cantidad}</Text>
                  </TD>
                  <TD style={pdfStyles.tableCell}>
                    <Text>{partida.unidad}</Text>
                  </TD>
                  <TD style={pdfStyles.amountCell}>
                    <Text>{partida.costoUnitario}</Text>
                  </TD>
                  <TD style={pdfStyles.amountCell}>
                    <Text>{partida.subtotal}</Text>
                  </TD>
                </TR>
              ))}

              {/* Account subtotal row */}
              <TR>
                <TD style={pdfStyles.tableCell}>
                  <Text />
                </TD>
                <TD style={{ ...pdfStyles.tableCell, fontWeight: 700 }}>
                  <Text style={{ fontWeight: 700 }}>Subtotal {cuenta.nombreCuenta}</Text>
                </TD>
                <TD style={pdfStyles.tableCell}>
                  <Text />
                </TD>
                <TD style={pdfStyles.tableCell}>
                  <Text />
                </TD>
                <TD style={pdfStyles.tableCell}>
                  <Text />
                </TD>
                <TD style={{ ...pdfStyles.amountCell, fontWeight: 700 }}>
                  <Text style={{ fontWeight: 700 }}>{cuenta.subtotalFormatted}</Text>
                </TD>
              </TR>
            </React.Fragment>
          ))}

          {/* Grand total row */}
          <TR>
            <TD style={pdfStyles.tableCell}>
              <Text />
            </TD>
            <TD style={{ ...pdfStyles.tableCell, fontWeight: 700 }}>
              <Text style={{ fontWeight: 700 }}>TOTAL PRESUPUESTO</Text>
            </TD>
            <TD style={pdfStyles.tableCell}>
              <Text />
            </TD>
            <TD style={pdfStyles.tableCell}>
              <Text />
            </TD>
            <TD style={pdfStyles.tableCell}>
              <Text />
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
