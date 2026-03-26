import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore } from 'firebase-admin/firestore'
import { sendInvitationEmail } from '../email/sendInvitationEmail.js'

const resendApiKey = defineSecret('RESEND_API_KEY')

export const onInvitationCreated = onDocumentCreated(
  {
    document: 'invitations/{invitationId}',
    region: 'us-central1',
    secrets: [resendApiKey],
  },
  async (event) => {
    const snap = event.data
    if (!snap) return

    const data = snap.data()

    // Only send email for new pending invitations
    if (data.status !== 'pending') return

    const invitationId = event.params.invitationId
    const appUrl = process.env.APP_URL || 'https://carpetify.web.app'

    const expiresAt = data.expiresAt instanceof Date
      ? data.expiresAt
      : data.expiresAt?.toDate?.()
        ? data.expiresAt.toDate()
        : new Date(data.expiresAt)

    const result = await sendInvitationEmail(
      resendApiKey.value(),
      {
        inviteeEmail: data.inviteeEmail,
        projectTitle: data.projectTitle || '',
        inviterName: data.inviterName || '',
        role: data.role || '',
        expiresAt,
        invitationId,
      },
      appUrl,
    )

    // Per Pitfall 2: Track email send status on the invitation document
    const db = getFirestore()
    await db.doc(`invitations/${invitationId}`).update({
      emailSent: result.sent,
      emailError: result.error ?? null,
    })

    if (!result.sent) {
      console.error(`Failed to send invitation email for ${invitationId}:`, result.error)
      // Do NOT throw -- invitation document is still valid.
      // User can still accept via in-app pending invitations.
    }
  }
)
