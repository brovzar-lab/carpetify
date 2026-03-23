/**
 * Firestore operations for generated documents and cross-pass budget data.
 *
 * Generated documents: projects/{projectId}/generated/{docId}
 * Budget output (D-13): projects/{projectId}/meta/budget_output
 *
 * storeBudgetOutputForDownstream / loadBudgetOutput enable deterministic
 * financial data flow between passes -- Claude never reads financial
 * numbers from a previous document.
 */

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { GeneratedDocument, DocumentId, PassId } from '../shared/types.js';
import { DOCUMENT_REGISTRY } from '../shared/types.js';
import type { BudgetOutput } from '../financial/budgetComputer.js';

/**
 * Save a generated document to Firestore.
 * Writes to projects/{projectId}/generated/{docId}
 */
export async function saveGeneratedDocument(
  projectId: string,
  docId: DocumentId,
  content: unknown,
  passId: PassId,
  promptFile: string,
  modelUsed: string,
): Promise<void> {
  const db = getFirestore();
  const registry = DOCUMENT_REGISTRY[docId];

  const docData: Omit<GeneratedDocument, 'generatedAt'> & { generatedAt: ReturnType<typeof FieldValue.serverTimestamp> } = {
    docId,
    docName: registry.docName,
    section: registry.section,
    passId,
    content,
    contentType: registry.contentType,
    generatedAt: FieldValue.serverTimestamp() as unknown as ReturnType<typeof FieldValue.serverTimestamp>,
    inputHash: '', // TODO: compute from input data
    modelUsed,
    promptFile,
    version: 1, // Will be incremented on subsequent generations
    manuallyEdited: false,
  };

  const docRef = db
    .collection('projects')
    .doc(projectId)
    .collection('generated')
    .doc(docId);

  // Check if document already exists to increment version
  const existing = await docRef.get();
  if (existing.exists) {
    const existingData = existing.data();
    docData.version = ((existingData?.version as number) || 0) + 1;
  }

  await docRef.set(docData);
}

/**
 * Get a single generated document from Firestore.
 */
export async function getGeneratedDocument(
  projectId: string,
  docId: DocumentId,
): Promise<GeneratedDocument | null> {
  const db = getFirestore();
  const docRef = db
    .collection('projects')
    .doc(projectId)
    .collection('generated')
    .doc(docId);

  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  return snapshot.data() as GeneratedDocument;
}

/**
 * Get all generated documents for a project.
 */
export async function getAllGeneratedDocuments(
  projectId: string,
): Promise<GeneratedDocument[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection('projects')
    .doc(projectId)
    .collection('generated')
    .get();

  return snapshot.docs.map((doc) => doc.data() as GeneratedDocument);
}

/**
 * Store the complete BudgetOutput for downstream passes (D-13).
 * Writes to projects/{projectId}/meta/budget_output.
 *
 * CRITICAL: Stores the FULL BudgetOutput structure -- cuentas with ALL partidas,
 * totalCentavos, and totalFormatted. Downstream passes need partida-level detail.
 *
 * This is the single source of truth for:
 * - financeAdvisor pass (cash flow, esquema financiero)
 * - legal pass (contract amounts)
 * - combined pass (resumen ejecutivo, ficha tecnica)
 * - frontend BudgetEditor auto-save
 */
export async function storeBudgetOutputForDownstream(
  projectId: string,
  budget: BudgetOutput,
): Promise<void> {
  const db = getFirestore();
  await db
    .collection('projects')
    .doc(projectId)
    .collection('meta')
    .doc('budget_output')
    .set({
      ...budget,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Load the stored BudgetOutput for downstream pass consumption.
 * Returns null if lineProducer pass hasn't run yet.
 */
export async function loadBudgetOutput(
  projectId: string,
): Promise<BudgetOutput | null> {
  const db = getFirestore();
  const snapshot = await db
    .collection('projects')
    .doc(projectId)
    .collection('meta')
    .doc('budget_output')
    .get();

  if (!snapshot.exists) return null;

  const data = snapshot.data();
  if (!data) return null;

  return {
    cuentas: data.cuentas,
    totalCentavos: data.totalCentavos,
    totalFormatted: data.totalFormatted,
  } as BudgetOutput;
}
