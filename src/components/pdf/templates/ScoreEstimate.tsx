/**
 * Score Estimate internal PDF template — _INTERNO/estimacion_puntaje.pdf (D-10).
 *
 * Full EFICINE score breakdown with viability categories, artistic
 * categories, bonus points, total score, and improvement suggestions.
 *
 * CRITICAL: First line uses pdfStyles.internalStamp (red #dc3545):
 * "DOCUMENTO INTERNO -- NO INCLUIR EN LA CARPETA EFICINE"
 *
 * Portrait LETTER layout.
 */

import { Document, Page, Text, View } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface ScoreCategoryRow {
  name: string
  estimated: number
  max: number
}

export interface PersonaScoreRow {
  personaName: string
  scores: Record<string, number>
}

export interface ImprovementRow {
  text: string
  points: number
}

export interface ScoreEstimateData {
  viability: ScoreCategoryRow[]
  artistic: ScoreCategoryRow[]
  personaScores: PersonaScoreRow[]
  bonusPoints: number
  bonusCategory: string | null
  totalEstimated: number
  maxPossible: number
  improvements: ImprovementRow[]
}

export interface ScoreEstimateProps {
  projectTitle: string
  score: ScoreEstimateData
}

export function ScoreEstimate({ projectTitle, score }: ScoreEstimateProps) {
  const viabilityTotal = score.viability.reduce(
    (sum, c) => sum + c.estimated,
    0,
  )
  const artisticTotal = score.artistic.reduce(
    (sum, c) => sum + c.estimated,
    0,
  )

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* CRITICAL: Internal document stamp */}
        <Text style={pdfStyles.internalStamp}>
          DOCUMENTO INTERNO -- NO INCLUIR EN LA CARPETA EFICINE
        </Text>

        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>Estimacion de Puntaje EFICINE</Text>

        {/* Section 1: Viabilidad */}
        <Text style={pdfStyles.subtitle}>
          Viabilidad ({viabilityTotal}/38 pts)
        </Text>
        <Table weightings={[0.5, 0.25, 0.25]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Categoria</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Estimado</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Maximo</Text>
            </TD>
          </TH>
          {score.viability.map((cat, idx) => (
            <TR key={idx}>
              <TD style={pdfStyles.tableCell}>
                <Text>{cat.name}</Text>
              </TD>
              <TD style={pdfStyles.amountCell}>
                <Text>{cat.estimated}</Text>
              </TD>
              <TD style={pdfStyles.amountCell}>
                <Text>{cat.max}</Text>
              </TD>
            </TR>
          ))}
        </Table>

        {/* Section 2: Merito Artistico */}
        <Text style={pdfStyles.subtitle}>
          Merito Artistico ({artisticTotal}/62 pts) -- estimado
        </Text>
        <Table weightings={[0.5, 0.25, 0.25]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Categoria</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Estimado</Text>
            </TD>
            <TD style={{ ...pdfStyles.tableHeader, textAlign: 'right' }}>
              <Text>Maximo</Text>
            </TD>
          </TH>
          {score.artistic.map((cat, idx) => (
            <TR key={idx}>
              <TD style={pdfStyles.tableCell}>
                <Text>{cat.name}</Text>
              </TD>
              <TD style={pdfStyles.amountCell}>
                <Text>{cat.estimated}</Text>
              </TD>
              <TD style={pdfStyles.amountCell}>
                <Text>{cat.max}</Text>
              </TD>
            </TR>
          ))}
        </Table>

        {/* Section 3: Puntos Bonus */}
        <Text style={pdfStyles.subtitle}>
          Puntos Bonus ({score.bonusPoints}/5 pts)
        </Text>
        <Text style={pdfStyles.body}>
          {score.bonusCategory
            ? `Categoria bonus: ${score.bonusCategory} (+${score.bonusPoints} pts)`
            : 'No aplica bonus en esta categoria'}
        </Text>

        {/* Section 4: Puntaje Total */}
        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <Text style={{ ...pdfStyles.title, fontSize: 16 }}>
            Puntaje estimado: {score.totalEstimated}/{score.maxPossible}
            {score.bonusPoints > 0 ? ` (+${score.bonusPoints} bonus)` : ''}
          </Text>
        </View>

        {/* Section 5: Mejoras sugeridas */}
        {score.improvements.length > 0 && (
          <>
            <Text style={pdfStyles.subtitle}>Mejoras sugeridas</Text>
            {score.improvements.map((imp, idx) => (
              <Text key={idx} style={{ ...pdfStyles.body, marginBottom: 4 }}>
                {idx + 1}. {imp.text} (+{imp.points} pts)
              </Text>
            ))}
          </>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Documento interno — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
