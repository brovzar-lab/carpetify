import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

/**
 * Uploads a file to Firebase Storage under the project's upload path.
 * Returns the storage path.
 */
export async function uploadFile(
  projectId: string,
  docType: string,
  file: File,
): Promise<string> {
  const timestamp = Date.now()
  const storagePath = `projects/${projectId}/uploads/${docType}_${timestamp}.pdf`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file)
  return storagePath
}

/**
 * Returns a download URL for a file at the given storage path.
 */
export async function getFileURL(path: string): Promise<string> {
  const storageRef = ref(storage, path)
  return getDownloadURL(storageRef)
}
