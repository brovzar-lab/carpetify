import { PDFParse } from 'pdf-parse';
import type { ExtractionResult } from './types.js';

/**
 * Extracts raw text from a PDF buffer using pdf-parse v2.
 * Normalizes text: trims lines, collapses multiple blank lines.
 * Per D-01: digital-native PDFs only (no OCR).
 * Per D-05: caller must enforce 200 page / 15MB limits before calling this.
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo(),
    ]);

    // Normalize: trim each line, collapse multiple blank lines
    const normalizedText = textResult.text
      .split('\n')
      .map((line: string) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');

    return {
      text: normalizedText,
      numPages: textResult.total,
      metadata: {
        title: infoResult.info?.Title as string | undefined,
        author: infoResult.info?.Author as string | undefined,
        creator: infoResult.info?.Creator as string | undefined,
      },
    };
  } finally {
    await parser.destroy();
  }
}
