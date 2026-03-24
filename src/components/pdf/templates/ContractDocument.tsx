/**
 * Legal contract PDF template — B3-prod, B3-dir, C2b.
 *
 * Contract document with numbered clauses and yellow highlighted fee box
 * per D-03. The fee box uses pdfStyles.feeHighlight (backgroundColor #fff3cd,
 * border #ffc107) and appears prominently within the document.
 *
 * Portrait LETTER layout.
 */
import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import '../fonts'
import { pdfStyles } from '../styles'

export interface ContractDocumentProps {
  projectTitle: string
  title: string
  content: string
  feeAmount: string
  sectionLabel: string
}

export function ContractDocument({
  projectTitle,
  title,
  content,
  feeAmount,
  sectionLabel,
}: ContractDocumentProps) {
  // Split content into clauses. Look for common clause markers:
  // "PRIMERA.", "SEGUNDA.", numbered "1.", "2.", etc.
  const clausePattern = /\n(?=(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SEPTIMA|OCTAVA|NOVENA|DECIMA|UNDECIMA|DUODECIMA|DECIMOTERCERA|DECIMOCUARTA|DECIMOQUINTA|\d+)\s*[.:\-])/i
  const clauses = content.split(clausePattern).filter((c) => c.trim().length > 0)

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Contract title */}
        <Text style={pdfStyles.title}>{title}</Text>

        {/* Contract clauses */}
        <View>
          {clauses.map((clause, idx) => {
            const trimmed = clause.trim()
            // Check if this clause contains a fee reference
            const hasFeeRef =
              trimmed.toLowerCase().includes('honorario') ||
              trimmed.toLowerCase().includes('contraprestacion') ||
              trimmed.toLowerCase().includes('remuneracion')

            return (
              <View key={idx}>
                {/* Check for heading-style content (all-caps line) */}
                {trimmed.match(/^[A-Z\u00C0-\u00DC\s]+[.:\-]/) ? (
                  <Text style={pdfStyles.legalHeading}>
                    {trimmed.split('\n')[0]}
                  </Text>
                ) : null}

                <Text style={pdfStyles.legalClause}>
                  {trimmed.match(/^[A-Z\u00C0-\u00DC\s]+[.:\-]/)
                    ? trimmed.split('\n').slice(1).join('\n')
                    : trimmed}
                </Text>

                {/* Fee highlight box after clause that mentions the fee */}
                {hasFeeRef && (
                  <View style={pdfStyles.feeHighlight}>
                    <Text>{feeAmount}</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* If no clause mentioned fees, show the fee box at the end */}
        {!clauses.some(
          (c) =>
            c.toLowerCase().includes('honorario') ||
            c.toLowerCase().includes('contraprestacion') ||
            c.toLowerCase().includes('remuneracion'),
        ) && (
          <View style={pdfStyles.feeHighlight}>
            <Text>{feeAmount}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          {sectionLabel} — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
