// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildInvitationEmailHtml } from '@functions/email/templates'

const sampleData = {
  projectTitle: 'Mi Pelicula',
  inviterName: 'Juan',
  role: 'line_producer',
  acceptUrl: 'https://example.com/inv/123',
  expiresAt: new Date('2026-04-01'),
}

describe('buildInvitationEmailHtml', () => {
  it('returns an HTML string with DOCTYPE', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('<!DOCTYPE html>')
  })

  it('includes the project title in the email body', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('Mi Pelicula')
  })

  it('includes the inviter name', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('Juan')
  })

  it('includes the accept URL as an href', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('href="https://example.com/inv/123"')
  })

  it('renders the CTA button with #171717 background', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('background: #171717')
  })

  it('includes Carpetify - Lemon Studios footer', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('Carpetify - Lemon Studios')
  })

  it('renders expiration date in Spanish', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result.toLowerCase()).toContain('abril')
  })

  it('maps line_producer role to Line Producer label', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('Line Producer')
  })

  it('uses lang="es" on the html element', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).toContain('lang="es"')
  })

  it('uses inline styles only (no <style> or <link> tags)', () => {
    const result = buildInvitationEmailHtml(sampleData)
    expect(result).not.toContain('<style')
    expect(result).not.toContain('<link')
  })
})
