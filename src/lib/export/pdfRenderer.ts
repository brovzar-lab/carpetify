/**
 * PDF rendering router — routes documents to correct template components.
 *
 * Provides two entry points:
 *   - renderDocumentToPdf: routes TemplateType to one of 12 document templates
 *   - renderMetaDocument: routes meta-doc type to one of 3 internal templates
 *
 * Both functions produce a Blob via @react-pdf/renderer's pdf().toBlob().
 * Fonts are registered as a side-effect import at module level.
 */
import React from 'react'
import { pdf } from '@react-pdf/renderer'

// Side-effect: register NotoSans fonts before any rendering
import '../../components/pdf/fonts'

import type { TemplateType } from './types'

// Document templates
import { ProseDocument } from '../../components/pdf/templates/ProseDocument'
import { ResumenEjecutivo } from '../../components/pdf/templates/ResumenEjecutivo'
import { SolidezEquipo } from '../../components/pdf/templates/SolidezEquipo'
import { BudgetSummary } from '../../components/pdf/templates/BudgetSummary'
import { BudgetDetail } from '../../components/pdf/templates/BudgetDetail'
import { CashFlowTable } from '../../components/pdf/templates/CashFlowTable'
import { RutaCritica } from '../../components/pdf/templates/RutaCritica'
import { FinancialScheme } from '../../components/pdf/templates/FinancialScheme'
import { ContractDocument } from '../../components/pdf/templates/ContractDocument'
import { CartaCompromiso } from '../../components/pdf/templates/CartaCompromiso'
import { CartaAportacion } from '../../components/pdf/templates/CartaAportacion'
import { FichaTecnica } from '../../components/pdf/templates/FichaTecnica'

// Meta-document templates
import { ValidationReport } from '../../components/pdf/templates/ValidationReport'
import { ScoreEstimate } from '../../components/pdf/templates/ScoreEstimate'
import { SubmissionGuide } from '../../components/pdf/templates/SubmissionGuide'

import type { ProseDocumentProps } from '../../components/pdf/templates/ProseDocument'
import type { ResumenEjecutivoProps } from '../../components/pdf/templates/ResumenEjecutivo'
import type { SolidezEquipoProps } from '../../components/pdf/templates/SolidezEquipo'
import type { BudgetSummaryProps } from '../../components/pdf/templates/BudgetSummary'
import type { BudgetDetailProps } from '../../components/pdf/templates/BudgetDetail'
import type { CashFlowTableProps } from '../../components/pdf/templates/CashFlowTable'
import type { RutaCriticaProps } from '../../components/pdf/templates/RutaCritica'
import type { FinancialSchemeProps } from '../../components/pdf/templates/FinancialScheme'
import type { ContractDocumentProps } from '../../components/pdf/templates/ContractDocument'
import type { CartaCompromisoProps } from '../../components/pdf/templates/CartaCompromiso'
import type { CartaAportacionProps } from '../../components/pdf/templates/CartaAportacion'
import type { FichaTecnicaProps } from '../../components/pdf/templates/FichaTecnica'

import type { ValidationReportProps } from '../../components/pdf/templates/ValidationReport'
import type { ScoreEstimateProps } from '../../components/pdf/templates/ScoreEstimate'
import type { SubmissionGuideProps } from '../../components/pdf/templates/SubmissionGuide'

export interface RenderDocInput {
  docId: string
  /** Content varies by template type — caller shapes data to match template props */
  content: unknown
  templateType: TemplateType
  projectTitle: string
  sectionLabel: string
}

/**
 * Render a document to PDF blob.
 *
 * Routes the input to the correct template based on templateType,
 * creates the JSX element, and returns a Blob via pdf().toBlob().
 */
export async function renderDocumentToPdf(input: RenderDocInput): Promise<Blob> {
  const { content, templateType, projectTitle, sectionLabel } = input

  let element: React.ReactElement

  switch (templateType) {
    case 'prose': {
      const data = content as Omit<ProseDocumentProps, 'projectTitle' | 'sectionLabel'>
      element = React.createElement(ProseDocument, {
        ...data,
        projectTitle,
        sectionLabel,
      })
      break
    }

    case 'resumen-ejecutivo': {
      const data = content as Omit<ResumenEjecutivoProps, 'projectTitle'>
      element = React.createElement(ResumenEjecutivo, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'solidez-equipo': {
      const data = content as Omit<SolidezEquipoProps, 'projectTitle'>
      element = React.createElement(SolidezEquipo, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'budget-summary': {
      const data = content as Omit<BudgetSummaryProps, 'projectTitle'>
      element = React.createElement(BudgetSummary, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'budget-detail': {
      const data = content as Omit<BudgetDetailProps, 'projectTitle'>
      element = React.createElement(BudgetDetail, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'cash-flow': {
      const data = content as Omit<CashFlowTableProps, 'projectTitle'>
      element = React.createElement(CashFlowTable, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'ruta-critica': {
      const data = content as Omit<RutaCriticaProps, 'projectTitle'>
      element = React.createElement(RutaCritica, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'financial-scheme': {
      const data = content as Omit<FinancialSchemeProps, 'projectTitle'>
      element = React.createElement(FinancialScheme, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'contract': {
      const data = content as Omit<ContractDocumentProps, 'projectTitle' | 'sectionLabel'>
      element = React.createElement(ContractDocument, {
        ...data,
        projectTitle,
        sectionLabel,
      })
      break
    }

    case 'carta': {
      const data = content as Omit<CartaCompromisoProps, 'projectTitle' | 'sectionLabel'>
      element = React.createElement(CartaCompromiso, {
        ...data,
        projectTitle,
        sectionLabel,
      })
      break
    }

    case 'carta-aportacion': {
      const data = content as Omit<CartaAportacionProps, 'projectTitle'>
      element = React.createElement(CartaAportacion, {
        ...data,
        projectTitle,
      })
      break
    }

    case 'ficha-tecnica': {
      const data = content as Omit<FichaTecnicaProps, 'projectTitle'>
      element = React.createElement(FichaTecnica, {
        ...data,
        projectTitle,
      })
      break
    }

    default: {
      const exhaustive: never = templateType
      throw new Error(`Unknown template type: ${exhaustive}`)
    }
  }

  return pdf(element).toBlob()
}

export interface RenderMetaInput {
  type: 'validation-report' | 'score-estimate' | 'submission-guide'
  /** Data varies by meta-doc type — caller shapes data to match template props */
  data: unknown
  projectTitle: string
}

/**
 * Render a meta-document (internal, not included in EFICINE submission) to PDF blob.
 *
 * Routes to the correct internal template and returns a Blob via pdf().toBlob().
 */
export async function renderMetaDocument(input: RenderMetaInput): Promise<Blob> {
  const { type, data, projectTitle } = input

  let element: React.ReactElement

  switch (type) {
    case 'validation-report': {
      const props = data as Omit<ValidationReportProps, 'projectTitle'>
      element = React.createElement(ValidationReport, {
        ...props,
        projectTitle,
      })
      break
    }

    case 'score-estimate': {
      const props = data as Omit<ScoreEstimateProps, 'projectTitle'>
      element = React.createElement(ScoreEstimate, {
        ...props,
        projectTitle,
      })
      break
    }

    case 'submission-guide': {
      const props = data as Omit<SubmissionGuideProps, 'projectTitle'>
      element = React.createElement(SubmissionGuide, {
        ...props,
        projectTitle,
      })
      break
    }

    default: {
      const exhaustive: never = type
      throw new Error(`Unknown meta-document type: ${exhaustive}`)
    }
  }

  return pdf(element).toBlob()
}
