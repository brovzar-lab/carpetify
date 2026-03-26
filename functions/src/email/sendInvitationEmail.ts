import { Resend } from 'resend'
import { buildInvitationEmailHtml } from './templates.js'

export async function sendInvitationEmail(
  resendApiKey: string,
  invitation: {
    inviteeEmail: string
    projectTitle: string
    inviterName: string
    role: string
    expiresAt: Date
    invitationId: string
  },
  appUrl: string,
): Promise<{ sent: boolean; error?: string }> {
  const resend = new Resend(resendApiKey)

  const acceptUrl = `${appUrl}/invitaciones/${invitation.invitationId}`

  const { error } = await resend.emails.send({
    from: 'Carpetify <noreply@lemon-studios.mx>',
    to: [invitation.inviteeEmail],
    subject: `Te invitaron a colaborar en "${invitation.projectTitle}"`,
    html: buildInvitationEmailHtml({
      projectTitle: invitation.projectTitle,
      inviterName: invitation.inviterName,
      role: invitation.role,
      acceptUrl,
      expiresAt: invitation.expiresAt,
    }),
  })

  if (error) {
    console.error('Resend error:', error)
    return { sent: false, error: error.message }
  }

  return { sent: true }
}
