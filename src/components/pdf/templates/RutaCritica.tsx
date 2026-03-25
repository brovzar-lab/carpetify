/**
 * Ruta Critica PDF template — A8b.
 *
 * Timeline grid: rows = production phases, columns = months.
 * Falls back to prose rendering if no structured phases data.
 * Landscape LETTER layout.
 */
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface RutaCriticaPhase {
  name: string
  months: string[]
}

export interface RutaCriticaProps {
  projectTitle: string
  content: string
  phases: RutaCriticaPhase[]
}

export function RutaCritica({
  projectTitle,
  content,
  phases,
}: RutaCriticaProps) {
  const hasStructuredData = phases && phases.length > 0

  // Collect all unique months across all phases for columns
  const allMonths = hasStructuredData
    ? Array.from(new Set(phases.flatMap((p) => p.months))).sort()
    : []

  // Column weights: phase name + N month columns
  const phaseWeight = 0.25
  const monthWeight = (1 - phaseWeight) / Math.max(allMonths.length, 1)
  const weightings = [phaseWeight, ...Array(allMonths.length).fill(monthWeight)]

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={pdfStyles.landscapePage}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>RUTA CRITICA</Text>

        {hasStructuredData ? (
          /* Timeline grid */
          <Table weightings={weightings}>
            <TH>
              <TD style={pdfStyles.tableHeader}>
                <Text>Etapa</Text>
              </TD>
              {allMonths.map((month) => (
                <TD key={month} style={{ ...pdfStyles.tableHeader, textAlign: 'center' }}>
                  <Text>{month}</Text>
                </TD>
              ))}
            </TH>

            {phases.map((phase, idx) => (
              <TR key={idx} style={idx % 2 === 0 ? pdfStyles.alternatingRowEven : undefined}>
                <TD style={pdfStyles.tableCell}>
                  <Text>{phase.name}</Text>
                </TD>
                {allMonths.map((month) => (
                  <TD
                    key={month}
                    style={{
                      ...pdfStyles.tableCell,
                      textAlign: 'center',
                      backgroundColor: phase.months.includes(month)
                        ? '#d4edda'
                        : undefined,
                    }}
                  >
                    <Text>{phase.months.includes(month) ? '\u2588' : ''}</Text>
                  </TD>
                ))}
              </TR>
            ))}
          </Table>
        ) : (
          /* Fallback: prose rendering */
          <View>
            {content
              .split('\n\n')
              .filter((p) => p.trim().length > 0)
              .map((paragraph, idx) => (
                <Text key={idx} style={pdfStyles.body}>
                  {paragraph.trim()}
                </Text>
              ))}
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Seccion A — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
