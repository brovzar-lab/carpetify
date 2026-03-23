/**
 * Esquema Financiero (FORMATO 9) computation.
 * Aggregates all funding sources with percentage calculations.
 *
 * Golden equation: financial scheme total MUST equal budget grand total.
 * All arithmetic in centavos (integer).
 *
 * Per D-13: financial data flows deterministically from structured data,
 * not from AI-generated documents.
 */

import type { BudgetOutput } from './budgetComputer.js';

// Minimal financial input type matching the fields we need
// (mirrors src/schemas/financials.ts Financials type)
export interface FinancialsInput {
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
  gestor_monto_centavos?: number;
}

export interface FinancialSource {
  nombre: string;
  tipo: string;
  monto_centavos: number;
  porcentaje: number;
}

export interface FinancialSchemeOutput {
  sources: FinancialSource[];
  total_centavos: number;
}

/**
 * Compute the esquema financiero from intake financials and budget.
 * The total MUST equal the budget grand total (golden equation).
 *
 * If input sources don't sum to budget total, the difference is
 * distributed proportionally across existing sources.
 */
export function computeFinancialScheme(
  financials: FinancialsInput,
  budget: BudgetOutput,
): FinancialSchemeOutput {
  const budgetTotal = budget.totalCentavos;
  const sources: FinancialSource[] = [];

  // ERPI cash contribution
  if (financials.aportacion_erpi_efectivo_centavos > 0) {
    sources.push({
      nombre: 'Aportacion ERPI (Efectivo)',
      tipo: 'ERPI',
      monto_centavos: financials.aportacion_erpi_efectivo_centavos,
      porcentaje: 0, // calculated below
    });
  }

  // ERPI in-kind contribution
  if (financials.aportacion_erpi_especie_centavos > 0) {
    sources.push({
      nombre: 'Aportacion ERPI (Especie)',
      tipo: 'ERPI',
      monto_centavos: financials.aportacion_erpi_especie_centavos,
      porcentaje: 0,
    });
  }

  // Third-party contributions
  for (const tercero of financials.terceros) {
    sources.push({
      nombre: tercero.nombre,
      tipo: tercero.tipo,
      monto_centavos: tercero.monto_centavos,
      porcentaje: 0,
    });
  }

  // EFICINE stimulus
  if (financials.monto_eficine_centavos > 0) {
    sources.push({
      nombre: 'Estimulo Fiscal EFICINE (Art. 189 LISR)',
      tipo: 'EFICINE',
      monto_centavos: financials.monto_eficine_centavos,
      porcentaje: 0,
    });
  }

  // Reconcile: if sources don't sum to budget total, adjust
  const sourceSum = sources.reduce((s, src) => s + src.monto_centavos, 0);
  if (sourceSum !== budgetTotal && sources.length > 0) {
    const delta = budgetTotal - sourceSum;
    // Distribute delta proportionally across non-EFICINE sources
    // (EFICINE amount is a fixed request, shouldn't be auto-adjusted)
    const adjustableSources = sources.filter((s) => s.tipo !== 'EFICINE');
    if (adjustableSources.length > 0) {
      const adjustableTotal = adjustableSources.reduce((s, src) => s + src.monto_centavos, 0);
      let distributed = 0;
      for (let i = 0; i < adjustableSources.length; i++) {
        if (i === adjustableSources.length - 1) {
          adjustableSources[i].monto_centavos += delta - distributed;
        } else {
          const share = Math.round(
            (delta * adjustableSources[i].monto_centavos) / adjustableTotal,
          );
          adjustableSources[i].monto_centavos += share;
          distributed += share;
        }
      }
    } else {
      // Only EFICINE source -- add delta as additional ERPI contribution
      sources.unshift({
        nombre: 'Aportacion ERPI (Ajuste)',
        tipo: 'ERPI',
        monto_centavos: delta,
        porcentaje: 0,
      });
    }
  }

  // Calculate percentages
  const finalTotal = sources.reduce((s, src) => s + src.monto_centavos, 0);
  for (const source of sources) {
    source.porcentaje = finalTotal > 0
      ? Math.round((source.monto_centavos / finalTotal) * 10000) / 100
      : 0;
  }

  return {
    sources,
    total_centavos: finalTotal,
  };
}
