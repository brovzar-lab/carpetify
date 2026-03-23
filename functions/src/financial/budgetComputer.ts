/**
 * Deterministic budget computation with IMCINE account structure.
 * AI NEVER calculates financial figures -- all monetary amounts are
 * computed here in pure TypeScript, then injected as {{variables}} into prompts.
 *
 * Per D-13, D-15: Producer, director, screenwriter fees come from intake
 * as locked values. Budget computation never overrides them.
 *
 * Full implementation in Task 2.
 */

import { IMCINE_ACCOUNTS } from './ratesTables.js';
import { formatMXN } from '../shared/formatters.js';

// ---- Types ----

export interface BudgetInput {
  /** Shooting days from screenplay analysis estimacion_jornadas.estandar */
  jornadas: number;
  /** Location count from screenplay analysis */
  locaciones: number;
  /** Team members with locked fees from intake (per D-15) */
  equipo: {
    cargo: string;
    honorarios_centavos: number;
    aportacion_especie_centavos: number;
  }[];
  /** Total project cost from project metadata */
  costoTotalProyectoCentavos: number;
  esAnimacion: boolean;
  esDocumental: boolean;
}

export interface BudgetLineItem {
  concepto: string;
  unidad: string;
  cantidad: number;
  costoUnitarioCentavos: number;
  subtotalCentavos: number;
}

export interface BudgetAccount {
  numeroCuenta: number;
  nombreCuenta: string;
  partidas: BudgetLineItem[];
  subtotalCentavos: number;
}

export interface BudgetOutput {
  cuentas: BudgetAccount[];
  totalCentavos: number;
  totalFormatted: string;
}

// ---- Helper to find team member fee by cargo ----

function findTeamFee(equipo: BudgetInput['equipo'], cargo: string): number {
  const member = equipo.find(
    (m) => m.cargo.toLowerCase() === cargo.toLowerCase(),
  );
  return member?.honorarios_centavos ?? 0;
}

// ---- Budget computation ----

/**
 * Compute the full IMCINE budget from intake data.
 * All arithmetic in centavos integers (no floating point).
 *
 * Key rules:
 * - Producer, director, screenwriter fees are LOCKED from intake (D-15)
 * - Other line items use rates from ratesTables.ts * jornadas/locaciones
 * - Grand total reconciles with costoTotalProyectoCentavos via Imprevistos
 */
export function computeBudget(input: BudgetInput): BudgetOutput {
  const { jornadas, locaciones, equipo, costoTotalProyectoCentavos } = input;

  const cuentas: BudgetAccount[] = IMCINE_ACCOUNTS.map((account) => {
    const partidas: BudgetLineItem[] = [];

    switch (account.numero) {
      case 100: {
        // Guion y Argumento - screenwriter fee from intake
        const guionistaFee = findTeamFee(equipo, 'guionista');
        if (guionistaFee > 0) {
          partidas.push({
            concepto: 'Guionista',
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: guionistaFee,
            subtotalCentavos: guionistaFee,
          });
        }
        // Music budget estimate (3% of total or minimum)
        const musicBudget = Math.round(costoTotalProyectoCentavos * 0.03);
        partidas.push({
          concepto: 'Musica original',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: musicBudget,
          subtotalCentavos: musicBudget,
        });
        break;
      }

      case 200: {
        // Produccion - producer fee from intake
        const productorFee = findTeamFee(equipo, 'productor');
        if (productorFee > 0) {
          partidas.push({
            concepto: 'Productor',
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: productorFee,
            subtotalCentavos: productorFee,
          });
        }
        // Line producer estimated at standard rate * weeks
        const weeks = Math.ceil(jornadas / 5);
        const lineProducerRate = 5000000; // $50,000/week in centavos
        partidas.push({
          concepto: 'Line Producer',
          unidad: 'Semana',
          cantidad: weeks,
          costoUnitarioCentavos: lineProducerRate,
          subtotalCentavos: weeks * lineProducerRate,
        });
        // Coordinacion de produccion
        const coordRate = 3000000; // $30,000/week
        partidas.push({
          concepto: 'Coordinacion de produccion',
          unidad: 'Semana',
          cantidad: weeks,
          costoUnitarioCentavos: coordRate,
          subtotalCentavos: weeks * coordRate,
        });
        break;
      }

      case 300: {
        // Direccion - director fee from intake
        const directorFee = findTeamFee(equipo, 'director');
        if (directorFee > 0) {
          partidas.push({
            concepto: 'Director',
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: directorFee,
            subtotalCentavos: directorFee,
          });
        }
        // Asistentes de direccion
        const weeks = Math.ceil(jornadas / 5);
        const adRate = 3500000; // $35,000/week
        partidas.push({
          concepto: '1er Asistente de Direccion',
          unidad: 'Semana',
          cantidad: weeks,
          costoUnitarioCentavos: adRate,
          subtotalCentavos: weeks * adRate,
        });
        break;
      }

      case 400: {
        // Elenco
        const castBudget = Math.round(costoTotalProyectoCentavos * 0.08);
        partidas.push({
          concepto: 'Elenco principal',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: castBudget,
          subtotalCentavos: castBudget,
        });
        break;
      }

      case 500: {
        // Departamento de Arte
        const dpFee = findTeamFee(equipo, 'director_de_fotografia') || findTeamFee(equipo, 'dp');
        const arteFee = findTeamFee(equipo, 'director_de_arte');
        const weeks = Math.ceil(jornadas / 5);

        if (dpFee > 0) {
          partidas.push({
            concepto: 'Director de Fotografia',
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: dpFee,
            subtotalCentavos: dpFee,
          });
        } else {
          const dpRate = 6000000; // $60,000/week
          partidas.push({
            concepto: 'Director de Fotografia',
            unidad: 'Semana',
            cantidad: weeks,
            costoUnitarioCentavos: dpRate,
            subtotalCentavos: weeks * dpRate,
          });
        }

        if (arteFee > 0) {
          partidas.push({
            concepto: 'Director de Arte',
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: arteFee,
            subtotalCentavos: arteFee,
          });
        } else {
          const arteRate = 4000000; // $40,000/week
          partidas.push({
            concepto: 'Director de Arte',
            unidad: 'Semana',
            cantidad: weeks,
            costoUnitarioCentavos: arteRate,
            subtotalCentavos: weeks * arteRate,
          });
        }
        break;
      }

      case 600: {
        // Equipo Tecnico (camera, sound, lighting, grip)
        const weeks = Math.ceil(jornadas / 5);
        const techRoles = [
          { concepto: 'Gaffer', rate: 2400000 },
          { concepto: 'Key Grip', rate: 2200000 },
          { concepto: 'Sonidista', rate: 2500000 },
          { concepto: 'Microfonista', rate: 1500000 },
        ];
        for (const role of techRoles) {
          partidas.push({
            concepto: role.concepto,
            unidad: 'Semana',
            cantidad: weeks,
            costoUnitarioCentavos: role.rate,
            subtotalCentavos: weeks * role.rate,
          });
        }
        break;
      }

      case 700: {
        // Materiales y Equipo
        const weeks = Math.ceil(jornadas / 5);
        const equipmentItems = [
          { concepto: 'Renta camara y accesorios', rate: 5000000 },
          { concepto: 'Renta iluminacion', rate: 2000000 },
          { concepto: 'Renta grip', rate: 1500000 },
          { concepto: 'Renta sonido', rate: 1000000 },
        ];
        for (const item of equipmentItems) {
          partidas.push({
            concepto: item.concepto,
            unidad: 'Semana',
            cantidad: weeks,
            costoUnitarioCentavos: item.rate,
            subtotalCentavos: weeks * item.rate,
          });
        }
        break;
      }

      case 800: {
        // Locaciones y Transporte
        const locationCost = 1000000 * locaciones; // $10,000 per location
        partidas.push({
          concepto: 'Permisos de locacion',
          unidad: 'Locacion',
          cantidad: locaciones,
          costoUnitarioCentavos: 1000000,
          subtotalCentavos: locationCost,
        });
        // Catering
        const cateringCost = 45000 * jornadas * 30; // $450/person/day * 30 crew
        partidas.push({
          concepto: 'Alimentacion (catering)',
          unidad: 'Jornada',
          cantidad: jornadas,
          costoUnitarioCentavos: 45000 * 30,
          subtotalCentavos: cateringCost,
        });
        // Transport
        const transportCost = 2000000 * Math.ceil(jornadas / 5);
        partidas.push({
          concepto: 'Transporte',
          unidad: 'Semana',
          cantidad: Math.ceil(jornadas / 5),
          costoUnitarioCentavos: 2000000,
          subtotalCentavos: transportCost,
        });
        break;
      }

      case 900: {
        // Laboratorio y Postproduccion
        const editorFee = findTeamFee(equipo, 'editor');
        if (editorFee > 0) {
          partidas.push({
            concepto: 'Editor',
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: editorFee,
            subtotalCentavos: editorFee,
          });
        }
        const postItems = [
          { concepto: 'Correccion de color', rate: 15000000 },
          { concepto: 'Mezcla de sonido', rate: 10000000 },
          { concepto: 'DCP / Entregables', rate: 5000000 },
        ];
        for (const item of postItems) {
          partidas.push({
            concepto: item.concepto,
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: item.rate,
            subtotalCentavos: item.rate,
          });
        }
        break;
      }

      case 1000: {
        // Seguros y Garantias (2-3% of total)
        const segurosCost = Math.round(costoTotalProyectoCentavos * 0.025);
        partidas.push({
          concepto: 'Seguro de produccion',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: segurosCost,
          subtotalCentavos: segurosCost,
        });
        break;
      }

      case 1100: {
        // Gastos Generales
        const gastosItems = [
          { concepto: 'Oficina de produccion', rate: 5000000 },
          { concepto: 'Legal y contabilidad', rate: 8000000 },
          { concepto: 'Viaticos', rate: 3000000 },
        ];
        for (const item of gastosItems) {
          partidas.push({
            concepto: item.concepto,
            unidad: 'Global',
            cantidad: 1,
            costoUnitarioCentavos: item.rate,
            subtotalCentavos: item.rate,
          });
        }
        break;
      }

      case 1200: {
        // Imprevistos / Contingencia -- placeholder, adjusted below
        partidas.push({
          concepto: 'Imprevistos (10% BTL)',
          unidad: 'Global',
          cantidad: 1,
          costoUnitarioCentavos: 0,
          subtotalCentavos: 0,
        });
        break;
      }
    }

    const subtotalCentavos = partidas.reduce(
      (sum, p) => sum + p.subtotalCentavos,
      0,
    );

    return {
      numeroCuenta: account.numero,
      nombreCuenta: account.nombre,
      partidas,
      subtotalCentavos,
    };
  });

  // Calculate sum of all accounts except 1200 (Imprevistos)
  const sumWithoutImprevistos = cuentas
    .filter((c) => c.numeroCuenta !== 1200)
    .reduce((sum, c) => sum + c.subtotalCentavos, 0);

  // Adjust Imprevistos to reconcile with target total
  const imprevistosCuenta = cuentas.find((c) => c.numeroCuenta === 1200);
  if (imprevistosCuenta) {
    const delta = costoTotalProyectoCentavos - sumWithoutImprevistos;
    // Use max of: 10% of BTL, or whatever delta is needed
    const btlTotal = cuentas
      .filter((c) => c.numeroCuenta >= 500 && c.numeroCuenta <= 900)
      .reduce((sum, c) => sum + c.subtotalCentavos, 0);
    const tenPercentBTL = Math.round(btlTotal * 0.1);
    const imprevistos = Math.max(delta, tenPercentBTL, 0);

    imprevistosCuenta.partidas[0].costoUnitarioCentavos = imprevistos;
    imprevistosCuenta.partidas[0].subtotalCentavos = imprevistos;
    imprevistosCuenta.subtotalCentavos = imprevistos;
  }

  const totalCentavos = cuentas.reduce((sum, c) => sum + c.subtotalCentavos, 0);

  return {
    cuentas,
    totalCentavos,
    totalFormatted: formatMXN(totalCentavos),
  };
}
