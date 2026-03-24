/**
 * VALD-07: Experience Thresholds
 * Genre-dependent experience requirements for producer and director.
 * Fiction/Documentary vs Animation have different thresholds.
 * Producer must also be ERPI partner (es_socio_erpi === true).
 */
import type { ValidationResult } from '../types'

interface TeamMemberLike {
  nombre_completo: string
  cargo: string
  filmografia: Array<{
    formato?: string
    exhibicion?: string
  }>
  es_socio_erpi?: boolean
}

function countExhibitedByFormat(
  filmografia: Array<{ formato?: string; exhibicion?: string }>,
  formato: string,
): number {
  return filmografia.filter(
    (f) =>
      f.formato === formato &&
      f.exhibicion === 'exhibido',
  ).length
}

function countExhibitedShortsAndAudiovisual(
  filmografia: Array<{ formato?: string; exhibicion?: string }>,
): number {
  return filmografia.filter(
    (f) =>
      (f.formato === 'Cortometraje' || f.formato === 'Obra audiovisual') &&
      f.exhibicion === 'exhibido',
  ).length
}

export function validateExperienceThresholds(
  team: TeamMemberLike[],
  genre: string,
): ValidationResult {
  const base = {
    ruleId: 'VALD-07',
    ruleName: 'Experiencia minima',
    severity: 'blocker' as const,
    navigateTo: { screen: 'equipo' as const },
  }

  const producer = team.find((m) => m.cargo === 'Productor')
  const director = team.find((m) => m.cargo === 'Director')

  if (!producer && !director) {
    return {
      ...base,
      status: 'skip',
      message:
        'Agrega la filmografia del productor y director para evaluar.',
    }
  }

  const issues: string[] = []
  const isAnimation = genre === 'Animacion'

  // Check producer experience
  if (producer) {
    const features = countExhibitedByFormat(
      producer.filmografia,
      'Largometraje',
    )

    if (isAnimation) {
      const shorts = countExhibitedByFormat(
        producer.filmografia,
        'Cortometraje',
      )
      if (features < 1 && shorts < 3) {
        issues.push(
          `Productor requiere minimo 1 largometraje exhibido o 3 cortometrajes exhibidos (animacion). Tiene: ${features} largometraje(s), ${shorts} cortometraje(s).`,
        )
      }
    } else {
      if (features < 1) {
        issues.push(
          `Productor requiere minimo 1 largometraje exhibido. Tiene: ${features}.`,
        )
      }
    }

    // Producer must be ERPI partner
    if (!producer.es_socio_erpi) {
      issues.push(
        'Productor debe ser socio de la ERPI (es_socio_erpi).',
      )
    }
  }

  // Check director experience
  if (director) {
    const features = countExhibitedByFormat(
      director.filmografia,
      'Largometraje',
    )
    const shortsAndAudiovisual = countExhibitedShortsAndAudiovisual(
      director.filmografia,
    )

    if (isAnimation) {
      if (features < 1 && shortsAndAudiovisual < 1) {
        issues.push(
          `Director requiere minimo 1 largometraje o 1 cortometraje/obra audiovisual exhibido (animacion). Tiene: ${features} largometraje(s), ${shortsAndAudiovisual} cortometraje(s)/obra(s).`,
        )
      }
    } else {
      if (features < 1 && shortsAndAudiovisual < 2) {
        issues.push(
          `Director requiere minimo 1 largometraje o 2 cortometrajes/obras audiovisuales exhibidos. Tiene: ${features} largometraje(s), ${shortsAndAudiovisual} cortometraje(s)/obra(s).`,
        )
      }
    }
  }

  if (issues.length > 0) {
    return {
      ...base,
      status: 'fail',
      message: issues.join(' '),
      details: issues,
    }
  }

  return {
    ...base,
    status: 'pass',
    message:
      'Productor y director cumplen los requisitos minimos de experiencia.',
  }
}
