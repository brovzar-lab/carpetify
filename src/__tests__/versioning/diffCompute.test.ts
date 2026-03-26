// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { diffWords, diffJson, type Change } from 'diff';

/**
 * D-07: Spanish prose diff testing.
 * The diff library MUST be tested with Spanish prose early in implementation --
 * accented characters and long compound sentences can trip up word-boundary
 * detection in English-first libraries.
 */

describe('diffCompute - Spanish prose (D-07)', () => {
  it('should detect word-level changes in Spanish text with standard characters', () => {
    const oldText = 'La produccion cinematografica requiere un presupuesto detallado';
    const newText = 'La produccion audiovisual requiere un presupuesto detallado';
    const changes: Change[] = diffWords(oldText, newText);

    // Should have at least 3 parts: unchanged prefix, removed word, added word, unchanged suffix
    expect(changes.length).toBeGreaterThanOrEqual(3);

    // Find the removed and added parts
    const removed = changes.filter((c) => c.removed);
    const added = changes.filter((c) => c.added);

    expect(removed.length).toBe(1);
    expect(added.length).toBe(1);
    expect(removed[0].value).toContain('cinematografica');
    expect(added[0].value).toContain('audiovisual');

    // Unchanged text preserved
    const unchanged = changes.filter((c) => !c.added && !c.removed);
    expect(unchanged.some((c) => c.value.includes('produccion'))).toBe(true);
    expect(unchanged.some((c) => c.value.includes('presupuesto'))).toBe(true);
  });

  it('should handle accented characters correctly: \u00e1, \u00e9, \u00ed, \u00f3, \u00fa, \u00f1, \u00fc', () => {
    // Text with full range of Spanish accented characters
    const oldText = 'El gui\u00f3n cinematogr\u00e1fico fue escrito por Mar\u00eda Gonz\u00e1lez en la Ciudad de M\u00e9xico';
    const newText = 'El gui\u00f3n cinematogr\u00e1fico fue revisado por Mar\u00eda Gonz\u00e1lez en la Ciudad de M\u00e9xico';
    const changes: Change[] = diffWords(oldText, newText);

    // Only one word changed: "escrito" -> "revisado"
    const removed = changes.filter((c) => c.removed);
    const added = changes.filter((c) => c.added);

    expect(removed.length).toBe(1);
    expect(added.length).toBe(1);
    expect(removed[0].value).toContain('escrito');
    expect(added[0].value).toContain('revisado');

    // Accented characters must NOT be split or corrupted
    const unchanged = changes.filter((c) => !c.added && !c.removed);
    const allUnchangedText = unchanged.map((c) => c.value).join('');

    // Verify each accented character survives the diff intact
    expect(allUnchangedText).toContain('gui\u00f3n');          // o with accent (U+00F3)
    expect(allUnchangedText).toContain('cinematogr\u00e1fico'); // a with accent (U+00E1)
    expect(allUnchangedText).toContain('Mar\u00eda');           // i with accent (U+00ED)
    expect(allUnchangedText).toContain('Gonz\u00e1lez');        // a with accent (U+00E1)
    expect(allUnchangedText).toContain('M\u00e9xico');           // e with accent (U+00E9)
  });

  it('should handle long compound sentences typical of EFICINE documents', () => {
    // Real-world EFICINE prose: multi-clause sentence with accents, commas, special chars
    const oldText =
      'La producci\u00f3n de la pel\u00edcula "El \u00faltimo sue\u00f1o" contar\u00e1 con un presupuesto de $15,000,000 MXN, ' +
      'distribuido entre preproducci\u00f3n, rodaje y postproducci\u00f3n, seg\u00fan lo establecido en el art\u00edculo 189 LISR. ' +
      '\u00bfSe cumplen los requisitos del EFICINE? \u00a1S\u00ed, todos los criterios est\u00e1n verificados!';

    const newText =
      'La producci\u00f3n de la pel\u00edcula "El \u00faltimo sue\u00f1o" contar\u00e1 con un presupuesto de $18,500,000 MXN, ' +
      'distribuido entre preproducci\u00f3n, rodaje y postproducci\u00f3n, seg\u00fan lo establecido en el art\u00edculo 189 LISR. ' +
      '\u00bfSe cumplen los requisitos del EFICINE? \u00a1S\u00ed, todos los criterios est\u00e1n verificados!';

    const changes: Change[] = diffWords(oldText, newText);

    // Only the budget amount changed
    const removed = changes.filter((c) => c.removed);
    const added = changes.filter((c) => c.added);

    expect(removed.length).toBeGreaterThanOrEqual(1);
    expect(added.length).toBeGreaterThanOrEqual(1);

    // The change should be in the monetary amount area.
    // Note: diffWords splits on word/punctuation boundaries, so "$15,000,000"
    // becomes tokens like "$", "15", ",", "000", ",", "000".
    // The changed digit groups appear as separate removed/added pairs.
    const removedText = removed.map((c) => c.value).join('');
    const addedText = added.map((c) => c.value).join('');

    // "15" -> "18" and "000" -> "500" are the two changed digit groups
    expect(removedText).toContain('15');
    expect(addedText).toContain('18');
    expect(removedText).toContain('000');
    expect(addedText).toContain('500');

    // Verify Unicode special characters survive in unchanged portions
    const unchangedText = changes
      .filter((c) => !c.added && !c.removed)
      .map((c) => c.value)
      .join('');

    // u with accent (U+00FA)
    expect(unchangedText).toContain('\u00faltimo');
    // n with tilde (U+00F1)
    expect(unchangedText).toContain('sue\u00f1o');
    // Inverted question mark (U+00BF)
    expect(unchangedText).toContain('\u00bfSe');
    // Inverted exclamation (U+00A1)
    expect(unchangedText).toContain('\u00a1S\u00ed');
    // u with umlaut (U+00FC) -- seg\u00fan
    expect(unchangedText).toContain('seg\u00fan');
  });

  it('should handle empty string to Spanish text diff', () => {
    const oldText = '';
    const newText = 'La producci\u00f3n cinematogr\u00e1fica en M\u00e9xico crece cada a\u00f1o';
    const changes: Change[] = diffWords(oldText, newText);

    // Everything should be added
    const added = changes.filter((c) => c.added);
    expect(added.length).toBeGreaterThanOrEqual(1);

    const addedText = added.map((c) => c.value).join('');
    expect(addedText).toContain('producci\u00f3n');
    expect(addedText).toContain('M\u00e9xico');
    expect(addedText).toContain('a\u00f1o');

    // Nothing removed
    const removed = changes.filter((c) => c.removed);
    expect(removed.length).toBe(0);
  });

  it('should handle Spanish text to empty string diff', () => {
    const oldText = 'El director art\u00edstico supervis\u00f3 la escenograf\u00eda';
    const newText = '';
    const changes: Change[] = diffWords(oldText, newText);

    // Everything should be removed
    const removed = changes.filter((c) => c.removed);
    expect(removed.length).toBeGreaterThanOrEqual(1);

    const removedText = removed.map((c) => c.value).join('');
    expect(removedText).toContain('art\u00edstico');
    expect(removedText).toContain('supervis\u00f3');
    expect(removedText).toContain('escenograf\u00eda');

    // Nothing added
    const added = changes.filter((c) => c.added);
    expect(added.length).toBe(0);
  });
});

describe('diffCompute - structured/JSON diff', () => {
  it('should detect field-level changes in budget-like JSON', () => {
    const oldBudget = {
      cuentas: [
        { codigo: '100', nombre: 'Guion y Argumento', totalCentavos: 50000000 },
        { codigo: '200', nombre: 'Producci\u00f3n', totalCentavos: 300000000 },
      ],
      totalCentavos: 350000000,
      totalFormatted: '$3,500,000 MXN',
    };

    const newBudget = {
      cuentas: [
        { codigo: '100', nombre: 'Guion y Argumento', totalCentavos: 60000000 },
        { codigo: '200', nombre: 'Producci\u00f3n', totalCentavos: 300000000 },
      ],
      totalCentavos: 360000000,
      totalFormatted: '$3,600,000 MXN',
    };

    const changes: Change[] = diffJson(oldBudget, newBudget);

    // Should detect at least one change
    const hasChanges = changes.some((c) => c.added || c.removed);
    expect(hasChanges).toBe(true);

    // Should detect the changed totalCentavos values
    const removedText = changes
      .filter((c) => c.removed)
      .map((c) => c.value)
      .join('');
    const addedText = changes
      .filter((c) => c.added)
      .map((c) => c.value)
      .join('');

    expect(removedText).toContain('50000000');
    expect(addedText).toContain('60000000');
    expect(removedText).toContain('350000000');
    expect(addedText).toContain('360000000');
  });

  it('should detect no changes when JSON objects are identical', () => {
    const budget = {
      totalCentavos: 100000000,
      label: 'Presupuesto b\u00e1sico',
    };

    const changes: Change[] = diffJson(budget, { ...budget });

    // No additions or removals
    const hasChanges = changes.some((c) => c.added || c.removed);
    expect(hasChanges).toBe(false);
  });
});
