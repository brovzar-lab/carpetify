/**
 * Shared utility for loading all project data needed for generation passes.
 * Centralizes Firestore reads so each pass handler receives a complete,
 * typed project data bundle.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

// ---- Types ----

export interface ProjectMetadata {
  titulo_proyecto: string;
  categoria_cinematografica: string;
  categoria_director: string;
  duracion_estimada_minutos: number;
  costo_total_proyecto_centavos: number;
  monto_solicitado_eficine_centavos: number;
  periodo_registro: string;
  es_coproduccion_internacional: boolean;
  formato_filmacion: string;
  relacion_aspecto: string;
  idiomas: string[];
}

export interface ScreenplayAnalysis {
  datos_generales: {
    sinopsis: string;
    num_escenas: number;
  };
  desglose_escenas: unknown[];
  locaciones_unicas: Array<{
    nombre: string;
    tipo: string;
    frecuencia: number;
  }>;
  personajes_detalle: Array<{
    nombre: string;
    es_protagonista: boolean;
    num_escenas: number;
  }>;
  complejidad_global: {
    nivel: string;
    escenas_nocturnas: number;
    escenas_diurnas: number;
    escenas_exteriores: number;
    escenas_interiores: number;
    cambios_locacion: number;
    escenas_stunts: number;
    escenas_vfx: number;
    escenas_extras_numerosos: number;
    escenas_menores: number;
    escenas_agua: number;
    resumen_retos: string;
  };
  estimacion_jornadas: {
    baja: number;
    media: number;
    alta: number;
    justificacion: string;
  };
}

export interface ScreenplayData {
  num_escenas: number;
  num_paginas: number;
}

export interface TeamMember {
  nombre_completo: string;
  cargo: string;
  honorarios_centavos: number;
  aportacion_especie_centavos: number;
  nacionalidad: string;
  filmografia?: unknown[];
}

export interface Financials {
  aportacion_erpi_efectivo_centavos: number;
  aportacion_erpi_especie_centavos: number;
  terceros: Array<{
    nombre: string;
    tipo: string;
    monto_centavos: number;
    efectivo_o_especie: string;
  }>;
  monto_eficine_centavos: number;
  tiene_gestor: boolean;
  gestor_monto_centavos: number;
}

export interface ERPISettings {
  razon_social: string;
  rfc: string;
  representante_legal: string;
  domicilio_fiscal: string;
  objeto_social: string;
  telefono: string;
  correo: string;
}

export interface ProjectDataForGeneration {
  metadata: ProjectMetadata;
  screenplayAnalysis: ScreenplayAnalysis;
  screenplayData: ScreenplayData;
  team: TeamMember[];
  financials: Financials;
  erpiSettings: ERPISettings;
}

/**
 * Load all project data needed for generation passes from Firestore.
 * All reads are done in parallel for efficiency.
 *
 * @throws HttpsError if project or screenplay analysis not found
 */
export async function loadProjectDataForGeneration(
  projectId: string,
): Promise<ProjectDataForGeneration> {
  const db = getFirestore();

  // Load project data first to get orgId for ERPI path
  const [projectSnap, analysisSnap, screenplaySnap, teamSnap, financialsSnap] =
    await Promise.all([
      db.collection('projects').doc(projectId).get(),
      db
        .collection('projects')
        .doc(projectId)
        .collection('screenplay')
        .doc('analysis')
        .get(),
      db
        .collection('projects')
        .doc(projectId)
        .collection('screenplay')
        .doc('data')
        .get(),
      db.collection('projects').doc(projectId).collection('team').get(),
      db
        .collection('projects')
        .doc(projectId)
        .collection('financials')
        .doc('data')
        .get(),
    ]);

  // Validate project exists
  if (!projectSnap.exists) {
    throw new HttpsError(
      'not-found',
      'Proyecto no encontrado.',
    );
  }

  // Validate screenplay analysis exists
  if (!analysisSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'Primero ejecuta el analisis del guion antes de generar documentos.',
    );
  }

  const projectData = projectSnap.data()!;

  // Read ERPI from org-scoped path. Fall back to legacy singleton for pre-migration compatibility.
  const projectOrgId = projectData.orgId as string | undefined;
  let erpiSnap: FirebaseFirestore.DocumentSnapshot;
  if (projectOrgId) {
    erpiSnap = await db
      .collection('organizations')
      .doc(projectOrgId)
      .collection('erpi_settings')
      .doc('default')
      .get();
  } else {
    // Legacy fallback: pre-migration projects without orgId
    erpiSnap = await db.collection('erpi_settings').doc('default').get();
  }
  // Project metadata is nested under 'metadata' key
  const metaSource = (projectData.metadata as Record<string, unknown>) ?? projectData;
  const analysisData = analysisSnap.data()!;
  const screenplayData = screenplaySnap.exists
    ? screenplaySnap.data()!
    : { num_escenas: 0, num_paginas: 0 };
  const financialsData = financialsSnap.exists
    ? financialsSnap.data()!
    : {} as Record<string, unknown>;
  const erpiData = erpiSnap.exists
    ? erpiSnap.data()!
    : {} as Record<string, unknown>;

  const metadata: ProjectMetadata = {
    titulo_proyecto: (metaSource.titulo_proyecto as string) ?? '',
    categoria_cinematografica: (metaSource.categoria_cinematografica as string) ?? 'ficcion',
    categoria_director: (metaSource.categoria_director as string) ?? '',
    duracion_estimada_minutos: (metaSource.duracion_estimada_minutos as number) ?? 90,
    costo_total_proyecto_centavos: (metaSource.costo_total_proyecto_centavos as number) ?? 0,
    monto_solicitado_eficine_centavos: (metaSource.monto_solicitado_eficine_centavos as number) ?? 0,
    periodo_registro: (metaSource.periodo_registro as string) ?? '',
    es_coproduccion_internacional: (metaSource.es_coproduccion_internacional as boolean) ?? false,
    formato_filmacion: (metaSource.formato_filmacion as string) ?? '',
    relacion_aspecto: (metaSource.relacion_aspecto as string) ?? '',
    idiomas: (metaSource.idiomas as string[]) ?? ['Espanol'],
  };

  const team: TeamMember[] = teamSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      nombre_completo: d.nombre_completo ?? '',
      cargo: d.cargo ?? '',
      honorarios_centavos: d.honorarios_centavos ?? 0,
      aportacion_especie_centavos: d.aportacion_especie_centavos ?? 0,
      nacionalidad: d.nacionalidad ?? '',
    };
  });

  const financials: Financials = {
    aportacion_erpi_efectivo_centavos: (financialsData.aportacion_erpi_efectivo_centavos as number) ?? 0,
    aportacion_erpi_especie_centavos: (financialsData.aportacion_erpi_especie_centavos as number) ?? 0,
    terceros: (financialsData.terceros as Financials['terceros']) ?? [],
    monto_eficine_centavos: (financialsData.monto_eficine_centavos as number) ?? 0,
    tiene_gestor: (financialsData.tiene_gestor as boolean) ?? false,
    gestor_monto_centavos: (financialsData.gestor_monto_centavos as number) ?? 0,
  };

  const erpiSettings: ERPISettings = {
    razon_social: (erpiData as Record<string, unknown>).razon_social as string ?? '',
    rfc: (erpiData as Record<string, unknown>).rfc as string ?? '',
    representante_legal: (erpiData as Record<string, unknown>).representante_legal as string ?? '',
    domicilio_fiscal: (erpiData as Record<string, unknown>).domicilio_fiscal as string ?? '',
    objeto_social: (erpiData as Record<string, unknown>).objeto_social as string ?? '',
    telefono: (erpiData as Record<string, unknown>).telefono as string ?? '',
    correo: (erpiData as Record<string, unknown>).correo as string ?? '',
  };

  return {
    metadata,
    screenplayAnalysis: analysisData as unknown as ScreenplayAnalysis,
    screenplayData: screenplayData as unknown as ScreenplayData,
    team,
    financials,
    erpiSettings,
  };
}
