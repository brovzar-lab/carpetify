/**
 * Combined pass handler (Pass 5 in pipeline -- final pass).
 * Generates 8 documents: A1, A2, A4, A6, A10, A11, C4, PITCH.
 *
 * A1: Resumen Ejecutivo - FORMATO 1 (prose)
 * A2: Sinopsis (prose) -- max 3 cuartillas, includes the ending
 * A4: Propuesta Creativa de Direccion (template, NOT AI-generated per D-07)
 * A6: Solidez del Equipo Creativo - FORMATO 2 (prose)
 * A10: Propuesta de Exhibicion y Distribucion (prose)
 * A11: Propuesta de Formacion de Publico (prose)
 * C4: Ficha Tecnica - FORMATO 8 (structured)
 * PITCH: Pitch para Contribuyentes (prose, targeting corporate CFOs per AIGEN-11)
 *
 * This pass synthesizes ALL prior pass outputs plus project data.
 * A4 is a structured template for the director -- not AI prose.
 *
 * Per D-04: AI-generated documents run in parallel via concurrency pool.
 */

import { loadPrompt } from '../promptLoader.js';
import { generateProse } from '../../claude/client.js';
import {
  saveGeneratedDocument,
  loadBudgetOutput,
  getAllGeneratedDocuments,
} from '../documentStore.js';
import { markPassComplete } from '../../staleness/stalenessTracker.js';
import { createConcurrencyPool } from '../concurrencyPool.js';
import { formatMXN } from '../../shared/formatters.js';
import type { GeneratedDocument } from '../../shared/types.js';
import type { ProjectDataForGeneration } from '../orchestrator.js';
import type { StreamCallback } from './lineProducer.js';

/** Model used for Combined pass prose generation */
const MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Extract a summary from a previously generated document for cross-referencing.
 * Returns the first 500 characters of the document content for context injection.
 */
function extractPriorDocSummary(
  priorDocs: GeneratedDocument[],
  docId: string,
): string {
  const doc = priorDocs.find((d) => d.docId === docId);
  if (!doc || !doc.content) return '';
  const content = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content);
  return content.substring(0, 500);
}

/**
 * Generate A4 director template as structured data (for Word export in frontend).
 * Per D-07: A4 is NOT AI-generated prose -- it's a structured template the
 * director fills in externally.
 */
function generateDirectorTemplate(
  project: ProjectDataForGeneration,
): Record<string, unknown> {
  return {
    isTemplate: true,
    titulo_proyecto: project.metadata.titulo_proyecto,
    nombre_director:
      project.team.find((m) => m.cargo === 'director')?.nombre_completo ?? '',
    categoria_cinematografica: project.metadata.categoria_cinematografica,
    duracion_estimada_minutos: project.metadata.duracion_estimada_minutos,
    sections: [
      {
        title: 'Vision artistica',
        placeholder:
          'El director debe describir su vision artistica para el proyecto, incluyendo referencias cinematograficas, tono emocional, y la experiencia que busca crear en el espectador.',
      },
      {
        title: 'Tratamiento visual',
        placeholder:
          'Describir el tratamiento visual propuesto: fotografia, paleta de color, movimientos de camara, tipo de lente, relacion de aspecto, y decisiones esteticas.',
      },
      {
        title: 'Direccion de actores',
        placeholder:
          'Describir el enfoque de direccion de actores: metodo de trabajo, proceso de casting, ensayos, y como se construiran los personajes.',
      },
      {
        title: 'Propuesta sonora y musical',
        placeholder:
          'Describir la propuesta de diseno sonoro y musical: tipo de musica, uso de sonido ambiental, silencio dramatico, y elementos acusticos clave.',
      },
      {
        title: 'Referencias visuales y cinematograficas',
        placeholder:
          'Incluir referencias cinematograficas, fotograficas, pictoricas o de otras disciplinas que ilustren la vision del director para este proyecto.',
      },
    ],
  };
}

/**
 * Execute the Combined pass: generate A1, A2, A4, A6, A10, A11, C4, PITCH.
 *
 * A4 runs immediately as a template (no Claude call).
 * The other 7 documents are AI-generated and run in parallel via concurrency pool.
 * All prior pass outputs are loaded for cross-referencing.
 */
export async function handleCombinedPass(
  projectId: string,
  project: ProjectDataForGeneration,
  onProgress: StreamCallback,
  triggeredBy?: string,
): Promise<{ success: boolean; completedDocs: string[] }> {
  const pool = createConcurrencyPool(3); // D-04: max 3 concurrent Claude calls

  // Load all prior generated documents for cross-referencing
  const priorDocs = await getAllGeneratedDocuments(projectId);
  const budgetOutput = await loadBudgetOutput(projectId);

  // Build comprehensive variable map with ALL project data + prior outputs
  const combinedVars: Record<string, unknown> = {
    // Project metadata
    titulo_proyecto: project.metadata.titulo_proyecto,
    categoria_cinematografica: project.metadata.categoria_cinematografica,
    categoria_director: project.metadata.categoria_director,
    duracion_estimada_minutos: project.metadata.duracion_estimada_minutos,
    formato_filmacion: project.metadata.formato_filmacion,
    relacion_aspecto: project.metadata.relacion_aspecto,
    idiomas: project.metadata.idiomas.join(', '),
    costo_total_formatted: formatMXN(project.metadata.costo_total_proyecto_centavos),
    monto_eficine_formatted: formatMXN(project.metadata.monto_solicitado_eficine_centavos),
    // Screenplay analysis
    sinopsis_breve:
      project.screenplayAnalysis.datos_generales?.sinopsis ?? '',
    num_escenas: project.screenplayData.num_escenas,
    num_paginas: project.screenplayData.num_paginas,
    num_locaciones: project.screenplayAnalysis.locaciones_unicas.length,
    locaciones: project.screenplayAnalysis.locaciones_unicas,
    personajes: project.screenplayAnalysis.personajes_detalle,
    complejidad: project.screenplayAnalysis.complejidad_global,
    // Team data
    equipo_creativo: project.team.map((m) => ({
      nombre: m.nombre_completo,
      cargo: m.cargo,
      filmografia: m.filmografia,
    })),
    nombre_director:
      project.team.find((m) => m.cargo === 'director')?.nombre_completo ?? '',
    nombre_productor:
      project.team.find((m) => m.cargo === 'productor')?.nombre_completo ?? '',
    nombre_guionista:
      project.team.find((m) => m.cargo === 'guionista')?.nombre_completo ?? '',
    // Cross-pass references from prior generated documents
    propuesta_produccion_resumen: extractPriorDocSummary(priorDocs, 'A7'),
    plan_rodaje_resumen: extractPriorDocSummary(priorDocs, 'A8a'),
    presupuesto_total: budgetOutput?.totalFormatted ?? '',
    // Flags
    es_animacion:
      project.metadata.categoria_cinematografica === 'animacion',
    es_documental:
      project.metadata.categoria_cinematografica === 'documental',
    es_coproduccion_internacional:
      project.metadata.es_coproduccion_internacional,
    // ERPI data
    razon_social: project.erpiSettings.razon_social,
    rfc: project.erpiSettings.rfc,
    representante_legal: project.erpiSettings.representante_legal,
    periodo_registro: project.metadata.periodo_registro,
  };

  // === A4 is a template (no AI), runs immediately ===
  // === Other 7 docs are AI-generated -- run in parallel via pool ===
  const results = await Promise.all([
    // A4: Propuesta Creativa de Direccion (template, no Claude call per D-07)
    (async () => {
      onProgress({
        type: 'progress',
        docId: 'A4',
        status: 'generating',
        message: 'Generando plantilla Propuesta de Direccion...',
      });
      const a4Template = generateDirectorTemplate(project);
      await saveGeneratedDocument(
        projectId,
        'A4',
        a4Template,
        'combined',
        'documentos_combinados.md',
        'template',
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A4', status: 'complete' });
      return 'A4';
    })(),

    // A1: Resumen Ejecutivo (FORMATO 1)
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A1',
        status: 'generating',
        message: 'Generando Resumen Ejecutivo...',
      });
      const a1Prompt = loadPrompt('a1_resumen_ejecutivo.md', combinedVars);
      const a1Content = await generateProse(
        a1Prompt,
        'Genera el resumen ejecutivo (FORMATO 1).',
        4000,
      );
      await saveGeneratedDocument(
        projectId,
        'A1',
        a1Content,
        'combined',
        'a1_resumen_ejecutivo.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A1', status: 'complete' });
      return 'A1';
    }),

    // A2: Sinopsis (max 3 cuartillas, includes ending)
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A2',
        status: 'generating',
        message: 'Generando Sinopsis...',
      });
      const a2Prompt = loadPrompt('a2_sinopsis.md', combinedVars);
      const a2Content = await generateProse(
        a2Prompt,
        'Genera la sinopsis completa (maximo 3 cuartillas, incluye el final).',
        6000,
      );
      await saveGeneratedDocument(
        projectId,
        'A2',
        a2Content,
        'combined',
        'a2_sinopsis.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A2', status: 'complete' });
      return 'A2';
    }),

    // A6: Solidez del Equipo Creativo (FORMATO 2)
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A6',
        status: 'generating',
        message: 'Generando Solidez del Equipo Creativo...',
      });
      const a6Prompt = loadPrompt('documentos_combinados.md', {
        ...combinedVars,
        tipo_documento: 'solidez_equipo',
      });
      const a6Content = await generateProse(
        a6Prompt,
        'Genera la solidez del equipo creativo (FORMATO 2).',
        8000,
      );
      await saveGeneratedDocument(
        projectId,
        'A6',
        a6Content,
        'combined',
        'documentos_combinados.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A6', status: 'complete' });
      return 'A6';
    }),

    // A10: Propuesta de Exhibicion y Distribucion
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A10',
        status: 'generating',
        message: 'Generando Propuesta de Exhibicion...',
      });
      const a10Prompt = loadPrompt('a10_propuesta_exhibicion.md', combinedVars);
      const a10Content = await generateProse(
        a10Prompt,
        'Genera la propuesta de exhibicion y distribucion.',
        6000,
      );
      await saveGeneratedDocument(
        projectId,
        'A10',
        a10Content,
        'combined',
        'a10_propuesta_exhibicion.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A10', status: 'complete' });
      return 'A10';
    }),

    // A11: Propuesta de Formacion de Publico (puntos bonus)
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'A11',
        status: 'generating',
        message: 'Generando Propuesta de Formacion de Publico...',
      });
      const a11Prompt = loadPrompt('documentos_combinados.md', {
        ...combinedVars,
        tipo_documento: 'puntos_bonus',
      });
      const a11Content = await generateProse(
        a11Prompt,
        'Evalua la elegibilidad para puntos bonus (+5 pts).',
        4000,
      );
      await saveGeneratedDocument(
        projectId,
        'A11',
        a11Content,
        'combined',
        'documentos_combinados.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'A11', status: 'complete' });
      return 'A11';
    }),

    // C4: Ficha Tecnica (FORMATO 8)
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'C4',
        status: 'generating',
        message: 'Generando Ficha Tecnica...',
      });
      const c4Prompt = loadPrompt('documentos_combinados.md', {
        ...combinedVars,
        tipo_documento: 'ficha_tecnica',
      });
      const c4Content = await generateProse(
        c4Prompt,
        'Genera la ficha tecnica del proyecto (FORMATO 8).',
        4000,
      );
      await saveGeneratedDocument(
        projectId,
        'C4',
        c4Content,
        'combined',
        'documentos_combinados.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'C4', status: 'complete' });
      return 'C4';
    }),

    // PITCH: Pitch para Contribuyentes (AIGEN-11)
    // Targeting corporate CFOs who would donate ISR via EFICINE mechanism
    pool.run(async () => {
      onProgress({
        type: 'progress',
        docId: 'PITCH',
        status: 'generating',
        message: 'Generando Pitch para Contribuyentes...',
      });
      const pitchPrompt = loadPrompt('documentos_combinados.md', {
        ...combinedVars,
        tipo_documento: 'pitch_contribuyentes',
      });
      const pitchContent = await generateProse(
        pitchPrompt,
        'Genera el pitch para contribuyentes de EFICINE. Documento de 1-2 paginas dirigido a CFOs corporativos que donarian ISR via el mecanismo EFICINE.',
        4000,
      );
      await saveGeneratedDocument(
        projectId,
        'PITCH',
        pitchContent,
        'combined',
        'documentos_combinados.md',
        MODEL,
        triggeredBy,
        'regeneration',
      );
      onProgress({ type: 'progress', docId: 'PITCH', status: 'complete' });
      return 'PITCH';
    }),
  ]);

  await markPassComplete(projectId, 'combined');
  return { success: true, completedDocs: results };
}
