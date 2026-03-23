/**
 * Finance Advisor pass handler (Pass 3 in pipeline).
 * Generates 3 documents: A9d, E1, E2.
 *
 * A9d: Flujo de Efectivo - FORMATO 3 (table with prose)
 * E1: Esquema Financiero - FORMATO 9 (structured with prose)
 * E2: Carta de Aportacion Exclusiva - FORMATO 10 (prose)
 *
 * Per AIGEN-06: AI never calculates financial figures.
 * A9d amounts come from buildCashFlow, E1 from computeFinancialScheme.
 * AI writes prose narrative around the computed data.
 *
 * Per D-13: Budget data flows from documentStore (stored by lineProducer pass),
 * not from parsing AI-generated documents.
 *
 * Per D-04: All 3 documents are independent -- run in parallel via concurrency pool.
 */

import { loadPrompt } from '../promptLoader.js';
import { generateProse } from '../../claude/client.js';
import {
  saveGeneratedDocument,
  loadBudgetOutput,
} from '../documentStore.js';
import { markPassComplete } from '../../staleness/stalenessTracker.js';
import { createConcurrencyPool } from '../concurrencyPool.js';
import { buildCashFlow } from '../../financial/cashFlowBuilder.js';
import { computeFinancialScheme } from '../../financial/financialScheme.js';
import { formatMXN } from '../../shared/formatters.js';
import { HttpsError } from 'firebase-functions/v2/https';
import type { ProjectDataForGeneration } from '../orchestrator.js';
import type { StreamCallback } from './lineProducer.js';

/** Model used for Finance Advisor pass prose generation */
const MODEL = 'claude-sonnet-4-5-20250514';

/**
 * Execute the Finance Advisor pass: generate A9d, E1, E2.
 *
 * Prerequisite: Line Producer pass must have run first (budget output stored).
 *
 * All 3 documents are independent of each other -- run in parallel via pool.
 * Financial figures are computed deterministically, then AI writes narrative around them.
 */
export async function handleFinanceAdvisorPass(
  projectId: string,
  project: ProjectDataForGeneration,
  onProgress: StreamCallback,
): Promise<{ success: boolean; completedDocs: string[] }> {
  const pool = createConcurrencyPool(3); // D-04

  // Load budget output from Firestore (stored by lineProducer pass per D-13)
  const budgetOutput = await loadBudgetOutput(projectId);
  if (!budgetOutput) {
    throw new HttpsError(
      'failed-precondition',
      'Primero ejecuta el Paso 2 (Line Producer) para generar el presupuesto.',
    );
  }

  // Compute financial derivatives deterministically
  // Derive project start month from periodo_registro
  const startMonth = deriveStartMonth(project.metadata.periodo_registro);
  const durationMonths = 12; // Standard 12-month production timeline

  const cashFlow = buildCashFlow(budgetOutput, startMonth, durationMonths);
  const scheme = computeFinancialScheme(project.financials, budgetOutput);

  // Build shared prompt variables
  const promptVars: Record<string, unknown> = {
    titulo_proyecto: project.metadata.titulo_proyecto,
    categoria_cinematografica: project.metadata.categoria_cinematografica,
    duracion_estimada_minutos: project.metadata.duracion_estimada_minutos,
    costo_total_formatted: formatMXN(project.metadata.costo_total_proyecto_centavos),
    monto_eficine_formatted: formatMXN(project.metadata.monto_solicitado_eficine_centavos),
    presupuesto_total: budgetOutput.totalFormatted,
    razon_social: project.erpiSettings.razon_social,
    rfc: project.erpiSettings.rfc,
    representante_legal: project.erpiSettings.representante_legal,
    domicilio_fiscal: project.erpiSettings.domicilio_fiscal,
  };

  // === All 3 docs are independent -- run in parallel via pool ===
  const results = await Promise.all([
    pool.run(async () => {
      // A9d: Flujo de Efectivo (FORMATO 3) -- deterministic computation + prose
      onProgress({
        type: 'progress',
        docId: 'A9d',
        status: 'generating',
        message: 'Generando Flujo de Efectivo...',
      });
      const a9dPrompt = loadPrompt('documentos_financieros.md', {
        ...promptVars,
        flujo_efectivo_matriz: JSON.stringify(cashFlow),
        total_general: formatMXN(cashFlow.grandTotal),
        meses: cashFlow.months.join(', '),
      });
      const a9dProse = await generateProse(
        a9dPrompt,
        'Genera el flujo de efectivo (FORMATO 3) con la narrativa que acompana la tabla.',
      );
      await saveGeneratedDocument(
        projectId,
        'A9d',
        { prose: a9dProse, structured: cashFlow },
        'financeAdvisor',
        'documentos_financieros.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'A9d', status: 'complete' });
      return 'A9d';
    }),
    pool.run(async () => {
      // E1: Esquema Financiero (FORMATO 9) -- deterministic computation + prose
      onProgress({
        type: 'progress',
        docId: 'E1',
        status: 'generating',
        message: 'Generando Esquema Financiero...',
      });
      const e1Prompt = loadPrompt('documentos_financieros.md', {
        ...promptVars,
        esquema_financiero: JSON.stringify(scheme),
        fuentes_financiamiento: scheme.sources
          .map(
            (s) =>
              `${s.nombre}: ${formatMXN(s.monto_centavos)} (${s.porcentaje}%)`,
          )
          .join('\n'),
      });
      const e1Prose = await generateProse(
        e1Prompt,
        'Genera el esquema financiero (FORMATO 9) con la narrativa que describe las fuentes de financiamiento.',
      );
      await saveGeneratedDocument(
        projectId,
        'E1',
        { prose: e1Prose, structured: scheme },
        'financeAdvisor',
        'documentos_financieros.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'E1', status: 'complete' });
      return 'E1';
    }),
    pool.run(async () => {
      // E2: Carta Aportacion Exclusiva (FORMATO 10) -- prose document
      onProgress({
        type: 'progress',
        docId: 'E2',
        status: 'generating',
        message: 'Generando Carta Aportacion Exclusiva...',
      });
      const e2Prompt = loadPrompt('documentos_financieros.md', {
        ...promptVars,
        monto_erpi_efectivo: formatMXN(
          project.financials.aportacion_erpi_efectivo_centavos,
        ),
        monto_erpi_especie: formatMXN(
          project.financials.aportacion_erpi_especie_centavos,
        ),
      });
      const e2Content = await generateProse(
        e2Prompt,
        'Genera la carta de aportacion exclusiva (FORMATO 10).',
      );
      await saveGeneratedDocument(
        projectId,
        'E2',
        e2Content,
        'financeAdvisor',
        'documentos_financieros.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'E2', status: 'complete' });
      return 'E2';
    }),
  ]);

  await markPassComplete(projectId, 'financeAdvisor');
  return { success: true, completedDocs: results };
}

/**
 * Derive project start month from EFICINE periodo_registro.
 * Period 1: starts ~March (after Feb 13 approval window)
 * Period 2: starts ~August (after Jul 15 approval window)
 */
function deriveStartMonth(periodoRegistro: string): Date {
  const year = new Date().getFullYear();
  if (periodoRegistro.includes('P1') || periodoRegistro.includes('1')) {
    return new Date(year, 2, 1); // March
  }
  return new Date(year, 7, 1); // August
}
