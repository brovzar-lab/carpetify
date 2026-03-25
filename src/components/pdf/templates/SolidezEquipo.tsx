/**
 * Solidez del Equipo Creativo (FORMATO 2) PDF template — A6.
 *
 * Table listing each team member with their role, name, nationality,
 * filmography, and fee. Portrait LETTER layout.
 */

import { Document, Page, Text } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface TeamMemberRow {
  cargo: string
  nombre: string
  nacionalidad: string
  filmografia: string[]
  honorarios: string
}

export interface SolidezEquipoProps {
  projectTitle: string
  team: TeamMemberRow[]
}

export function SolidezEquipo({ projectTitle, team }: SolidezEquipoProps) {
  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>
          SOLIDEZ DEL EQUIPO CREATIVO (FORMATO 2)
        </Text>

        {/* Team table */}
        <Table weightings={[0.15, 0.2, 0.1, 0.35, 0.2]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Cargo</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Nombre</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Nacionalidad</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Filmografia</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Honorarios</Text>
            </TD>
          </TH>
          {team.map((member, idx) => (
            <TR key={idx} style={idx % 2 === 0 ? pdfStyles.alternatingRowEven : undefined}>
              <TD style={pdfStyles.tableCell}>
                <Text>{member.cargo}</Text>
              </TD>
              <TD style={pdfStyles.tableCell}>
                <Text>{member.nombre}</Text>
              </TD>
              <TD style={pdfStyles.tableCell}>
                <Text>{member.nacionalidad}</Text>
              </TD>
              <TD style={pdfStyles.tableCell}>
                <Text>{member.filmografia.join(', ')}</Text>
              </TD>
              <TD style={pdfStyles.amountCell}>
                <Text>{member.honorarios}</Text>
              </TD>
            </TR>
          ))}
        </Table>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Seccion A — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
