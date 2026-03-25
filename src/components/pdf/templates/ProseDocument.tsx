/**
 * Generic prose document PDF template.
 *
 * Used for: A2 (sinopsis), A7 (propuesta produccion), A8a (plan de rodaje),
 * A10 (exhibicion y distribucion), A11 (bonus), A4 (propuesta direccion).
 *
 * Simple portrait LETTER layout with title, justified prose paragraphs,
 * automatic page breaks handled by @react-pdf/renderer.
 */

import { Document, Page, Text, View } from '@react-pdf/renderer'
import '../fonts'
import { pdfStyles } from '../styles'

export interface ProseDocumentProps {
  title: string
  content: string
  projectTitle: string
  sectionLabel: string
}

export function ProseDocument({
  title,
  content,
  projectTitle,
  sectionLabel,
}: ProseDocumentProps) {
  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0)

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>{title}</Text>

        {/* Prose paragraphs */}
        <View>
          {paragraphs.map((paragraph, idx) => (
            <Text key={idx} style={pdfStyles.body}>
              {paragraph.trim()}
            </Text>
          ))}
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          {sectionLabel} — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
