/**
 * Handlebars-based prompt loader with automatic language guardrail.
 * Replaces the simple replaceAll approach in functions/src/utils/promptLoader.ts.
 *
 * Every prompt output MUST have the language guardrail block appended (LANG-01, LANG-04).
 *
 * Path resolution:
 *   Compiled to: functions/lib/pipeline/promptLoader.js
 *   Prompts at:  functions/prompts/ (copied by predeploy)
 *   Relative:    ../../prompts (two levels up from lib/pipeline/)
 *   Guardrail:   ../../directives/politica_idioma.md OR functions/directives/politica_idioma.md
 */

import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The language guardrail block extracted from politica_idioma.md.
 * Cached at module init. Appended to every rendered prompt.
 */
const LANGUAGE_GUARDRAIL = loadLanguageGuardrail();

function loadLanguageGuardrail(): string {
  try {
    // Try loading from directives/ (available when predeploy copies it,
    // or in test environment via mock)
    const candidates = [
      path.join(__dirname, '../../directives/politica_idioma.md'),
      path.join(__dirname, '../../../directives/politica_idioma.md'),
    ];

    for (const candidate of candidates) {
      try {
        const content = readFileSync(candidate, 'utf-8');
        // Extract the guardrail block -- the section at the end of the policy document
        // that should be appended to all AI prompts
        return extractGuardrailBlock(content);
      } catch {
        // Try next candidate
      }
    }

    // Fallback guardrail if file not found (test environments)
    return getFallbackGuardrail();
  } catch {
    return getFallbackGuardrail();
  }
}

function extractGuardrailBlock(policyContent: string): string {
  // The guardrail block is the "INSTRUCCION DE IDIOMA OBLIGATORIA" section
  // defined at the end of politica_idioma.md
  const guardrailMarker = 'INSTRUCCION DE IDIOMA OBLIGATORIA';
  const idx = policyContent.indexOf(guardrailMarker);
  if (idx !== -1) {
    // Return from the marker to the end of the surrounding code block or document
    const blockStart = policyContent.lastIndexOf('```', idx);
    const blockEnd = policyContent.indexOf('```', idx + guardrailMarker.length);
    if (blockStart !== -1 && blockEnd !== -1) {
      // Return content between the code fences
      return policyContent.substring(blockStart + 3, blockEnd).trim();
    }
    // Otherwise return from marker to end
    return policyContent.substring(idx).trim();
  }

  // If no specific marker found, return the entire policy as guardrail
  return policyContent;
}

function getFallbackGuardrail(): string {
  return `INSTRUCCION DE IDIOMA OBLIGATORIA:
- Escribe EXCLUSIVAMENTE en espanol mexicano profesional.
- Usa la terminologia oficial de IMCINE y EFICINE sin traducir.
- Los montos van en pesos mexicanos con formato: $X,XXX,XXX MXN.
- Las fechas van en formato: "15 de julio de 2026" o "Agosto 2026".
- NO uses anglicismos innecesarios.
- El tono es profesional, directo y concreto.`;
}

/**
 * Load a prompt template from the prompts/ directory, inject variables via
 * Handlebars, and append the language guardrail.
 *
 * @param promptFile - Filename in the prompts/ directory (e.g., "a7_propuesta_produccion.md")
 * @param variables - Key-value map of template variables
 * @returns Rendered prompt with guardrail appended
 */
export function loadPrompt(promptFile: string, variables: Record<string, unknown>): string {
  const rawContent = readFileSync(
    path.join(__dirname, '../../prompts', promptFile),
    'utf-8',
  );

  // Compile and render with Handlebars (strict: false allows missing variables)
  const template = Handlebars.compile(rawContent, { strict: false });
  const rendered = template(variables);

  // ALWAYS append language guardrail -- this is the LANG-01/LANG-04 enforcement point
  return rendered + '\n\n' + LANGUAGE_GUARDRAIL;
}

/**
 * Validate that all {{variable}} placeholders in a prompt file have
 * corresponding entries in the variables object.
 *
 * @param promptFile - Filename in the prompts/ directory
 * @param variables - Key-value map to check against
 * @returns Array of unresolved variable names (empty if all resolved)
 */
export function validatePromptVariables(
  promptFile: string,
  variables: Record<string, unknown>,
): string[] {
  const rawContent = readFileSync(
    path.join(__dirname, '../../prompts', promptFile),
    'utf-8',
  );

  // Find all {{variable}} patterns, excluding block helpers
  const variablePattern = /\{\{(?!#|\/|!|>|else)([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g;
  const foundVariables = new Set<string>();

  let match;
  while ((match = variablePattern.exec(rawContent)) !== null) {
    const varName = match[1];
    // Skip Handlebars keywords and path expressions like "this.nombre"
    if (!varName.startsWith('this.') && varName !== 'this') {
      foundVariables.add(varName);
    }
  }

  // Return variables that are not provided
  const unresolved: string[] = [];
  for (const varName of foundVariables) {
    if (!(varName in variables)) {
      unresolved.push(varName);
    }
  }

  return unresolved;
}
