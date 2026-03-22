/**
 * EFICINE compliance thresholds and constants.
 * All monetary values in centavos (integer arithmetic).
 */

export const EFICINE_MAX_MXN_CENTAVOS = 2500000000 // $25,000,000 MXN
export const EFICINE_MAX_PCT = 80
export const ERPI_MIN_PCT = 20
export const FEDERAL_MAX_PCT = 80
export const SCREENWRITER_MIN_PCT = 3
export const INKIND_MAX_PCT = 10
export const GESTOR_CAP_FICTION = 0.05
export const GESTOR_CAP_DOC_ANIM = 0.04

/** EFICINE threshold for gestor cap: >$10M uses 4%, <=$10M uses 5% */
export const GESTOR_THRESHOLD_CENTAVOS = 1000000000 // $10,000,000 MXN

export const PERIODOS_EFICINE = {
  '2026-P1': {
    label: 'Periodo 1 (Ene-Feb 2026)',
    open: '2026-01-30',
    close: '2026-02-13',
  },
  '2026-P2': {
    label: 'Periodo 2 (Jul 2026)',
    open: '2026-07-01',
    close: '2026-07-15',
  },
} as const

export const CATEGORIAS_CINEMATOGRAFICAS = [
  'Ficcion',
  'Documental',
  'Animacion',
] as const

export const CATEGORIAS_DIRECTOR = [
  'Opera Prima',
  'Segundo largometraje y subsecuentes',
] as const

export const CARGOS_EQUIPO = [
  'Productor',
  'Director',
  'Guionista',
  'Director de Fotografia',
  'Director de Arte',
  'Editor',
] as const

export const TIPOS_APORTANTE = [
  'Donante',
  'Coproductor',
  'Distribuidor',
  'Plataforma',
] as const
