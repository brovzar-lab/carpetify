import * as pdfjs from 'pdfjs-dist'
import type { Screenplay, Escena } from '@/schemas/screenplay'

// Use the same worker as ScreenplayViewer.tsx
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// Regex patterns for standard screenplay format (FDX / Fade In / Final Draft / Highland)
const SCENE_HEADING_RX =
  /^(INT(?:ERIOR)?\.?(?:\/EXT\.?)?|EXT(?:ERIOR)?\.?|INT\.?-EXT\.?|EXT\.?\/INT\.?)\s*[.\-–—]?\s*(.+?)\s*[.\-–—]?\s*(DIA|NOCHE|AMANECER|ATARDECER|DAY|NIGHT|DAWN|DUSK|CONTINUO|CONTINUOUS|MÁS\s+TARDE|LATER)?$/i
const CHAR_CUE_RX = /^([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s\d.,'()-]{1,50})$/
// Lines that look like character cues but are actually scene headings or transitions
const NOT_A_CHARACTER_RX = /^(CORTE|FADE|DISUELVE|SUPER|TITLE|FIN|THE END|CUT|SMASH|IRIS)/i

/**
 * Extracts all text lines AND page count from a PDF File using pdfjs-dist.
 * Uses file.arrayBuffer() — no network request.
 */
async function extractLinesAndPages(file: File): Promise<{ lines: string[]; numPages: number }> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const numPages = pdf.numPages
  const lines: string[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    // Group text items by their y-position to reconstruct lines
    const byY = new Map<number, string[]>()
    for (const item of content.items) {
      if (!('str' in item)) continue
      const y = Math.round((item as { transform: number[] }).transform[5])
      if (!byY.has(y)) byY.set(y, [])
      byY.get(y)!.push((item as { str: string }).str)
    }

    // Sort by descending y (top of page first)
    const sortedYs = [...byY.keys()].sort((a, b) => b - a)
    for (const y of sortedYs) {
      const line = byY.get(y)!.join(' ').trim()
      if (line) lines.push(line)
    }
  }

  return { lines, numPages }
}

type IntExt = 'INT' | 'EXT' | 'INT-EXT'
type DiaNoche = 'DIA' | 'NOCHE' | 'AMANECER' | 'ATARDECER'

function normalizeIntExt(raw: string): IntExt {
  const u = raw.toUpperCase().replace(/\s+/g, '')
  if (u.includes('INT') && u.includes('EXT')) return 'INT-EXT'
  if (u.startsWith('EXT')) return 'EXT'
  return 'INT'
}

function normalizeDiaNoche(raw: string | undefined): DiaNoche {
  if (!raw) return 'DIA'
  const u = raw.toUpperCase()
  if (u.includes('NOCHE') || u.includes('NIGHT')) return 'NOCHE'
  if (u.includes('AMANECER') || u.includes('DAWN')) return 'AMANECER'
  if (u.includes('ATARDECER') || u.includes('DUSK')) return 'ATARDECER'
  return 'DIA'
}

/**
 * Parses a screenplay PDF File into structured Screenplay data.
 * Returns null if no scenes are found (caller should treat as parse failure).
 * Reads the file locally via arrayBuffer — no network request.
 */
export async function parseScreenplay(
  file: File,
): Promise<Partial<Screenplay> | null> {
  const { lines, numPages } = await extractLinesAndPages(file)

  const scenes: Escena[] = []
  const characterSceneMap = new Map<string, Set<number>>() // char → scene indices
  let currentSceneIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // --- Scene heading ---
    const sceneMatch = SCENE_HEADING_RX.exec(line)
    if (sceneMatch) {
      currentSceneIdx = scenes.length
      const int_ext = normalizeIntExt(sceneMatch[1])
      const locacion = (sceneMatch[2] ?? '').trim().replace(/\s{2,}/g, ' ')
      const dia_noche = normalizeDiaNoche(sceneMatch[3])

      scenes.push({
        numero: scenes.length + 1,
        int_ext,
        dia_noche,
        locacion,
        personajes: [],
      })
      continue
    }

    // --- Character cue (ALL-CAPS line, typically centered) ---
    if (
      currentSceneIdx >= 0 &&
      CHAR_CUE_RX.test(line) &&
      !NOT_A_CHARACTER_RX.test(line) &&
      line === line.toUpperCase()
    ) {
      // Strip parentheticals like "(V.O.)" "(O.S.)"
      const charName = line.replace(/\s*\(.*?\)\s*/g, '').trim()
      if (charName.length >= 2) {
        if (!characterSceneMap.has(charName)) {
          characterSceneMap.set(charName, new Set())
        }
        characterSceneMap.get(charName)!.add(currentSceneIdx)

        // Add to current scene's character list if not already there
        const currentScene = scenes[currentSceneIdx]
        if (!currentScene.personajes.includes(charName)) {
          currentScene.personajes.push(charName)
        }
      }
    }
  }

  if (scenes.length === 0) return null

  // Aggregate locations
  const locationFreqMap = new Map<string, { tipo: string; count: number }>()
  for (const scene of scenes) {
    const key = scene.locacion.toUpperCase()
    if (!locationFreqMap.has(key)) {
      locationFreqMap.set(key, { tipo: scene.int_ext, count: 0 })
    }
    locationFreqMap.get(key)!.count++
  }

  const locaciones = [...locationFreqMap.entries()].map(([nombre, info]) => ({
    nombre: nombre.charAt(0) + nombre.slice(1).toLowerCase(),
    tipo: info.tipo,
    frecuencia: info.count,
  }))

  // Aggregate characters with scene counts
  const charSet = new Set<string>()
  for (const scene of scenes) {
    for (const p of scene.personajes) charSet.add(p)
  }

  const personajes = [...characterSceneMap.entries()].map(([nombre, sceneSet]) => ({
    nombre,
    num_escenas: sceneSet.size,
    es_protagonista: false,
  }))

  // Identify protagonists: characters in >20% of scenes
  const threshold = Math.max(2, Math.round(scenes.length * 0.2))
  for (const p of personajes) {
    if (p.num_escenas >= threshold) p.es_protagonista = true
  }

  // Sort by scene count descending
  personajes.sort((a, b) => b.num_escenas - a.num_escenas)

  return {
    num_paginas: numPages,
    num_escenas: scenes.length,
    escenas: scenes,
    locaciones,
    personajes,
    screenplay_status: 'parsed',
  }
}
