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
import type { GeneratedDocument, DocumentId, PassId, VersionTriggerReason } from '../shared/types.js';
import { DOCUMENT_REGISTRY } from '../shared/types.js';
import type { BudgetOutput } from '../financial/budgetComputer.js';

/**
 * Save a generated document to Firestore.
 * Writes to projects/{projectId}/generated/{docId}
 *
 * Before overwriting an existing document, snapshots its current content
 * into a versions subcollection (per D-01, D-02). When 10 versions exist,
 * the oldest is pruned in the same batched write (per D-04).
 */
export async function saveGeneratedDocument(
  projectId: string,
  docId: DocumentId,
  content: unknown,
  passId: PassId,
  promptFile: string,
  modelUsed: string,
  triggeredBy?: string,
  triggerReason?: VersionTriggerReason,
): Promise<void> {
  const db = getFirestore();
  const registry = DOCUMENT_REGISTRY[docId];

  const docRef = db
    .collection('projects')
    .doc(projectId)
    .collection('generated')
    .doc(docId);

  // Check if document already exists to increment version
  const existing = await docRef.get();

  let newVersion = 1;
  if (existing.exists) {
    const existingData = existing.data()!;
    const currentVersion = (existingData.version as number) || 1;
    newVersion = currentVersion + 1;

    // Step 1: Snapshot existing document before overwrite (per D-01, D-02)
    const versionsRef = docRef.collection('versions');

    // Per D-04: Check if at 10 versions, if so delete oldest in same batch
    const versionsSnap = await versionsRef.orderBy('version', 'asc').get();
    const batch = db.batch();

    // If at or above 10 versions, delete the oldest to make room
    if (versionsSnap.size >= 10) {
      const oldestDoc = versionsSnap.docs[0];
      batch.delete(oldestDoc.ref);
    }

    // Archive current version to subcollection
    const versionDoc: Record<string, unknown> = {
      content: existingData.editedContent ?? existingData.content,
      editedContent: existingData.editedContent ?? null,
      contentType: existingData.contentType ?? 'prose',
      version: currentVersion,
      passId: existingData.passId ?? passId,
      generatedAt: existingData.generatedAt ?? null,
      archivedAt: FieldValue.serverTimestamp(),
      triggerReason: triggerReason ?? 'regeneration',
      triggeredBy: triggeredBy ?? null,
      modelUsed: existingData.modelUsed ?? '',
      promptFile: existingData.promptFile ?? '',
    };

    batch.set(versionsRef.doc(String(currentVersion)), versionDoc);

    // Commit the batch (prune + archive atomically)
    await batch.commit();
  }

  // Step 2: Write new version
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
    version: newVersion,
    manuallyEdited: false,
  };

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
