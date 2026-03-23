/**
 * Firestore real-time listener for generated documents.
 * Subscribes to projects/{projectId}/generated subcollection
 * and provides a live list of all generated documents.
 */
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ---- Types ----

export interface GeneratedDocClient {
  docId: string
  docName: string
  section: string
  passId: string
  contentType: string
  generatedAt: Date | null
  manuallyEdited: boolean
  version: number
}

// ---- Hook ----

export function useGeneratedDocs(projectId: string) {
  const [docs, setDocs] = useState<GeneratedDocClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setDocs([])
      setLoading(false)
      return
    }

    const q = query(collection(db, `projects/${projectId}/generated`))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docList = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            docId: doc.id,
            docName: data.docName ?? '',
            section: data.section ?? '',
            passId: data.passId ?? '',
            contentType: data.contentType ?? 'prose',
            generatedAt: data.generatedAt?.toDate?.() ?? null,
            manuallyEdited: data.manuallyEdited ?? false,
            version: data.version ?? 1,
          } satisfies GeneratedDocClient
        })
        setDocs(docList)
        setLoading(false)
      },
      (error) => {
        console.error('Error listening to generated docs:', error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [projectId])

  return { docs, loading }
}
