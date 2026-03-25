/**
 * Ficha Tecnica (FORMATO 8) PDF template — C4.
 *
 * Two-column key-value grid showing technical project details.
 * Clean bordered grid, no alternating rows.
 * Portrait LETTER layout.
 */

import { Document, Page, Text } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface FichaTecnicaField {
  label: string
  value: string
}

export interface FichaTecnicaProps {
  projectTitle: string
  fields: FichaTecnicaField[]
}

export function FichaTecnica({ projectTitle, fields }: FichaTecnicaProps) {
  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>FICHA TECNICA (FORMATO 8)</Text>

        {/* Key-value grid */}
        <Table weightings={[0.35, 0.65]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Campo</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Detalle</Text>
            </TD>
          </TH>
          {fields.map((field, idx) => (
            <TR key={idx}>
              <TD style={{ ...pdfStyles.tableCell, fontWeight: 700 }}>
                <Text style={{ fontWeight: 700 }}>{field.label}</Text>
              </TD>
              <TD style={pdfStyles.tableCell}>
                <Text>{field.value}</Text>
              </TD>
            </TR>
          ))}
        </Table>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Seccion C — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
