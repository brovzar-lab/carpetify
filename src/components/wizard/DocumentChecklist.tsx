import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { differenceInCalendarDays } from 'date-fns'
import { formatDateES } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Upload } from 'lucide-react'
import { uploadFile } from '@/services/storage'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { es } from '@/locales/es'
import { PERIODOS_EFICINE } from '@/lib/constants'
import { ExpirationBadge } from '@/components/validation/ExpirationBadge'
import { ExpirationAlert } from '@/components/validation/ExpirationAlert'

interface DocumentRecord {
  tipo: string
  filename: string
  storagePath: string
  uploadedAt: Date | null
  fecha_emision?: string
  status: 'uploaded' | 'verified' | 'expired'
}

interface DocumentChecklistProps {
  projectId: string
  documents: Map<string, DocumentRecord>
  onRefresh: () => void
  periodoRegistro?: string
}

type ExpirationStatus = 'vigente' | 'proximo' | 'critico' | 'vencido'

function computeExpirationStatus(
  fechaEmision: string,
  periodoRegistro: string,
): { daysRemaining: number; status: ExpirationStatus } | null {
  const periodo = PERIODOS_EFICINE[periodoRegistro as keyof typeof PERIODOS_EFICINE]
  if (!periodo) return null

  const closeDate = new Date(periodo.close)
  const issueDate = new Date(fechaEmision)
  if (isNaN(issueDate.getTime())) return null

  const daysDiff = differenceInCalendarDays(closeDate, issueDate)
  const daysRemaining = 90 - daysDiff

  let status: ExpirationStatus
  if (daysRemaining < 0) {
    status = 'vencido'
  } else if (daysRemaining <= 14) {
    status = 'critico'
  } else if (daysRemaining <= 30) {
    status = 'proximo'
  } else {
    status = 'vigente'
  }

  return { daysRemaining, status }
}

const REQUIRED_UPLOADS = [
  { tipo: 'acta_constitutiva', label: 'Acta Constitutiva', required: true, hasExpiry: false },
  { tipo: 'poder_notarial', label: 'Poder Notarial del Representante Legal', required: true, hasExpiry: false },
  { tipo: 'cv_productor', label: 'CV del Productor', required: true, hasExpiry: false },
  { tipo: 'identificacion_rep_legal', label: 'Identificacion del Representante Legal', required: true, hasExpiry: false },
  { tipo: 'constancia_fiscal', label: 'Constancia de Situacion Fiscal', required: true, hasExpiry: true },
  { tipo: 'indautor_guion', label: 'Certificado INDAUTOR (Guion)', required: true, hasExpiry: false },
  { tipo: 'indautor_musica', label: 'Certificado INDAUTOR (Musica)', required: false, hasExpiry: false },
  { tipo: 'estado_cuenta', label: 'Estado de Cuenta Bancario', required: true, hasExpiry: true },
  { tipo: 'cotizacion_seguro', label: 'Cotizacion de Seguro', required: true, hasExpiry: true },
  { tipo: 'cotizacion_contador', label: 'Cotizacion de Contador Publico', required: true, hasExpiry: true },
  { tipo: 'contrato_productor', label: 'Contrato Firmado - Productor', required: true, hasExpiry: false },
  { tipo: 'contrato_director', label: 'Contrato Firmado - Director', required: true, hasExpiry: false },
  { tipo: 'contrato_guionista', label: 'Contrato Firmado - Guionista', required: true, hasExpiry: false },
  { tipo: 'reconocimiento_coprod', label: 'Reconocimiento IMCINE Coproduccion', required: false, hasExpiry: false },
] as const

/**
 * Document checklist component per INTK-08, INTK-09.
 * Shows required document types with upload status, file upload, and expiration tracking.
 */
export function DocumentChecklist({
  projectId,
  documents,
  onRefresh,
  periodoRegistro,
}: DocumentChecklistProps) {
  const [searchParams] = useSearchParams()
  const highlightField = searchParams.get('highlight')
  const [highlightActive, setHighlightActive] = useState(false)
  const highlightRef = useRef<HTMLDivElement | null>(null)

  // Field highlight effect: apply ring for 3 seconds then fade
  useEffect(() => {
    if (highlightField && highlightRef.current) {
      setHighlightActive(true)
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const timer = setTimeout(() => setHighlightActive(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightField])

  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const uploadedCount = REQUIRED_UPLOADS.filter((d) =>
    documents.has(d.tipo),
  ).length
  const totalCount = REQUIRED_UPLOADS.length

  const handleUpload = useCallback(
    async (tipo: string, file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error(es.errors.fileUpload)
        return
      }
      setUploadingType(tipo)
      try {
        const storagePath = await uploadFile(projectId, tipo, file)
        const docRef = doc(db, `projects/${projectId}/documents/${tipo}`)
        await setDoc(docRef, {
          tipo,
          filename: file.name,
          storagePath,
          uploadedAt: serverTimestamp(),
          status: 'uploaded',
        })
        toast.success(`Documento subido: ${file.name}`)
        onRefresh()
      } catch {
        toast.error(es.errors.fileUpload)
      } finally {
        setUploadingType(null)
      }
    },
    [projectId, onRefresh],
  )

  const handleDelete = useCallback(
    async (tipo: string) => {
      try {
        const docRef = doc(db, `projects/${projectId}/documents/${tipo}`)
        await deleteDoc(docRef)
        onRefresh()
      } catch {
        toast.error(es.errors.generic)
      }
    },
    [projectId, onRefresh],
  )

  const handleDateChange = useCallback(
    async (tipo: string, fecha_emision: string) => {
      try {
        const docRef = doc(db, `projects/${projectId}/documents/${tipo}`)
        await setDoc(docRef, { fecha_emision }, { merge: true })

        // Check 3-month expiration
        if (fecha_emision) {
          const emision = new Date(fecha_emision)
          const threeMonthsLater = new Date(emision)
          threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)
          const now = new Date()
          if (now > threeMonthsLater) {
            await setDoc(docRef, { status: 'expired' }, { merge: true })
          }
        }
        onRefresh()
      } catch {
        toast.error(es.errors.generic)
      }
    },
    [projectId, onRefresh],
  )

  const getStatusBadge = (tipo: string) => {
    const record = documents.get(tipo)
    if (!record) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {es.screen5.statusMissing}
        </Badge>
      )
    }
    if (record.status === 'expired') {
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {es.screen5.statusExpired}
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
        {es.screen5.statusUploaded}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {uploadedCount} de {totalCount} documentos subidos
      </p>

      {/* Document list */}
      <div className="space-y-3">
        {REQUIRED_UPLOADS.map((docType) => {
          const record = documents.get(docType.tipo)
          const isUploading = uploadingType === docType.tipo
          const isHighlighted = highlightField === docType.tipo

          // Compute expiration if applicable
          const expiration =
            docType.hasExpiry && record?.fecha_emision && periodoRegistro
              ? computeExpirationStatus(record.fecha_emision, periodoRegistro)
              : null

          return (
            <div
              key={docType.tipo}
              ref={isHighlighted ? highlightRef : undefined}
              className={`flex items-center gap-3 rounded-md border p-3 transition-all duration-300 ${
                isHighlighted && highlightActive
                  ? 'ring-2 ring-primary/50'
                  : ''
              }`}
            >
              {/* Doc info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{docType.label}</span>
                  {!docType.required && (
                    <Badge variant="outline" className="text-xs">
                      Opcional
                    </Badge>
                  )}
                  {getStatusBadge(docType.tipo)}
                  {/* Expiration badge inline */}
                  {expiration && (
                    <ExpirationBadge
                      daysRemaining={expiration.daysRemaining}
                      status={expiration.status}
                    />
                  )}
                </div>

                {/* Uploaded file info */}
                {record && (
                  <p className="text-xs text-muted-foreground">
                    {record.filename}
                    {record.uploadedAt &&
                      ` - ${formatDateES(new Date(record.uploadedAt))}`}
                  </p>
                )}

                {/* Expiration date field for applicable docs */}
                {docType.hasExpiry && record && (
                  <div className="flex items-center gap-2 pt-1">
                    <Label className="text-xs">Fecha de emision:</Label>
                    <Input
                      type="date"
                      className="h-7 w-40 text-xs"
                      value={record.fecha_emision || ''}
                      onChange={(e) =>
                        handleDateChange(docType.tipo, e.target.value)
                      }
                    />
                    <span className="text-xs text-muted-foreground">DD/MM/AAAA</span>
                  </div>
                )}

                {/* Expiration alert below the row */}
                {expiration && expiration.status !== 'vigente' && (
                  <ExpirationAlert
                    docType={docType.tipo}
                    daysRemaining={expiration.daysRemaining}
                    status={expiration.status}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {record ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = fileInputRefs.current.get(docType.tipo)
                        input?.click()
                      }}
                    >
                      Reemplazar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(docType.tipo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => {
                      const input = fileInputRefs.current.get(docType.tipo)
                      input?.click()
                    }}
                  >
                    {isUploading ? (
                      'Subiendo...'
                    ) : (
                      <>
                        <Upload className="mr-1 h-3 w-3" />
                        {es.screen5.uploadButton}
                      </>
                    )}
                  </Button>
                )}
                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current.set(docType.tipo, el)
                  }}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(docType.tipo, file)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
