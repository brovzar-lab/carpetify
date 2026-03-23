import type { ParsedScene, ScreenplayBreakdown, LocationSummary, CharacterSummary } from './types.js';

/**
 * Regex patterns for standard screenplay format (FDX / Fade In / Final Draft / Highland).
 * Identical to the client-side parser at src/parsers/screenplayParser.ts.
 */
const SCENE_HEADING_RX =
  /^(INT(?:ERIOR)?\.?(?:\/EXT\.?)?|EXT(?:ERIOR)?\.?|INT\.?-EXT\.?|EXT\.?\/INT\.?)\s*[.\-\u2013\u2014]?\s*(.+?)\s*[.\-\u2013\u2014]?\s*(DIA|NOCHE|AMANECER|ATARDECER|DAY|NIGHT|DAWN|DUSK|CONTINUO|CONTINUOUS|M\u00c1S\s+TARDE|LATER)?$/i;

const CHAR_CUE_RX =
  /^([A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\u00dc][A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\u00dc\s\d.,'()-]{1,50})$/;

const NOT_A_CHARACTER_RX =
  /^(CORTE|FADE|DISUELVE|SUPER|TITLE|FIN|THE END|CUT|SMASH|IRIS)/i;

type IntExt = 'INT' | 'EXT' | 'INT-EXT';
type DiaNoche = 'DIA' | 'NOCHE' | 'AMANECER' | 'ATARDECER';

function normalizeIntExt(raw: string): IntExt {
  const u = raw.toUpperCase().replace(/\s+/g, '');
  if (u.includes('INT') && u.includes('EXT')) return 'INT-EXT';
  if (u.startsWith('EXT')) return 'EXT';
  return 'INT';
}

function normalizeDiaNoche(raw: string | undefined): DiaNoche {
  if (!raw) return 'DIA';
  const u = raw.toUpperCase();
  if (u.includes('NOCHE') || u.includes('NIGHT')) return 'NOCHE';
  if (u.includes('AMANECER') || u.includes('DAWN')) return 'AMANECER';
  if (u.includes('ATARDECER') || u.includes('DUSK')) return 'ATARDECER';
  return 'DIA';
}

/**
 * Parses raw screenplay text into structured screenplay data.
 * Input is a raw text string (pdf-parse already extracted the text).
 * Returns ScreenplayBreakdown with scenes, locations, characters, and breakdowns.
 *
 * Uses the same regex patterns as the client-side parser at src/parsers/screenplayParser.ts.
 */
export function parseScreenplayStructure(
  rawText: string,
  totalPages: number,
): ScreenplayBreakdown {
  const lines = rawText.split('\n').map((l) => l.trim());
  const scenes: ParsedScene[] = [];
  const characterSceneMap = new Map<string, Set<number>>(); // char -> scene indices
  let currentSceneIdx = -1;
  let currentSceneLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // --- Scene heading ---
    const sceneMatch = SCENE_HEADING_RX.exec(line);
    if (sceneMatch) {
      // Save accumulated raw text for previous scene
      if (currentSceneIdx >= 0 && scenes[currentSceneIdx]) {
        scenes[currentSceneIdx].rawText = currentSceneLines.join('\n');
      }

      currentSceneIdx = scenes.length;
      currentSceneLines = [line];
      const int_ext = normalizeIntExt(sceneMatch[1]);
      const locacion = (sceneMatch[2] ?? '').trim().replace(/\s{2,}/g, ' ');
      const dia_noche = normalizeDiaNoche(sceneMatch[3]);

      scenes.push({
        numero: scenes.length + 1,
        int_ext,
        dia_noche,
        locacion,
        personajes: [],
        rawText: '',
      });
      continue;
    }

    // Accumulate raw text for current scene
    if (currentSceneIdx >= 0) {
      currentSceneLines.push(line);
    }

    // --- Character cue (ALL-CAPS line) ---
    if (
      currentSceneIdx >= 0 &&
      CHAR_CUE_RX.test(line) &&
      !NOT_A_CHARACTER_RX.test(line) &&
      line === line.toUpperCase()
    ) {
      // Strip parentheticals like "(V.O.)" "(O.S.)"
      const charName = line.replace(/\s*\(.*?\)\s*/g, '').trim();
      if (charName.length >= 2) {
        if (!characterSceneMap.has(charName)) {
          characterSceneMap.set(charName, new Set());
        }
        characterSceneMap.get(charName)!.add(currentSceneIdx);

        // Add to current scene's character list if not already there
        const currentScene = scenes[currentSceneIdx];
        if (!currentScene.personajes.includes(charName)) {
          currentScene.personajes.push(charName);
        }
      }
    }
  }

  // Finalize last scene's rawText
  if (currentSceneIdx >= 0 && scenes[currentSceneIdx]) {
    scenes[currentSceneIdx].rawText = currentSceneLines.join('\n');
  }

  // Aggregate locations
  const locationFreqMap = new Map<string, { tipo: string; count: number }>();
  for (const scene of scenes) {
    const key = scene.locacion.toUpperCase();
    if (!locationFreqMap.has(key)) {
      locationFreqMap.set(key, { tipo: scene.int_ext, count: 0 });
    }
    locationFreqMap.get(key)!.count++;
  }

  const locaciones: LocationSummary[] = [...locationFreqMap.entries()].map(
    ([nombre, info]) => ({
      nombre: nombre.charAt(0) + nombre.slice(1).toLowerCase(),
      tipo: info.tipo,
      frecuencia: info.count,
    }),
  );

  // Aggregate characters with scene counts
  const personajes: CharacterSummary[] = [...characterSceneMap.entries()].map(
    ([nombre, sceneSet]) => ({
      nombre,
      num_escenas: sceneSet.size,
      es_protagonista: false,
    }),
  );

  // Identify protagonists: characters in >20% of scenes
  if (scenes.length > 0) {
    const threshold = Math.max(2, Math.round(scenes.length * 0.2));
    for (const p of personajes) {
      if (p.num_escenas >= threshold) p.es_protagonista = true;
    }
  }

  // Sort by scene count descending
  personajes.sort((a, b) => b.num_escenas - a.num_escenas);

  // Compute breakdowns
  const desglose_int_ext = {
    int: scenes.filter((s) => s.int_ext === 'INT').length,
    ext: scenes.filter((s) => s.int_ext === 'EXT').length,
    int_ext: scenes.filter((s) => s.int_ext === 'INT-EXT').length,
  };

  const desglose_dia_noche = {
    dia: scenes.filter((s) => s.dia_noche === 'DIA').length,
    noche: scenes.filter((s) => s.dia_noche === 'NOCHE').length,
    otro: scenes.filter(
      (s) => s.dia_noche === 'AMANECER' || s.dia_noche === 'ATARDECER',
    ).length,
  };

  return {
    num_paginas: totalPages,
    num_escenas: scenes.length,
    escenas: scenes,
    locaciones,
    personajes,
    desglose_int_ext,
    desglose_dia_noche,
    raw_text: rawText,
  };
}
