/**
 * Resumen Ejecutivo (FORMATO 1) PDF template — A1.
 *
 * Two-column key-value table showing all FORMATO 1 required fields.
 * Portrait LETTER layout.
 */
import React from 'react'
import { Document, Page, Text } from '@react-pdf/renderer'
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table'
import '../fonts'
import { pdfStyles } from '../styles'

export interface ResumenEjecutivoData {
  titulo: string
  genero: string
  categoria: string
  duracion: string
  formato: string
  sinopsis: string
  director: string
  productor: string
  guionista: string
  presupuestoTotal: string
  montoEFICINE: string
  porcentajeEFICINE: string
  aportacionERPI: string
  porcentajeERPI: string
}

export interface ResumenEjecutivoProps {
  projectTitle: string
  data: ResumenEjecutivoData
}

const FIELDS: Array<{ label: string; key: keyof ResumenEjecutivoData }> = [
  { label: 'Titulo del proyecto', key: 'titulo' },
  { label: 'Genero', key: 'genero' },
  { label: 'Categoria', key: 'categoria' },
  { label: 'Duracion estimada', key: 'duracion' },
  { label: 'Formato de filmacion', key: 'formato' },
  { label: 'Sinopsis', key: 'sinopsis' },
  { label: 'Director(a)', key: 'director' },
  { label: 'Productor(a)', key: 'productor' },
  { label: 'Guionista', key: 'guionista' },
  { label: 'Presupuesto total', key: 'presupuestoTotal' },
  { label: 'Monto solicitado EFICINE', key: 'montoEFICINE' },
  { label: 'Porcentaje EFICINE', key: 'porcentajeEFICINE' },
  { label: 'Aportacion ERPI', key: 'aportacionERPI' },
  { label: 'Porcentaje ERPI', key: 'porcentajeERPI' },
]

export function ResumenEjecutivo({ projectTitle, data }: ResumenEjecutivoProps) {
  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Page header */}
        <Text style={pdfStyles.pageHeader}>{projectTitle}</Text>

        {/* Document title */}
        <Text style={pdfStyles.title}>RESUMEN EJECUTIVO (FORMATO 1)</Text>

        {/* Key-value table */}
        <Table weightings={[0.35, 0.65]}>
          <TH>
            <TD style={pdfStyles.tableHeader}>
              <Text>Campo</Text>
            </TD>
            <TD style={pdfStyles.tableHeader}>
              <Text>Valor</Text>
            </TD>
          </TH>
          {FIELDS.map((field) => (
            <TR key={field.key}>
              <TD style={pdfStyles.tableCell}>
                <Text style={{ fontWeight: 700 }}>{field.label}</Text>
              </TD>
              <TD style={pdfStyles.tableCell}>
                <Text>{data[field.key]}</Text>
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
