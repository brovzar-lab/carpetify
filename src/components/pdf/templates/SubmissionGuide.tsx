/**
 * Submission Guide internal PDF template — _INTERNO/guia_carga.pdf (D-11).
 *
 * Step-by-step upload guide mapping each file in the carpeta to its
 * corresponding SHCP portal field. Grouped by EFICINE section.
 *
 * Portal field descriptions are hardcoded since they match the SHCP
 * submission form which does not change between periods.
 *
 * Portrait LETTER layout.
 */
import { Document, Page, Text, View } from '@react-pdf/renderer'
import '../fonts'
import { pdfStyles } from '../styles'
import { EXPORT_FILE_MAP } from '@/lib/export/fileNaming'
import { generateFilename } from '@/lib/export/fileNaming'

export interface SubmissionStep {
  stepNumber: number
  filename: string
  portalField: string
  folder: string
  section: string
}

export interface SubmissionGuideProps {
  projectTitle: string
  projectAbbrev: string
  steps: SubmissionStep[]
}

/**
 * SHCP portal field name mapping for each document ID.
 * These correspond to the field labels on the SHCP submission portal
 * (estimulosfiscales.hacienda.gob.mx).
 */
const PORTAL_FIELD_MAP: Record<string, string> = {
  A1: 'Resumen ejecutivo (FORMATO 1)',
  A2: 'Sinopsis',
  A4: 'Propuesta de direccion',
  A6: 'Solidez del equipo creativo (FORMATO 2)',
  A7: 'Propuesta de produccion',
  A8a: 'Plan de rodaje',
  A8b: 'Ruta critica',
  A9a: 'Presupuesto resumen',
  A9b: 'Presupuesto desglosado',
  A9d: 'Flujo de efectivo (FORMATO 3)',
  A10: 'Propuesta de exhibicion y distribucion',
  A11: 'Puntos bonus',
  'B3-prod': 'Contrato del productor',
  'B3-dir': 'Contrato del director',
  C2b: 'Cesion de derechos',
  C3a: 'Carta de buenas practicas cinematograficas (FORMATO 6)',
  C3b: 'Carta PICS (FORMATO 7)',
  C4: 'Ficha tecnica (FORMATO 8)',
  E1: 'Esquema financiero (FORMATO 9)',
  E2: 'Carta de aportacion exclusiva (FORMATO 10)',
}

/**
 * Section labels for grouping steps in the guide.
 */
const SECTION_ORDER = [
  { prefix: 'A_PROPUESTA', label: 'Seccion A -- Propuesta' },
  { prefix: 'B_PERSONAL', label: 'Seccion B -- Personal' },
  { prefix: 'C_ERPI', label: 'Seccion C -- ERPI' },
  { prefix: 'E_FINANZAS', label: 'Seccion E -- Finanzas' },
]

/**
 * Build submission steps from the EXPORT_FILE_MAP registry.
 *
 * Generates an ordered array of steps mapping each document to its
 * SHCP portal field, grouped by EFICINE section.
 */
export function buildSubmissionSteps(projectTitle: string): SubmissionStep[] {
  const steps: SubmissionStep[] = []
  let stepNumber = 1

  for (const sectionDef of SECTION_ORDER) {
    // Find all docIds in this section
    const sectionDocs = Object.entries(EXPORT_FILE_MAP).filter(
      ([docId, entry]) =>
        entry.section === sectionDef.prefix && PORTAL_FIELD_MAP[docId],
    )

    for (const [docId, entry] of sectionDocs) {
      const filename = generateFilename(entry.filenameTemplate, projectTitle)
      steps.push({
        stepNumber,
        filename: `${filename}.pdf`,
        portalField: PORTAL_FIELD_MAP[docId],
        folder: entry.section,
        section: sectionDef.label,
      })
      stepNumber++
    }
  }

  return steps
}

export function SubmissionGuide({
  projectTitle,
  steps,
}: SubmissionGuideProps) {
  // Group steps by section
  const sections = new Map<string, SubmissionStep[]>()
  for (const step of steps) {
    const group = sections.get(step.section) || []
    group.push(step)
    sections.set(step.section, group)
  }

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>Guia de Carga al Portal SHCP</Text>
        <Text
          style={{
            ...pdfStyles.body,
            textAlign: 'center',
            marginBottom: 16,
            color: '#666666',
          }}
        >
          estimulosfiscales.hacienda.gob.mx
        </Text>

        {/* Steps grouped by section */}
        {Array.from(sections.entries()).map(([sectionLabel, sectionSteps]) => (
          <View key={sectionLabel} style={{ marginBottom: 16 }}>
            {/* Section header */}
            <Text style={pdfStyles.subtitle}>{sectionLabel}</Text>

            {sectionSteps.map((step) => (
              <View key={step.stepNumber} style={{ marginBottom: 8 }}>
                <Text style={pdfStyles.body}>
                  Paso {step.stepNumber}: Sube {step.filename} en el campo
                  &quot;{step.portalField}&quot;
                </Text>
                <Text
                  style={{
                    ...pdfStyles.body,
                    fontSize: 8,
                    color: '#999999',
                    marginLeft: 16,
                  }}
                >
                  Ubicacion en la carpeta: {step.folder}/{step.filename}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Final note */}
        <View
          style={{
            marginTop: 16,
            padding: 8,
            backgroundColor: '#f0f0f0',
            borderRadius: 2,
          }}
        >
          <Text style={{ ...pdfStyles.body, fontSize: 9 }}>
            Nota: Los documentos de la carpeta _INTERNO/ son de uso personal. No
            subir al portal.
          </Text>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer} fixed>
          Documento interno — {projectTitle}
        </Text>
      </Page>
    </Document>
  )
}
