import { describe, it, expect } from 'vitest';

describe('PreSubmissionReviewPanel', () => {
  describe('State 1: No review', () => {
    it.todo('renders CTA button "Revisar carpeta"');
    it.todo('disables button when generationComplete is false');
    it.todo('shows generation gate message when generation incomplete');
    it.todo('shows disclaimer text about AI review nature');
  });

  describe('State 2: Running', () => {
    it.todo('disables button with spinner during review execution');
    it.todo('shows progress text from streaming chunks');
    it.todo('renders skeleton placeholders for results area');
    it.todo('displays persona completion count');
  });

  describe('State 3: Results', () => {
    it.todo('shows readiness badge with correct color and label');
    it.todo('shows estimated score');
    it.todo('renders section score cards for each EFICINE section A-E');
    it.todo('renders top suggestions list');
    it.todo('renders per-persona assessment summaries');
  });

  describe('State 4: Stale', () => {
    it.todo('shows stale warning when docs regenerated after review');
    it.todo('CTA button returns to primary variant for re-review');
    it.todo('displays "Resultados desactualizados" badge');
  });

  describe('State 5: Error', () => {
    it.todo('shows error alert with retry link');
    it.todo('displays error message from failed review');
  });

  describe('State 6: Re-evaluation', () => {
    it.todo('shows confirmation dialog when re-evaluate clicked');
    it.todo('warns about previous results being replaced');
    it.todo('triggers review on confirm');
  });

  describe('Readiness badge rendering', () => {
    it.todo('renders green badge for lista readiness');
    it.todo('renders yellow badge for casi_lista readiness');
    it.todo('renders orange badge for necesita_trabajo readiness');
    it.todo('renders red badge for no_lista readiness');
  });
});
