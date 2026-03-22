import { useEffect } from 'react'

/**
 * AppHeader provides the minimal top-level app chrome.
 * Handles dark mode detection via system preference (D-13).
 */
export function AppHeader({ children }: { children: React.ReactNode }) {
  // Dark mode system preference detection (D-13)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme(dark: boolean) {
      document.documentElement.classList.toggle('dark', dark)
    }

    applyTheme(mediaQuery.matches)
    mediaQuery.addEventListener('change', (e) => applyTheme(e.matches))

    return () => {
      mediaQuery.removeEventListener('change', (e) => applyTheme(e.matches))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
