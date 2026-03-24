/**
 * Content adapters that transform raw Firestore document content
 * into the typed props each PDF template expects.
 *
 * Bridges the gap between Firestore's unstructured content
 * (stored as `unknown` in `generated/{docId}`) and the strongly-typed
 * template component props defined in Plan 02.
 */
import type { TemplateType } from './types'
import { formatMXN } from '@/lib/format'
import { EXPORT_FILE_MAP } from './fileNaming'
import { es } from '@/locales/es'

// ---- Main adapter ----

/**
 * Transforms raw Firestore document content into the props shape
 * expected by the corresponding PDF template component.
 *
 * Each template has a specific props interface (see Plan 02).
 * Firestore stores content as a nested object -- this function
 * extracts, formats, and reshapes it for rendering.
 */
export function adaptContentForTemplate(
  docId: string,
  templateType: TemplateType,
  rawContent: unknown,
  projectTitle: string,
  sectionLabel: string,
): Record<string, unknown> {
  switch (templateType) {
    case 'prose':
      return adaptProse(docId, rawContent, projectTitle, sectionLabel)
    case 'resumen-ejecutivo':
      return adaptResumenEjecutivo(rawContent, projectTitle)
    case 'solidez-equipo':
      return adaptSolidezEquipo(rawContent, projectTitle)
    case 'budget-summary':
      return adaptBudgetSummary(rawContent, projectTitle)
    case 'budget-detail':
      return adaptBudgetDetail(rawContent, projectTitle)
    case 'cash-flow':
      return adaptCashFlow(rawContent, projectTitle)
    case 'ruta-critica':
      return adaptRutaCritica(rawContent, projectTitle)
    case 'financial-scheme':
      return adaptFinancialScheme(rawContent, projectTitle)
    case 'contract':
      return adaptContract(rawContent, projectTitle, sectionLabel)
    case 'carta':
      return adaptCarta(docId, rawContent, projectTitle, sectionLabel)
    case 'carta-aportacion':
      return adaptCartaAportacion(rawContent, projectTitle)
    case 'ficha-tecnica':
      return adaptFichaTecnica(rawContent, projectTitle)
    default:
      return { projectTitle, content: String(rawContent ?? '') }
  }
}

// ---- Helpers ----

type Raw = Record<string, unknown>

function asRaw(content: unknown): Raw {
  if (content && typeof content === 'object') return content as Raw
  return {}
}

function str(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val
  return fallback
}

function num(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return val
  return fallback
}

function arr(val: unknown): unknown[] {
  if (Array.isArray(val)) return val
  return []
}

/** Extract text content from a generated document's content field */
function extractText(raw: Raw): string {
  // Generated docs may store content in various shapes:
  // { content: string } or { content: { text: string } } or { text: string }
  const content = raw.content
  if (typeof content === 'string') return content
  if (content && typeof content === 'object') {
    const inner = content as Raw
    if (typeof inner.text === 'string') return inner.text
    if (typeof inner.content === 'string') return inner.content
  }
  if (typeof raw.text === 'string') return raw.text
  return String(raw.content ?? '')
}

/** Get doc display name from locale */
function getDocName(docId: string): string {
  const names = es.generation.docNames as Record<string, string>
  return names[docId] ?? docId
}

// ---- Per-template adapters ----

function adaptProse(
  docId: string,
  rawContent: unknown,
  projectTitle: string,
  sectionLabel: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const title = str(raw.title) || getDocName(docId)
  const content = extractText(raw)

  return { title, content, projectTitle, sectionLabel }
}

function adaptResumenEjecutivo(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = asRaw(raw.content ?? raw)

  // The content may be a flat object or nested under structured
  const structured = asRaw(content.structured ?? content)

  return {
    projectTitle,
    data: {
      titulo: str(structured.titulo ?? structured.titulo_proyecto, projectTitle),
      genero: str(structured.genero, ''),
      categoria: str(structured.categoria, ''),
      duracion: str(structured.duracion, ''),
      formato: str(structured.formato, ''),
      sinopsis: str(structured.sinopsis, ''),
      director: str(structured.director, ''),
      productor: str(structured.productor, ''),
      guionista: str(structured.guionista, ''),
      presupuestoTotal: typeof structured.presupuesto_total_centavos === 'number'
        ? formatMXN(num(structured.presupuesto_total_centavos))
        : str(structured.presupuestoTotal, ''),
      montoEFICINE: typeof structured.monto_eficine_centavos === 'number'
        ? formatMXN(num(structured.monto_eficine_centavos))
        : str(structured.montoEFICINE, ''),
      porcentajeEFICINE: str(structured.porcentajeEFICINE ?? structured.porcentaje_eficine, ''),
      aportacionERPI: typeof structured.aportacion_erpi_centavos === 'number'
        ? formatMXN(num(structured.aportacion_erpi_centavos))
        : str(structured.aportacionERPI, ''),
      porcentajeERPI: str(structured.porcentajeERPI ?? structured.porcentaje_erpi, ''),
    },
  }
}

function adaptSolidezEquipo(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = asRaw(raw.content ?? raw)
  const structured = asRaw(content.structured ?? content)
  const teamArr = arr(structured.team ?? structured.equipo ?? content.team ?? [])

  const team = teamArr.map((member) => {
    const m = asRaw(member)
    return {
      cargo: str(m.cargo, ''),
      nombre: str(m.nombre, ''),
      nacionalidad: str(m.nacionalidad, ''),
      filmografia: arr(m.filmografia).map((f) => str(f)),
      honorarios: typeof m.honorarios_centavos === 'number'
        ? formatMXN(num(m.honorarios_centavos))
        : str(m.honorarios, ''),
    }
  })

  return { projectTitle, team }
}

function adaptBudgetSummary(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = asRaw(raw.content ?? raw)
  const structured = asRaw(content.structured ?? content)
  const cuentasArr = arr(structured.cuentas ?? content.cuentas ?? [])

  const cuentas = cuentasArr.map((c) => {
    const cuenta = asRaw(c)
    return {
      numeroCuenta: num(cuenta.numeroCuenta ?? cuenta.numero_cuenta),
      nombreCuenta: str(cuenta.nombreCuenta ?? cuenta.nombre_cuenta, ''),
      subtotalFormatted: typeof cuenta.subtotal_centavos === 'number'
        ? formatMXN(num(cuenta.subtotal_centavos))
        : str(cuenta.subtotalFormatted ?? cuenta.subtotal, ''),
    }
  })

  const totalFormatted = typeof structured.total_centavos === 'number'
    ? formatMXN(num(structured.total_centavos))
    : str(structured.totalFormatted ?? structured.total, '')

  return { projectTitle, cuentas, totalFormatted }
}

function adaptBudgetDetail(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = asRaw(raw.content ?? raw)
  const structured = asRaw(content.structured ?? content)
  const cuentasArr = arr(structured.cuentas ?? content.cuentas ?? [])

  const cuentas = cuentasArr.map((c) => {
    const cuenta = asRaw(c)
    const partidasArr = arr(cuenta.partidas ?? [])

    const partidas = partidasArr.map((p) => {
      const partida = asRaw(p)
      return {
        concepto: str(partida.concepto, ''),
        cantidad: num(partida.cantidad, 1),
        unidad: str(partida.unidad, ''),
        costoUnitario: typeof partida.costo_unitario_centavos === 'number'
          ? formatMXN(num(partida.costo_unitario_centavos))
          : str(partida.costoUnitario ?? partida.costo_unitario, ''),
        subtotal: typeof partida.subtotal_centavos === 'number'
          ? formatMXN(num(partida.subtotal_centavos))
          : str(partida.subtotal, ''),
      }
    })

    return {
      numeroCuenta: num(cuenta.numeroCuenta ?? cuenta.numero_cuenta),
      nombreCuenta: str(cuenta.nombreCuenta ?? cuenta.nombre_cuenta, ''),
      partidas,
      subtotalFormatted: typeof cuenta.subtotal_centavos === 'number'
        ? formatMXN(num(cuenta.subtotal_centavos))
        : str(cuenta.subtotalFormatted ?? cuenta.subtotal, ''),
    }
  })

  const totalFormatted = typeof structured.total_centavos === 'number'
    ? formatMXN(num(structured.total_centavos))
    : str(structured.totalFormatted ?? structured.total, '')

  return { projectTitle, cuentas, totalFormatted }
}

function adaptCashFlow(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = asRaw(raw.content ?? raw)
  const structured = asRaw(content.structured ?? content)

  const months = arr(structured.months ?? structured.meses ?? []).map((m) => str(m))
  const sourcesArr = arr(structured.sources ?? structured.fuentes ?? [])

  const sources = sourcesArr.map((s) => {
    const source = asRaw(s)
    return {
      source: str(source.source ?? source.fuente, ''),
      monthly: arr(source.monthly ?? source.mensual ?? []).map((v) =>
        typeof v === 'number' ? formatMXN(v) : str(v),
      ),
      total: typeof source.total_centavos === 'number'
        ? formatMXN(num(source.total_centavos))
        : str(source.total, ''),
    }
  })

  const monthlyTotals = arr(structured.monthlyTotals ?? structured.totales_mensuales ?? []).map(
    (v) => (typeof v === 'number' ? formatMXN(v) : str(v)),
  )

  const grandTotal = typeof structured.grandTotal === 'number'
    ? formatMXN(num(structured.grandTotal))
    : str(structured.grandTotal ?? structured.total, '')

  return { projectTitle, months, sources, monthlyTotals, grandTotal }
}

function adaptRutaCritica(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = extractText(raw)
  const innerContent = asRaw(raw.content ?? raw)
  const structured = asRaw(innerContent.structured ?? innerContent)
  const phasesArr = arr(structured.phases ?? structured.fases ?? [])

  const phases = phasesArr.map((p) => {
    const phase = asRaw(p)
    return {
      name: str(phase.name ?? phase.nombre, ''),
      months: arr(phase.months ?? phase.meses ?? []).map((m) => str(m)),
    }
  })

  return { projectTitle, content, phases }
}

function adaptFinancialScheme(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = asRaw(raw.content ?? raw)
  const structured = asRaw(content.structured ?? content)
  const sourcesArr = arr(structured.sources ?? structured.fuentes ?? [])

  const sources = sourcesArr.map((s) => {
    const source = asRaw(s)
    return {
      fuente: str(source.fuente ?? source.source, ''),
      monto: typeof source.monto_centavos === 'number'
        ? formatMXN(num(source.monto_centavos))
        : str(source.monto, ''),
      porcentaje: str(source.porcentaje, ''),
      tipo: str(source.tipo, ''),
    }
  })

  const total = typeof structured.total_centavos === 'number'
    ? formatMXN(num(structured.total_centavos))
    : str(structured.total, '')

  return { projectTitle, sources, total }
}

function adaptContract(
  rawContent: unknown,
  projectTitle: string,
  sectionLabel: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = extractText(raw)
  const innerContent = asRaw(raw.content ?? raw)
  const structured = asRaw(innerContent.structured ?? innerContent)

  const title = str(raw.title ?? structured.title, '')
  const feeAmount = typeof structured.fee_centavos === 'number'
    ? formatMXN(num(structured.fee_centavos))
    : str(structured.feeAmount ?? structured.fee ?? structured.honorarios, '')

  return { projectTitle, title, content, feeAmount, sectionLabel }
}

function adaptCarta(
  docId: string,
  rawContent: unknown,
  projectTitle: string,
  sectionLabel: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = extractText(raw)
  const title = str(raw.title) || getDocName(docId)

  return { projectTitle, title, content, sectionLabel }
}

function adaptCartaAportacion(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = extractText(raw)
  const innerContent = asRaw(raw.content ?? raw)
  const structured = asRaw(innerContent.structured ?? innerContent)
  const tableArr = arr(structured.contributionTable ?? structured.tabla_aportaciones ?? [])

  const contributionTable = tableArr.map((row) => {
    const r = asRaw(row)
    return {
      concepto: str(r.concepto, ''),
      monto: typeof r.monto_centavos === 'number'
        ? formatMXN(num(r.monto_centavos))
        : str(r.monto, ''),
    }
  })

  return { projectTitle, content, contributionTable }
}

function adaptFichaTecnica(
  rawContent: unknown,
  projectTitle: string,
): Record<string, unknown> {
  const raw = asRaw(rawContent)
  const content = asRaw(raw.content ?? raw)
  const structured = asRaw(content.structured ?? content)
  const fieldsArr = arr(structured.fields ?? structured.campos ?? [])

  const fields = fieldsArr.map((f) => {
    const field = asRaw(f)
    return {
      label: str(field.label ?? field.etiqueta, ''),
      value: str(field.value ?? field.valor, ''),
    }
  })

  return { projectTitle, fields }
}

/**
 * Get the section label for a given docId from the EXPORT_FILE_MAP.
 */
export function getSectionLabel(docId: string): string {
  const entry = EXPORT_FILE_MAP[docId]
  if (!entry) return ''
  return entry.section
}
