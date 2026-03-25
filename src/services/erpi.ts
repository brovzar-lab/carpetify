import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ERPISettings } from '@/schemas/erpi'

/**
 * Returns the Firestore document reference for ERPI settings
 * scoped to the given organization.
 * Per D-07: ERPI settings live at organizations/{orgId}/erpi_settings/default
 */
function erpiRef(orgId: string) {
  return doc(db, 'organizations', orgId, 'erpi_settings', 'default')
}

/**
 * Reads organization-scoped ERPI settings.
 */
export async function getERPISettings(orgId: string): Promise<ERPISettings | null> {
  const snap = await getDoc(erpiRef(orgId))
  if (!snap.exists()) return null
  return snap.data() as ERPISettings
}

/**
 * Creates or updates organization-scoped ERPI settings.
 */
export async function updateERPISettings(
  orgId: string,
  data: Partial<ERPISettings>,
): Promise<void> {
  const ref = erpiRef(orgId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() })
  }
}
