import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DocumentChecklist } from '@/components/wizard/DocumentChecklist'
import { es } from '@/locales/es'

interface DocumentRecord {
  tipo: string
  filename: string
  storagePath: string
  uploadedAt: Date | null
  fecha_emision?: string
  status: 'uploaded' | 'verified' | 'expired'
}

interface DocumentUploadProps {
  projectId: string
}

/**
 * Screen 5 (Documentos): Document upload with completeness tracking.
 * Loads existing uploaded documents and renders DocumentChecklist.
 * Per INTK-08, INTK-09.
 */
export function DocumentUpload({ projectId }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Map<string, DocumentRecord>>(
    new Map(),
  )
  const [loaded, setLoaded] = useState(false)

  const loadDocuments = useCallback(async () => {
    try {
      const colRef = collection(db, `projects/${projectId}/documents`)
      const snap = await getDocs(colRef)
      const map = new Map<string, DocumentRecord>()
      snap.docs.forEach((doc) => {
        const data = doc.data()
        map.set(doc.id, {
          tipo: data.tipo || doc.id,
          filename: data.filename || '',
          storagePath: data.storagePath || '',
          uploadedAt: data.uploadedAt?.toDate?.() || null,
          fecha_emision: data.fecha_emision || undefined,
          status: data.status || 'uploaded',
        })
      })
      setDocuments(map)
    } catch {
      // No documents yet
    }
    setLoaded(true)
  }, [projectId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  if (!loaded) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{es.screen5.title}</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{es.screen5.title}</h1>
      <p className="text-sm text-muted-foreground">
        {es.screen5.emptyStateBody}
      </p>
      <DocumentChecklist
        projectId={projectId}
        documents={documents}
        onRefresh={loadDocuments}
      />
    </div>
  )
}
