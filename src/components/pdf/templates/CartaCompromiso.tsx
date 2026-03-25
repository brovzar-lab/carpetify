/**
 * Carta de Compromiso PDF template — C3a (FORMATO 6), C3b (FORMATO 7).
 *
 * Formal letter format with title, body text, and signature line area.
 * Portrait LETTER layout.
 */

import { Document, Page, Text, View } from '@react-pdf/renderer'
import '../fonts'
import { pdfStyles } from '../styles'

export interface CartaCompromisoProps {
  projectTitle: string
  title: string
  content: string
  sectionLabel: string
}

export function CartaCompromiso({
  projectTitle,
  title,
  content,
  sectionLabel,
}: CartaCompromisoProps) {
  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0)

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Letter title */}
        <Text style={pdfStyles.title}>{title}</Text>

        {/* Letter body */}
        <View>
          {paragraphs.map((paragraph, idx) => (
            <Text key={idx} style={pdfStyles.body}>
              {paragraph.trim()}
            </Text>
          ))}
        </View>

        {/* Signature area */}
        <View style={{ marginTop: 60 }}>
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 10 }}>
              Firma: _______________________________________________
            </Text>
          </View>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10 }}>
              Nombre: _____________________________________________
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 10 }}>
              Fecha: _______________________________________________
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          {sectionLabel} — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
