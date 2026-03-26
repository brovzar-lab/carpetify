export interface InvitationEmailData {
  projectTitle: string
  inviterName: string
  role: string
  acceptUrl: string
  expiresAt: Date
}

const ROLE_LABELS: Record<string, string> = {
  line_producer: 'Line Producer',
  abogado: 'Abogado',
  director: 'Director',
}

export function buildInvitationEmailHtml(data: InvitationEmailData): string {
  const roleLabel = ROLE_LABELS[data.role] || data.role
  const expiryDate = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data.expiresAt)

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333;">
  <h2 style="color: #1a1a1a; font-size: 24px;">Invitacion a colaborar</h2>
  <p style="font-size: 16px;">${data.inviterName} te invito a colaborar en el proyecto <strong>"${data.projectTitle}"</strong> como <strong>${roleLabel}</strong>.</p>
  <p style="margin: 24px 0;">
    <a href="${data.acceptUrl}"
       style="display: inline-block; background: #171717; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Ver invitacion
    </a>
  </p>
  <p style="color: #666666; font-size: 14px;">Esta invitacion expira el ${expiryDate}.</p>
  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;">
  <p style="color: #999999; font-size: 12px;">Carpetify - Lemon Studios</p>
</body>
</html>`.trim()
}
