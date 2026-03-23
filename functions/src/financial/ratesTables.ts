/**
 * IMCINE standard account structure and Mexican market crew rates.
 * All rates are in centavos (integer arithmetic).
 *
 * Account structure follows the IMCINE presupuesto desglosado standard:
 * 100-400: Above the Line (ATL)
 * 500-900: Below the Line (BTL)
 * 1000-1200: General
 */

// ---- IMCINE Account Structure ----

export interface IMCINEAccount {
  numero: number;
  nombre: string;
  categoria: 'ATL' | 'BTL' | 'GENERAL';
}

/**
 * 12 IMCINE standard accounts per presupuesto desglosado.
 * Numbers 100-1200 as defined by IMCINE.
 */
export const IMCINE_ACCOUNTS: IMCINEAccount[] = [
  { numero: 100, nombre: 'Guion y Argumento', categoria: 'ATL' },
  { numero: 200, nombre: 'Produccion', categoria: 'ATL' },
  { numero: 300, nombre: 'Direccion', categoria: 'ATL' },
  { numero: 400, nombre: 'Elenco', categoria: 'ATL' },
  { numero: 500, nombre: 'Departamento de Arte', categoria: 'BTL' },
  { numero: 600, nombre: 'Equipo Tecnico', categoria: 'BTL' },
  { numero: 700, nombre: 'Materiales y Equipo', categoria: 'BTL' },
  { numero: 800, nombre: 'Locaciones y Transporte', categoria: 'BTL' },
  { numero: 900, nombre: 'Laboratorio y Postproduccion', categoria: 'BTL' },
  { numero: 1000, nombre: 'Seguros y Garantias', categoria: 'GENERAL' },
  { numero: 1100, nombre: 'Gastos Generales', categoria: 'GENERAL' },
  { numero: 1200, nombre: 'Imprevistos / Contingencia', categoria: 'GENERAL' },
];

// ---- Crew Rates (Mexico 2025-2026, in centavos per week) ----

export interface CrewRate {
  min: number;
  standard: number;
  max: number;
  unit: 'semana' | 'jornada' | 'global';
}

/**
 * Crew rate ranges from the Mexican film industry.
 * Extracted from prompts/a9_presupuesto.md.
 * All amounts in centavos.
 */
export const CREW_RATES: Record<string, CrewRate> = {
  // ATL
  line_producer: { min: 3500000, standard: 5000000, max: 8000000, unit: 'semana' },
  primer_asistente_direccion: { min: 2500000, standard: 3500000, max: 4500000, unit: 'semana' },
  // BTL - Key department heads
  director_de_fotografia: { min: 4000000, standard: 6000000, max: 9000000, unit: 'semana' },
  director_de_arte: { min: 3000000, standard: 4000000, max: 6000000, unit: 'semana' },
  editor: { min: 2500000, standard: 3500000, max: 5000000, unit: 'semana' },
  mezclador_sonido: { min: 2000000, standard: 2500000, max: 3500000, unit: 'semana' },
  gaffer: { min: 1800000, standard: 2400000, max: 3000000, unit: 'semana' },
  key_grip: { min: 1800000, standard: 2200000, max: 2800000, unit: 'semana' },
  vestuario: { min: 1500000, standard: 2000000, max: 2500000, unit: 'semana' },
  maquillaje: { min: 1500000, standard: 2000000, max: 2500000, unit: 'semana' },
  sonidista: { min: 2000000, standard: 2500000, max: 3500000, unit: 'semana' },
  microfonista: { min: 1200000, standard: 1500000, max: 2000000, unit: 'semana' },
  // Per-day rates
  catering: { min: 35000, standard: 45000, max: 60000, unit: 'jornada' }, // per person per day
};

// ---- Social costs (fringes) ----

/** STPC union fringe percentage */
export const FRINGE_STPC = 0.38;

/** Non-union fringe percentage */
export const FRINGE_NON_UNION = 0.27;

// ---- Standard percentages ----

/** Insurance: 2-3% of total budget */
export const INSURANCE_PERCENT = 0.025;

/** Contingency: 10% of BTL standard in Mexico */
export const CONTINGENCY_PERCENT_BTL = 0.10;
