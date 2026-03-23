/**
 * Legal pass handler (Pass 4 in pipeline).
 * Generates 5 documents: B3-prod, B3-dir, C2b, C3a, C3b.
 *
 * B3-prod: Contrato Productor (prose)
 * B3-dir: Contrato Director (prose)
 * C2b: Cesion de Derechos de Guion (prose)
 * C3a: Carta Compromiso Buenas Practicas - FORMATO 6 (prose)
 * C3b: Carta Compromiso PICS - FORMATO 7 (prose)
 *
 * Fee amounts are injected DETERMINISTICALLY from intake team data.
 * AI writes contract prose around pre-computed amounts, never inventing
 * financial figures (Pitfall 6 from Research, AIGEN-06).
 *
 * Per D-15: Fee amounts come from project.team (intake data), NOT from budget output.
 * Per D-04: All 5 documents run in parallel via concurrency pool.
 */

import { loadPrompt } from '../promptLoader.js';
import { generateProse } from '../../claude/client.js';
import { saveGeneratedDocument, loadBudgetOutput } from '../documentStore.js';
import { markPassComplete } from '../../staleness/stalenessTracker.js';
import { createConcurrencyPool } from '../concurrencyPool.js';
import { formatMXN, formatMXNLegal } from '../../shared/formatters.js';
import type { ProjectDataForGeneration } from '../orchestrator.js';
import type { StreamCallback } from './lineProducer.js';

/** Model used for Legal pass prose generation */
const MODEL = 'claude-sonnet-4-5-20250514';

/**
 * Execute the Legal pass: generate B3-prod, B3-dir, C2b, C3a, C3b.
 *
 * All 5 legal documents are fully independent and run in parallel via
 * the concurrency pool. Fee amounts in contracts are injected via
 * formatMXNLegal from intake team data -- AI never calculates amounts.
 *
 * @throws HttpsError if budget output not found (lineProducer must run first)
 */
export async function handleLegalPass(
  projectId: string,
  project: ProjectDataForGeneration,
  onProgress: StreamCallback,
): Promise<{ success: boolean; completedDocs: string[] }> {
  const pool = createConcurrencyPool(3); // D-04: max 3 concurrent Claude calls

  // Load budget output to validate lineProducer has run (D-13 cross-pass dependency)
  const budgetOutput = await loadBudgetOutput(projectId);
  if (!budgetOutput) {
    throw new Error('Primero ejecuta el Paso 2 (Line Producer).');
  }

  // Extract fee amounts from team data (D-15: fees come from intake, not budget)
  const producer = project.team.find((m) => m.cargo === 'productor');
  const director = project.team.find((m) => m.cargo === 'director');
  const screenwriter = project.team.find((m) => m.cargo === 'guionista');

  // Build legal-specific prompt variables
  // Uses formatMXNLegal for contract amounts (with decimals + word representation)
  const legalVars: Record<string, unknown> = {
    titulo_proyecto: project.metadata.titulo_proyecto,
    razon_social_erpi: project.erpiSettings.razon_social,
    razon_social: project.erpiSettings.razon_social,
    rfc_erpi: project.erpiSettings.rfc,
    rfc: project.erpiSettings.rfc,
    representante_legal: project.erpiSettings.representante_legal,
    domicilio_erpi: project.erpiSettings.domicilio_fiscal,
    domicilio_fiscal: project.erpiSettings.domicilio_fiscal,
    objeto_social: project.erpiSettings.objeto_social,
    // Fee amounts from intake team data in legal format
    honorarios_productor: formatMXNLegal(producer?.honorarios_centavos ?? 0),
    honorarios_director: formatMXNLegal(director?.honorarios_centavos ?? 0),
    honorarios_guionista: formatMXNLegal(screenwriter?.honorarios_centavos ?? 0),
    // Display format for reference
    honorarios_productor_mxn: formatMXN(producer?.honorarios_centavos ?? 0),
    honorarios_director_mxn: formatMXN(director?.honorarios_centavos ?? 0),
    honorarios_guionista_mxn: formatMXN(screenwriter?.honorarios_centavos ?? 0),
    // Team member names
    nombre_productor: producer?.nombre_completo ?? '',
    nombre_director: director?.nombre_completo ?? '',
    nombre_guionista: screenwriter?.nombre_completo ?? '',
    // Producer/director full data for contracts
    nombre_contratado: '', // Set per document
    cargo: '', // Set per document
    // Budget total for context
    costo_total_formatted: formatMXN(project.metadata.costo_total_proyecto_centavos),
    monto_eficine_formatted: formatMXN(project.metadata.monto_solicitado_eficine_centavos),
  };

  // === All 5 legal docs are independent -- run in parallel via pool ===
  const results = await Promise.all([
    // B3-prod: Contrato Productor
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'B3-prod',
        status: 'generating',
        message: 'Generando Contrato Productor...',
      });
      const b3ProdPrompt = loadPrompt('documentos_legales.md', {
        ...legalVars,
        nombre_contratado: producer?.nombre_completo ?? '',
        cargo: 'Productor',
        tipo_contrato: 'productor',
        honorarios_contratado: formatMXNLegal(producer?.honorarios_centavos ?? 0),
      });
      const b3ProdContent = await generateProse(
        b3ProdPrompt,
        'Genera el contrato del productor.',
      );
      await saveGeneratedDocument(
        projectId,
        'B3-prod',
        b3ProdContent,
        'legal',
        'documentos_legales.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'B3-prod', status: 'complete' });
      return 'B3-prod';
    }),

    // B3-dir: Contrato Director
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'B3-dir',
        status: 'generating',
        message: 'Generando Contrato Director...',
      });
      const b3DirPrompt = loadPrompt('documentos_legales.md', {
        ...legalVars,
        nombre_contratado: director?.nombre_completo ?? '',
        cargo: 'Director',
        tipo_contrato: 'director',
        honorarios_contratado: formatMXNLegal(director?.honorarios_centavos ?? 0),
      });
      const b3DirContent = await generateProse(
        b3DirPrompt,
        'Genera el contrato del director.',
      );
      await saveGeneratedDocument(
        projectId,
        'B3-dir',
        b3DirContent,
        'legal',
        'documentos_legales.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'B3-dir', status: 'complete' });
      return 'B3-dir';
    }),

    // C2b: Cesion de Derechos de Guion
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'C2b',
        status: 'generating',
        message: 'Generando Cesion de Derechos...',
      });
      const c2bPrompt = loadPrompt('documentos_legales.md', {
        ...legalVars,
        nombre_contratado: screenwriter?.nombre_completo ?? '',
        cargo: 'Guionista',
        tipo_documento: 'cesion_derechos',
        honorarios_contratado: formatMXNLegal(screenwriter?.honorarios_centavos ?? 0),
      });
      const c2bContent = await generateProse(
        c2bPrompt,
        'Genera la cesion de derechos del guion.',
      );
      await saveGeneratedDocument(
        projectId,
        'C2b',
        c2bContent,
        'legal',
        'documentos_legales.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'C2b', status: 'complete' });
      return 'C2b';
    }),

    // C3a: Carta Compromiso Buenas Practicas (FORMATO 6)
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'C3a',
        status: 'generating',
        message: 'Generando Carta Buenas Practicas...',
      });
      const c3aPrompt = loadPrompt('documentos_legales.md', {
        ...legalVars,
        tipo_documento: 'buenas_practicas',
      });
      const c3aContent = await generateProse(
        c3aPrompt,
        'Genera la carta de buenas practicas laborales (FORMATO 6).',
      );
      await saveGeneratedDocument(
        projectId,
        'C3a',
        c3aContent,
        'legal',
        'documentos_legales.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'C3a', status: 'complete' });
      return 'C3a';
    }),

    // C3b: Carta Compromiso PICS (FORMATO 7)
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'C3b',
        status: 'generating',
        message: 'Generando Carta PICS...',
      });
      const c3bPrompt = loadPrompt('documentos_legales.md', {
        ...legalVars,
        tipo_documento: 'pics',
      });
      const c3bContent = await generateProse(
        c3bPrompt,
        'Genera la carta de practicas de inclusion y corresponsabilidad social (FORMATO 7).',
      );
      await saveGeneratedDocument(
        projectId,
        'C3b',
        c3bContent,
        'legal',
        'documentos_legales.md',
        MODEL,
      );
      onProgress({ type: 'progress', docId: 'C3b', status: 'complete' });
      return 'C3b';
    }),
  ]);

  await markPassComplete(projectId, 'legal');
  return { success: true, completedDocs: results };
}
