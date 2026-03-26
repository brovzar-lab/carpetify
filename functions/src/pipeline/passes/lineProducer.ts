/**
 * Line Producer pass handler (Pass 2 in pipeline).
 * Generates 5 documents: A7, A8a, A8b, A9a, A9b.
 *
 * A7: Propuesta de Produccion (prose)
 * A8a: Plan de Rodaje (table)
 * A8b: Ruta Critica (table)
 * A9a: Presupuesto Resumen (structured) -- uses computeBudget output
 * A9b: Presupuesto Desglosado (structured) -- pure deterministic, NO AI
 *
 * Per AIGEN-06: AI never calculates financial figures. Budget amounts
 * come from computeBudget, which uses locked intake fees (D-15).
 *
 * Per D-04: Independent documents run in parallel via concurrency pool.
 */

import { loadPrompt } from '../promptLoader.js';
import { generateProse } from '../../claude/client.js';
import { computeBudget, type BudgetInput } from '../../financial/budgetComputer.js';
import {
  saveGeneratedDocument,
  storeBudgetOutputForDownstream,
} from '../documentStore.js';
import { markPassComplete } from '../../staleness/stalenessTracker.js';
import { createConcurrencyPool } from '../concurrencyPool.js';
import { formatMXN } from '../../shared/formatters.js';
import type { ProjectDataForGeneration } from '../orchestrator.js';

/** Model used for Line Producer pass prose generation */
const MODEL = 'claude-sonnet-4-5-20250929';

export interface StreamCallback {
  (chunk: {
    type: 'progress';
    docId: string;
    status: 'generating' | 'complete';
    message?: string;
  }): void;
}

/**
 * Execute the Line Producer pass: generate A7, A8a, A8b, A9a, A9b.
 *
 * Phase 1: Parallel prose generation (A7, A8a, A8b) -- independent of each other.
 * Phase 2: Budget computation (deterministic), then A9a/A9b in parallel.
 * Finally: Store budget for downstream passes and mark pass complete.
 */
export async function handleLineProducerPass(
  projectId: string,
  project: ProjectDataForGeneration,
  onProgress: StreamCallback,
  triggeredBy?: string,
): Promise<{ success: boolean; completedDocs: string[] }> {
  const pool = createConcurrencyPool(3); // D-04: max 3 concurrent Claude calls
  const completedDocs: string[] = [];

  // Build variable map from project data for prompt injection
  const promptVars: Record<string, unknown> = {
    titulo_proyecto: project.metadata.titulo_proyecto,
    categoria_cinematografica: project.metadata.categoria_cinematografica,
    categoria_director: project.metadata.categoria_director,
    duracion_estimada_minutos: project.metadata.duracion_estimada_minutos,
    formato_filmacion: project.metadata.formato_filmacion,
    relacion_aspecto: project.metadata.relacion_aspecto,
    idiomas: project.metadata.idiomas.join(', '),
    sinopsis: project.screenplayAnalysis.datos_generales.sinopsis,
    num_escenas: project.screenplayAnalysis.datos_generales.num_escenas,
    locaciones: project.screenplayAnalysis.locaciones_unicas,
    personajes: project.screenplayAnalysis.personajes_detalle,
    complejidad: project.screenplayAnalysis.complejidad_global,
    estimacion_jornadas: project.screenplayAnalysis.estimacion_jornadas.media,
    jornadas_baja: project.screenplayAnalysis.estimacion_jornadas.baja,
    jornadas_alta: project.screenplayAnalysis.estimacion_jornadas.alta,
    justificacion_jornadas: project.screenplayAnalysis.estimacion_jornadas.justificacion,
    costo_total_formatted: formatMXN(project.metadata.costo_total_proyecto_centavos),
    monto_eficine_formatted: formatMXN(project.metadata.monto_solicitado_eficine_centavos),
    equipo: project.team,
    es_coproduccion: project.metadata.es_coproduccion_internacional,
    resumen_retos: project.screenplayAnalysis.complejidad_global.resumen_retos,
  };

  // === Phase 1: Parallel prose generation (A7, A8a, A8b) ===
  // These 3 docs are independent of each other -- run in parallel via pool
  const proseResults = await Promise.all([
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A7',
        status: 'generating',
        message: 'Generando Propuesta de Produccion...',
      });
      const a7Prompt = loadPrompt('a7_propuesta_produccion.md', promptVars);
      const a7Content = await generateProse(
        a7Prompt,
        'Genera la propuesta de produccion para el proyecto.',
      );
      await saveGeneratedDocument(
        projectId,
        'A7',
        a7Content,
        'lineProducer',
        'a7_propuesta_produccion.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A7', status: 'complete' });
      return 'A7';
    }),
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A8a',
        status: 'generating',
        message: 'Generando Plan de Rodaje...',
      });
      const a8Prompt = loadPrompt('a8_plan_rodaje_y_ruta_critica.md', promptVars);
      const a8aContent = await generateProse(
        a8Prompt,
        'Genera el plan de rodaje detallado.',
      );
      await saveGeneratedDocument(
        projectId,
        'A8a',
        a8aContent,
        'lineProducer',
        'a8_plan_rodaje_y_ruta_critica.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A8a', status: 'complete' });
      return 'A8a';
    }),
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A8b',
        status: 'generating',
        message: 'Generando Ruta Critica...',
      });
      const a8bPrompt = loadPrompt('a8_plan_rodaje_y_ruta_critica.md', promptVars);
      const a8bContent = await generateProse(
        a8bPrompt,
        'Genera la ruta critica del proyecto cinematografico.',
      );
      await saveGeneratedDocument(
        projectId,
        'A8b',
        a8bContent,
        'lineProducer',
        'a8_plan_rodaje_y_ruta_critica.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A8b', status: 'complete' });
      return 'A8b';
    }),
  ]);
  completedDocs.push(...proseResults);

  // === Phase 2: Budget computation (deterministic, no AI) then A9a/A9b ===
  const budgetInput: BudgetInput = {
    jornadas: project.screenplayAnalysis.estimacion_jornadas.media,
    locaciones: project.screenplayAnalysis.locaciones_unicas.length,
    equipo: project.team.map((m) => ({
      cargo: m.cargo,
      honorarios_centavos: m.honorarios_centavos,
      aportacion_especie_centavos: m.aportacion_especie_centavos,
    })),
    costoTotalProyectoCentavos: project.metadata.costo_total_proyecto_centavos,
    esAnimacion: project.metadata.categoria_cinematografica === 'animacion',
    esDocumental: project.metadata.categoria_cinematografica === 'documental',
  };
  const budget = computeBudget(budgetInput);

  // A9a and A9b can run in parallel since they use the same budget data
  const budgetResults = await Promise.all([
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A9a',
        status: 'generating',
        message: 'Generando Presupuesto Resumen...',
      });
      const a9Prompt = loadPrompt('a9_presupuesto.md', {
        ...promptVars,
        presupuesto_total: budget.totalFormatted,
        cuentas_resumen: JSON.stringify(
          budget.cuentas.map((c) => ({
            cuenta: c.nombreCuenta,
            subtotal: formatMXN(c.subtotalCentavos),
          })),
        ),
      });
      const a9aContent = await generateProse(
        a9Prompt,
        'Genera el resumen del presupuesto.',
      );
      await saveGeneratedDocument(
        projectId,
        'A9a',
        a9aContent,
        'lineProducer',
        'a9_presupuesto.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A9a', status: 'complete' });
      return 'A9a';
    }),
    (async () => {
      // A9b: Presupuesto Desglosado -- deterministic, no AI call needed
      onProgress({
        type: 'progress',
        docId: 'A9b',
        status: 'generating',
        message: 'Generando Presupuesto Desglose...',
      });
      await saveGeneratedDocument(
        projectId,
        'A9b',
        budget,
        'lineProducer',
        'a9_presupuesto.md',
        'deterministic',
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A9b', status: 'complete' });
      return 'A9b';
    })(),
  ]);
  completedDocs.push(...budgetResults);

  // Store FULL budget output for downstream passes (D-13)
  await storeBudgetOutputForDownstream(projectId, budget);

  await markPassComplete(projectId, 'lineProducer');
  return { success: true, completedDocs };
}
