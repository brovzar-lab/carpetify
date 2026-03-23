/**
 * Zod schemas for structured AI outputs.
 * Used with generateStructured() to guarantee valid JSON from Claude.
 */

import { z } from 'zod';

// ---- Budget schemas (A9a/A9b) ----

export const budgetLineItemSchema = z.object({
  concepto: z.string(),
  unidad: z.string(),
  cantidad: z.number(),
  costoUnitarioCentavos: z.number().int(),
  subtotalCentavos: z.number().int(),
});

export const budgetAccountSchema = z.object({
  numeroCuenta: z.number().int(),
  nombreCuenta: z.string(),
  partidas: z.array(budgetLineItemSchema),
  subtotalCentavos: z.number().int(),
});

export const budgetOutputSchema = z.object({
  cuentas: z.array(budgetAccountSchema),
  totalCentavos: z.number().int(),
  totalFormatted: z.string(),
});

// ---- Cash flow schema (A9d / FORMATO 3) ----

export const cashFlowRowSchema = z.object({
  cuenta: z.string(),
  amounts: z.array(z.number().int()),
});

export const cashFlowOutputSchema = z.object({
  months: z.array(z.string()),
  rows: z.array(cashFlowRowSchema),
  columnTotals: z.array(z.number().int()),
  grandTotal: z.number().int(),
});

// ---- Esquema financiero schema (E1 / FORMATO 9) ----

export const financialSourceSchema = z.object({
  nombre: z.string(),
  tipo: z.string(),
  monto_centavos: z.number().int(),
  porcentaje: z.number(),
});

export const esquemaFinancieroSchema = z.object({
  sources: z.array(financialSourceSchema),
  total_centavos: z.number().int(),
});

// ---- Ficha tecnica schema (C4 / FORMATO 8) ----

export const fichaTecnicaSchema = z.object({
  titulo: z.string(),
  categoria: z.string(),
  duracion_estimada: z.string(),
  formato: z.string(),
  idioma: z.string(),
  sinopsis_corta: z.string(),
  equipo_principal: z.array(
    z.object({
      cargo: z.string(),
      nombre: z.string(),
    }),
  ),
  datos_produccion: z.object({
    erpi: z.string(),
    rfc: z.string(),
    representante_legal: z.string(),
    costo_total: z.string(),
    monto_eficine: z.string(),
    periodo_registro: z.string(),
  }),
});

// Type exports
export type BudgetLineItemOutput = z.infer<typeof budgetLineItemSchema>;
export type BudgetAccountOutput = z.infer<typeof budgetAccountSchema>;
export type BudgetOutputSchema = z.infer<typeof budgetOutputSchema>;
export type CashFlowRow = z.infer<typeof cashFlowRowSchema>;
export type CashFlowOutputSchema = z.infer<typeof cashFlowOutputSchema>;
export type FinancialSource = z.infer<typeof financialSourceSchema>;
export type EsquemaFinancieroSchema = z.infer<typeof esquemaFinancieroSchema>;
export type FichaTecnicaOutput = z.infer<typeof fichaTecnicaSchema>;
