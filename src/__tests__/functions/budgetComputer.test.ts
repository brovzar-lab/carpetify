// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { IMCINE_ACCOUNTS } from '@functions/financial/ratesTables';
import {
  computeBudget,
  type BudgetInput,
  type BudgetOutput,
} from '@functions/financial/budgetComputer';
import { buildCashFlow } from '@functions/financial/cashFlowBuilder';
import { computeFinancialScheme } from '@functions/financial/financialScheme';
import { formatMXN } from '@functions/shared/formatters';

// Standard test input: $8,000,000 MXN project with 24 shooting days
const standardInput: BudgetInput = {
  jornadas: 24,
  locaciones: 4,
  equipo: [
    { cargo: 'productor', honorarios_centavos: 50000000, aportacion_especie_centavos: 0 },
    { cargo: 'director', honorarios_centavos: 40000000, aportacion_especie_centavos: 0 },
    { cargo: 'guionista', honorarios_centavos: 30000000, aportacion_especie_centavos: 0 },
  ],
  costoTotalProyectoCentavos: 800000000, // $8,000,000 MXN
  esAnimacion: false,
  esDocumental: false,
};

describe('IMCINE Account Structure', () => {
  it('should have exactly 12 accounts', () => {
    expect(IMCINE_ACCOUNTS).toHaveLength(12);
  });

  it('should start at account 100 and end at account 1200', () => {
    expect(IMCINE_ACCOUNTS[0].numero).toBe(100);
    expect(IMCINE_ACCOUNTS[11].numero).toBe(1200);
  });

  it('should have correct Spanish names matching IMCINE standard', () => {
    const names = IMCINE_ACCOUNTS.map((a) => a.nombre);
    expect(names).toContain('Guion y Argumento');
    expect(names).toContain('Produccion');
    expect(names).toContain('Direccion');
    expect(names).toContain('Elenco');
    expect(names).toContain('Departamento de Arte');
    expect(names).toContain('Equipo Tecnico');
    expect(names).toContain('Materiales y Equipo');
    expect(names).toContain('Locaciones y Transporte');
    expect(names).toContain('Laboratorio y Postproduccion');
    expect(names).toContain('Seguros y Garantias');
    expect(names).toContain('Gastos Generales');
    expect(names).toContain('Imprevistos / Contingencia');
  });
});

describe('computeBudget', () => {
  it('should return all 12 account groups', () => {
    const result = computeBudget(standardInput);
    expect(result.cuentas).toHaveLength(12);
    // Verify account numbers
    const accountNums = result.cuentas.map((c) => c.numeroCuenta);
    expect(accountNums).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]);
  });

  it('should have subtotals in centavos (integer arithmetic)', () => {
    const result = computeBudget(standardInput);
    for (const cuenta of result.cuentas) {
      // Every subtotal should be a whole number (centavos, no decimals)
      expect(Number.isInteger(cuenta.subtotalCentavos)).toBe(true);
      // Verify account subtotal equals sum of partidas
      const partidaSum = cuenta.partidas.reduce((s, p) => s + p.subtotalCentavos, 0);
      expect(cuenta.subtotalCentavos).toBe(partidaSum);
    }
  });

  it('should have grand total equal sum of all account subtotals', () => {
    const result = computeBudget(standardInput);
    const sum = result.cuentas.reduce((s, c) => s + c.subtotalCentavos, 0);
    expect(result.totalCentavos).toBe(sum);
  });

  it('should inject producer/director/screenwriter fees from intake (D-15)', () => {
    const result = computeBudget(standardInput);

    // Account 100 (Guion y Argumento) should contain screenwriter fee of $300,000
    const cuenta100 = result.cuentas.find((c) => c.numeroCuenta === 100)!;
    const guionista = cuenta100.partidas.find((p) => p.concepto === 'Guionista');
    expect(guionista).toBeDefined();
    expect(guionista!.subtotalCentavos).toBe(30000000);

    // Account 200 (Produccion) should contain producer fee of $500,000
    const cuenta200 = result.cuentas.find((c) => c.numeroCuenta === 200)!;
    const productor = cuenta200.partidas.find((p) => p.concepto === 'Productor');
    expect(productor).toBeDefined();
    expect(productor!.subtotalCentavos).toBe(50000000);

    // Account 300 (Direccion) should contain director fee of $400,000
    const cuenta300 = result.cuentas.find((c) => c.numeroCuenta === 300)!;
    const director = cuenta300.partidas.find((p) => p.concepto === 'Director');
    expect(director).toBeDefined();
    expect(director!.subtotalCentavos).toBe(40000000);
  });
});

describe('buildCashFlow', () => {
  it('should produce a matrix with months as columns and accounts as rows', () => {
    const budget = computeBudget(standardInput);
    const startMonth = new Date(2026, 0, 1); // January 2026
    const result = buildCashFlow(budget, startMonth, 12);

    expect(result.months.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    // Each row should have amounts matching month count
    for (const row of result.rows) {
      expect(row.amounts).toHaveLength(result.months.length);
    }
  });

  it('should have total equal to budget grand total (golden equation part 1)', () => {
    const budget = computeBudget(standardInput);
    const startMonth = new Date(2026, 0, 1);
    const result = buildCashFlow(budget, startMonth, 12);

    expect(result.grandTotal).toBe(budget.totalCentavos);
  });
});

describe('computeFinancialScheme', () => {
  it('should have total equal to budget grand total (golden equation part 2)', () => {
    const budget = computeBudget(standardInput);
    const financials = {
      aportacion_erpi_efectivo_centavos: 200000000,
      aportacion_erpi_especie_centavos: 50000000,
      terceros: [] as Array<{ nombre: string; tipo: string; monto_centavos: number; efectivo_o_especie: string }>,
      monto_eficine_centavos: 400000000,
      tiene_gestor: false,
      gestor_monto_centavos: 0,
    };

    const result = computeFinancialScheme(financials, budget);
    expect(result.total_centavos).toBe(budget.totalCentavos);
  });
});

describe('formatMXN output', () => {
  it('should match $X,XXX,XXX MXN pattern', () => {
    const pattern = /^\$[\d,]+ MXN$/;
    expect(formatMXN(800000000)).toMatch(pattern); // $8,000,000 MXN
    expect(formatMXN(50000000)).toMatch(pattern);  // $500,000 MXN
    expect(formatMXN(100)).toMatch(pattern);        // $1 MXN
    expect(formatMXN(0)).toMatch(pattern);           // $0 MXN
  });
});
