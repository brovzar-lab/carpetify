/**
 * Shared test fixtures for handler integration tests.
 * Wave 0 test infrastructure -- used by Plans 02 and 03.
 *
 * Provides realistic Mexican film project data for testing
 * the generation pipeline without actual API calls.
 */

import type { BudgetOutput } from '@functions/financial/budgetComputer';

/**
 * Sample project data fixture with realistic Mexican film project data.
 * Used by all handler integration tests (Plans 02, 03).
 */
export const sampleProjectData = {
  metadata: {
    titulo_proyecto: 'La Ultima Frontera',
    categoria_cinematografica: 'ficcion',
    categoria_director: 'opera_prima',
    duracion_estimada_minutos: 95,
    costo_total_proyecto_centavos: 800000000, // $8,000,000 MXN
    monto_solicitado_eficine_centavos: 400000000, // $4,000,000 MXN
    periodo_registro: '2026-P2',
    es_coproduccion_internacional: false,
    formato_filmacion: 'Digital 4K',
    relacion_aspecto: '2.39:1',
    idiomas: ['Espanol'],
  },
  screenplayAnalysis: {
    datos_generales: {
      sinopsis:
        'Una familia enfrenta la decision de cruzar la frontera norte mientras lidia con los fantasmas de su pasado en un pueblo minero de Sonora.',
      num_escenas: 85,
    },
    desglose_escenas: [],
    locaciones_unicas: [
      { nombre: 'Casa principal en pueblo minero', tipo: 'INT-EXT', frecuencia: 28 },
      { nombre: 'Mina abandonada', tipo: 'EXT', frecuencia: 12 },
      { nombre: 'Oficina del coyote', tipo: 'INT', frecuencia: 8 },
      { nombre: 'Desierto fronterizo', tipo: 'EXT', frecuencia: 15 },
    ],
    personajes_detalle: [
      { nombre: 'ELENA', es_protagonista: true, num_escenas: 72 },
      { nombre: 'MARCOS', es_protagonista: true, num_escenas: 58 },
      { nombre: 'DON RAFAEL', es_protagonista: false, num_escenas: 25 },
    ],
    complejidad_global: {
      nivel: 'media-alta',
      escenas_nocturnas: 22,
      escenas_diurnas: 63,
      escenas_exteriores: 38,
      escenas_interiores: 47,
      cambios_locacion: 18,
      escenas_stunts: 2,
      escenas_vfx: 3,
      escenas_extras_numerosos: 4,
      escenas_menores: 0,
      escenas_agua: 0,
      resumen_retos:
        'Rodaje en exteriores deserticos con temperaturas extremas. Secuencias nocturnas en la mina requieren iluminacion especial.',
    },
    estimacion_jornadas: {
      baja: 20,
      media: 24,
      alta: 30,
      justificacion:
        '85 escenas en 4 locaciones principales. Complejidad media-alta por exteriores deserticos y secuencias nocturnas.',
    },
  },
  screenplayData: {
    num_escenas: 85,
    num_paginas: 102,
  },
  team: [
    {
      nombre_completo: 'Ana Lopez Hernandez',
      cargo: 'productor',
      honorarios_centavos: 50000000,
      aportacion_especie_centavos: 0,
      nacionalidad: 'mexicana',
    },
    {
      nombre_completo: 'Carlos Ruiz Montoya',
      cargo: 'director',
      honorarios_centavos: 40000000,
      aportacion_especie_centavos: 0,
      nacionalidad: 'mexicana',
    },
    {
      nombre_completo: 'Maria Garcia Fuentes',
      cargo: 'guionista',
      honorarios_centavos: 30000000,
      aportacion_especie_centavos: 0,
      nacionalidad: 'mexicana',
    },
    {
      nombre_completo: 'Roberto Diaz Luna',
      cargo: 'director_de_fotografia',
      honorarios_centavos: 35000000,
      aportacion_especie_centavos: 0,
      nacionalidad: 'mexicana',
    },
    {
      nombre_completo: 'Laura Mendez Soto',
      cargo: 'editor',
      honorarios_centavos: 25000000,
      aportacion_especie_centavos: 0,
      nacionalidad: 'mexicana',
    },
  ],
  financials: {
    aportacion_erpi_efectivo_centavos: 200000000, // $2,000,000 MXN
    aportacion_erpi_especie_centavos: 50000000, // $500,000 MXN
    terceros: [] as Array<{
      nombre: string;
      tipo: string;
      monto_centavos: number;
      efectivo_o_especie: string;
    }>,
    monto_eficine_centavos: 400000000, // $4,000,000 MXN
    tiene_gestor: false,
    gestor_monto_centavos: 0,
  },
  erpiSettings: {
    razon_social: 'Lemon Studios S.A. de C.V.',
    rfc: 'LST200101ABC',
    representante_legal: 'Juan Perez Martinez',
    domicilio_fiscal: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, C.P. 03100',
    objeto_social: 'Produccion y distribucion de obras cinematograficas',
    telefono: '55 1234 5678',
    correo: 'produccion@lemonstudios.mx',
  },
};

/**
 * Sample BudgetOutput fixture for downstream pass tests.
 * Represents a realistic $8,000,000 MXN budget.
 */
export const sampleBudgetOutput: BudgetOutput = {
  cuentas: [
    {
      numeroCuenta: 100,
      nombreCuenta: 'Guion y Argumento',
      partidas: [
        {
          concepto: 'Guionista',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: 30000000,
          subtotalCentavos: 30000000,
        },
        {
          concepto: 'Musica original',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: 24000000,
          subtotalCentavos: 24000000,
        },
      ],
      subtotalCentavos: 54000000,
    },
    {
      numeroCuenta: 200,
      nombreCuenta: 'Produccion',
      partidas: [
        {
          concepto: 'Productor',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: 50000000,
          subtotalCentavos: 50000000,
        },
        {
          concepto: 'Line Producer',
          unidad: 'Semana',
          cantidad: 5,
          costoUnitarioCentavos: 5000000,
          subtotalCentavos: 25000000,
        },
      ],
      subtotalCentavos: 75000000,
    },
    {
      numeroCuenta: 300,
      nombreCuenta: 'Direccion',
      partidas: [
        {
          concepto: 'Director',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: 40000000,
          subtotalCentavos: 40000000,
        },
      ],
      subtotalCentavos: 40000000,
    },
    {
      numeroCuenta: 400,
      nombreCuenta: 'Elenco',
      partidas: [
        {
          concepto: 'Elenco principal',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: 64000000,
          subtotalCentavos: 64000000,
        },
      ],
      subtotalCentavos: 64000000,
    },
    {
      numeroCuenta: 500,
      nombreCuenta: 'Departamento de Arte',
      partidas: [
        {
          concepto: 'Director de Fotografia',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: 35000000,
          subtotalCentavos: 35000000,
        },
      ],
      subtotalCentavos: 35000000,
    },
    {
      numeroCuenta: 600,
      nombreCuenta: 'Equipo Tecnico',
      partidas: [],
      subtotalCentavos: 86000000,
    },
    {
      numeroCuenta: 700,
      nombreCuenta: 'Materiales y Equipo',
      partidas: [],
      subtotalCentavos: 95000000,
    },
    {
      numeroCuenta: 800,
      nombreCuenta: 'Locaciones y Transporte',
      partidas: [],
      subtotalCentavos: 50000000,
    },
    {
      numeroCuenta: 900,
      nombreCuenta: 'Laboratorio y Postproduccion',
      partidas: [],
      subtotalCentavos: 80000000,
    },
    {
      numeroCuenta: 1000,
      nombreCuenta: 'Seguros y Garantias',
      partidas: [],
      subtotalCentavos: 20000000,
    },
    {
      numeroCuenta: 1100,
      nombreCuenta: 'Gastos Generales',
      partidas: [],
      subtotalCentavos: 16000000,
    },
    {
      numeroCuenta: 1200,
      nombreCuenta: 'Imprevistos / Contingencia',
      partidas: [],
      subtotalCentavos: 85000000,
    },
  ],
  totalCentavos: 800000000,
  totalFormatted: '$8,000,000 MXN',
};

/**
 * No-op progress callback for handler tests.
 */
export const noopProgress = (): void => {
  // Intentionally empty -- used when tests don't need progress tracking
};
