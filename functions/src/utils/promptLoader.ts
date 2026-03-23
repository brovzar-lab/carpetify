import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads a prompt template from the prompts/ directory and injects variables.
 * Prompts use {{variable}} placeholders.
 * Per CLAUDE.md: prompts in prompts/ are the EXACT system prompts to use.
 * Do NOT rewrite them -- only inject data into {{variable}} placeholders.
 *
 * Path resolution:
 *   Compiled location: functions/lib/utils/promptLoader.js
 *   Target:            functions/prompts/ (copied by predeploy in firebase.json)
 *   Relative:          ../../prompts (two levels up from lib/utils/)
 */
export function loadPrompt(
  filename: string,
  variables: Record<string, string>,
): string {
  const filepath = path.join(__dirname, '../../prompts', filename);
  let template = readFileSync(filepath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }
  return template;
}
