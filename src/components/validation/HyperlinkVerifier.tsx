/**
 * Inline hyperlink verification component.
 * Attempts to verify URL accessibility via HEAD request on mount,
 * caches result per URL, and provides a "Verificar de nuevo" button.
 *
 * CORS fallback: if the browser blocks the request, shows a neutral
 * "No se pudo verificar automaticamente" with a link to open in new tab.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'
import { cn } from '@/lib/utils'

interface HyperlinkVerifierProps {
  url: string
  onVerificationComplete?: (accessible: boolean) => void
  className?: string
}

interface VerificationState {
  verified: boolean
  accessible: boolean
  checking: boolean
  corsBlocked: boolean
}

// Per-component cache: URL -> result
const verificationCache = new Map<
  string,
  { accessible: boolean; corsBlocked: boolean }
>()

export function HyperlinkVerifier({
  url,
  onVerificationComplete,
  className,
}: HyperlinkVerifierProps) {
  const [state, setState] = useState<VerificationState>({
    verified: false,
    accessible: false,
    checking: false,
    corsBlocked: false,
  })
  const abortRef = useRef<AbortController | null>(null)
  const lastUrlRef = useRef<string>('')

  const verify = useCallback(
    async (targetUrl: string, force = false) => {
      if (!targetUrl || !targetUrl.startsWith('http')) return

      // Check cache (unless forced re-verify)
      if (!force) {
        const cached = verificationCache.get(targetUrl)
        if (cached) {
          setState({
            verified: true,
            accessible: cached.accessible,
            checking: false,
            corsBlocked: cached.corsBlocked,
          })
          if (!cached.corsBlocked) {
            onVerificationComplete?.(cached.accessible)
          }
          return
        }
      }

      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState((s) => ({ ...s, checking: true }))

      try {
        // Try HEAD request first; most servers support this
        const response = await fetch(targetUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        })

        // With mode: 'no-cors', an opaque response (type 'opaque') means
        // the server responded but CORS blocked reading it. We treat this
        // as "could not verify automatically" rather than "not accessible".
        if (response.type === 'opaque') {
          const result = { accessible: false, corsBlocked: true }
          verificationCache.set(targetUrl, result)
          setState({
            verified: true,
            accessible: false,
            checking: false,
            corsBlocked: true,
          })
          return
        }

        const accessible = response.ok
        const result = { accessible, corsBlocked: false }
        verificationCache.set(targetUrl, result)
        setState({
          verified: true,
          accessible,
          checking: false,
          corsBlocked: false,
        })
        onVerificationComplete?.(accessible)
      } catch {
        if (controller.signal.aborted) return

        // Network error or CORS -- treat as "could not verify"
        const result = { accessible: false, corsBlocked: true }
        verificationCache.set(targetUrl, result)
        setState({
          verified: true,
          accessible: false,
          checking: false,
          corsBlocked: true,
        })
      }
    },
    [onVerificationComplete],
  )

  // Auto-verify on mount or when URL changes
  useEffect(() => {
    if (url && url !== lastUrlRef.current) {
      lastUrlRef.current = url
      verify(url)
    }

    return () => {
      abortRef.current?.abort()
    }
  }, [url, verify])

  // Don't render if URL is empty
  if (!url) return null

  // Checking state
  if (state.checking) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs text-muted-foreground',
          className,
        )}
      >
        <Loader2 className="size-3.5 animate-spin" />
        {es.validation.hyperlinkChecking}
      </span>
    )
  }

  // Not yet verified
  if (!state.verified) {
    return (
      <Button
        variant="outline"
        size="xs"
        className={cn('text-xs', className)}
        onClick={() => verify(url)}
      >
        {es.validation.hyperlinkVerify}
      </Button>
    )
  }

  // CORS blocked - could not verify automatically
  if (state.corsBlocked) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs',
          className,
        )}
      >
        <AlertTriangle className="size-3.5 text-[hsl(38_92%_50%)]" />
        <span className="text-[hsl(38_92%_50%)]">
          {es.validation.hyperlinkCorsError}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-3" />
        </a>
        <Button
          variant="outline"
          size="xs"
          className="ml-1 text-xs"
          onClick={() => verify(url, true)}
        >
          {es.validation.hyperlinkReverify}
        </Button>
      </span>
    )
  }

  // Accessible
  if (state.accessible) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs',
          className,
        )}
      >
        <CheckCircle className="size-3.5 text-[hsl(142_76%_36%)]" />
        <span className="text-[hsl(142_76%_36%)]">
          {es.validation.hyperlinkAccessible}
        </span>
        <Button
          variant="outline"
          size="xs"
          className="ml-1 text-xs"
          onClick={() => verify(url, true)}
        >
          {es.validation.hyperlinkReverify}
        </Button>
      </span>
    )
  }

  // Not accessible
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        className,
      )}
    >
      <XCircle className="size-3.5 text-[hsl(0_84%_60%)]" />
      <span className="text-[hsl(0_84%_60%)]">
        {es.validation.hyperlinkNotAccessible}
      </span>
      <Button
        variant="outline"
        size="xs"
        className="ml-1 text-xs"
        onClick={() => verify(url, true)}
      >
        {es.validation.hyperlinkReverify}
      </Button>
    </span>
  )
}
