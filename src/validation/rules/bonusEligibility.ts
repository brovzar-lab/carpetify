/**
 * VALD-13: Bonus Points Eligibility
 * Warning: Checks all 4 bonus categories (a-d) per scoring_rubric.md.
 * Non-cumulative -- only one can apply per project.
 * Recommends the strongest (first eligible in a,b,c,d order per rubric).
 */
import type { ValidationResult } from '../types'

export interface BonusCheckInput {
  directorEsMujer: boolean
  directorEsIndigenaAfromexicano: boolean
  directorEsCodireccionConHombre: boolean
  directorEsCodireccionConNoMiembro: boolean
  cartaAutoadscripcionUploaded: boolean
  directorOrigenFueraZMCM: boolean
  productorOrigenFueraZMCM: boolean
  porcentajeRodajeFueraZMCM: number
  porcentajePersonalCreativoLocal: number
  porcentajePersonalTecnicoLocal: number
  erpiDomicilioFueraZMCM: boolean
  allCreativeTeamQualify: boolean
  noCodireccionConNoQualifying: boolean
}

interface BonusCategory {
  key: string
  label: string
}

export function validateBonusEligibility(
  input: BonusCheckInput,
): ValidationResult {
  const base = {
    ruleId: 'VALD-13',
    ruleName: 'Puntos adicionales (bonus)',
    severity: 'warning' as const,
    navigateTo: { screen: 'equipo' as const },
  }

  const eligible: BonusCategory[] = []
  const ineligibleDetails: string[] = []

  // (a) Female director
  if (input.directorEsMujer && !input.directorEsCodireccionConHombre) {
    eligible.push({
      key: 'a',
      label: '(a) Directora mujer (+5 puntos)',
    })
  }

  // (b) Indigenous/Afro-Mexican director
  if (
    input.directorEsIndigenaAfromexicano &&
    !input.directorEsCodireccionConNoMiembro
  ) {
    if (input.cartaAutoadscripcionUploaded) {
      eligible.push({
        key: 'b',
        label: '(b) Director indigena/afromexicano (+5 puntos)',
      })
    } else {
      ineligibleDetails.push(
        '(b) Director indigena/afromexicano: falta carta de autoadscripcion',
      )
    }
  }

  // (c) Regional decentralization
  if (
    (input.directorOrigenFueraZMCM || input.productorOrigenFueraZMCM) &&
    input.porcentajeRodajeFueraZMCM >= 75 &&
    input.porcentajePersonalCreativoLocal >= 50 &&
    input.porcentajePersonalTecnicoLocal >= 50 &&
    input.erpiDomicilioFueraZMCM
  ) {
    eligible.push({
      key: 'c',
      label: '(c) Descentralizacion regional (+5 puntos)',
    })
  }

  // (d) 100% qualifying creative team
  if (input.allCreativeTeamQualify && input.noCodireccionConNoQualifying) {
    eligible.push({
      key: 'd',
      label:
        '(d) Equipo creativo 100% mujeres o indigenas/afromexicanos (+5 puntos)',
    })
  }

  const eligibleLabels = eligible.map((e) => e.label)
  const allDetails = [...eligibleLabels, ...ineligibleDetails]

  if (eligible.length > 0) {
    // Recommend first eligible (priority order: a, b, c, d)
    const recommended = eligible[0]

    return {
      ...base,
      status: 'pass',
      message: `Categoria de puntos bonus detectada: ${recommended.label}.`,
      details: allDetails.length > 0 ? allDetails : undefined,
      metadata: {
        recommended: recommended.key,
        recommendedLabel: recommended.label,
        eligibleCategories: eligible.map((e) => e.key),
      },
    }
  }

  return {
    ...base,
    status: 'fail',
    message:
      'No se detecta categoria de puntos bonus elegible. Revisa los requisitos.',
    details: ineligibleDetails.length > 0 ? ineligibleDetails : undefined,
  }
}
