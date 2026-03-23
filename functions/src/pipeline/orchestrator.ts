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

  // Load all data in parallel
  const [projectSnap, analysisSnap, screenplaySnap, teamSnap, erpiSnap] =
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
      // ERPI settings are linked from project metadata
      db.collection('erpi').limit(1).get(),
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
  const analysisData = analysisSnap.data()!;
  const screenplayData = screenplaySnap.exists
    ? screenplaySnap.data()!
    : { num_escenas: 0, num_paginas: 0 };
  const erpiData = erpiSnap.docs.length > 0
    ? erpiSnap.docs[0].data()
    : {};

  const metadata: ProjectMetadata = {
    titulo_proyecto: projectData.titulo_proyecto ?? '',
    categoria_cinematografica: projectData.categoria_cinematografica ?? 'ficcion',
    categoria_director: projectData.categoria_director ?? '',
    duracion_estimada_minutos: projectData.duracion_estimada_minutos ?? 90,
    costo_total_proyecto_centavos: projectData.costo_total_proyecto_centavos ?? 0,
    monto_solicitado_eficine_centavos: projectData.monto_solicitado_eficine_centavos ?? 0,
    periodo_registro: projectData.periodo_registro ?? '',
    es_coproduccion_internacional: projectData.es_coproduccion_internacional ?? false,
    formato_filmacion: projectData.formato_filmacion ?? '',
    relacion_aspecto: projectData.relacion_aspecto ?? '',
    idiomas: projectData.idiomas ?? ['Espanol'],
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
    aportacion_erpi_efectivo_centavos: projectData.aportacion_erpi_efectivo_centavos ?? 0,
    aportacion_erpi_especie_centavos: projectData.aportacion_erpi_especie_centavos ?? 0,
    terceros: projectData.terceros ?? [],
    monto_eficine_centavos: projectData.monto_eficine_centavos ?? 0,
    tiene_gestor: projectData.tiene_gestor ?? false,
    gestor_monto_centavos: projectData.gestor_monto_centavos ?? 0,
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
