import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ERPISettings } from '@/schemas/erpi'

const erpiRef = doc(db, 'erpi_settings', 'default')

/**
 * Reads shared ERPI settings.
 */
export async function getERPISettings(): Promise<ERPISettings | null> {
  const snap = await getDoc(erpiRef)
  if (!snap.exists()) return null
  return snap.data() as ERPISettings
}

/**
 * Creates or updates shared ERPI settings.
 */
export async function updateERPISettings(
  data: Partial<ERPISettings>,
): Promise<void> {
  const snap = await getDoc(erpiRef)
  if (snap.exists()) {
    await updateDoc(erpiRef, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(erpiRef, { ...data, updatedAt: serverTimestamp() })
  }
}
