// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase-functions v2 Firestore trigger
vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: vi.fn((_config: unknown, handler: unknown) => handler),
}))

// Mock firebase-functions params for defineSecret
vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn(() => ({ value: () => 'test-resend-key' })),
}))

// Mock firebase-admin/firestore
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    doc: vi.fn(() => ({
      update: vi.fn(),
    })),
  })),
}))

// Track Resend mock calls
const mockSend = vi.fn().mockResolvedValue({ error: null })

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}))

// Mock the email template builder (not yet implemented)
vi.mock('@functions/email/templates', () => ({
  buildInvitationEmailHtml: vi.fn(() => '<html>mock</html>'),
}))

describe('onInvitationCreated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports onInvitationCreated as a function', async () => {
    const mod = await import('@functions/triggers/onInvitationCreated')
    expect(typeof mod.onInvitationCreated).toBe('function')
  })

  it('does nothing when event.data is null', async () => {
    const mod = await import('@functions/triggers/onInvitationCreated')
    const handler = mod.onInvitationCreated as unknown as (event: unknown) => Promise<void>
    await expect(
      handler({ data: null, params: { invitationId: '123' } })
    ).resolves.not.toThrow()
  })

  it('does nothing when status is not pending', async () => {
    const mod = await import('@functions/triggers/onInvitationCreated')
    const handler = mod.onInvitationCreated as unknown as (event: unknown) => Promise<void>
    await handler({
      data: { data: () => ({ status: 'accepted' }) },
      params: { invitationId: '123' },
    })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('sends email when status is pending', async () => {
    const mod = await import('@functions/triggers/onInvitationCreated')
    const handler = mod.onInvitationCreated as unknown as (event: unknown) => Promise<void>
    await handler({
      data: {
        data: () => ({
          status: 'pending',
          inviteeEmail: 'test@example.com',
          projectTitle: 'Test',
          inviterName: 'Juan',
          role: 'abogado',
          expiresAt: new Date(),
        }),
      },
      params: { invitationId: '456' },
    })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['test@example.com'],
      })
    )
  })
})
