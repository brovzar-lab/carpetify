import { useEffect, useState, useCallback } from 'react'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/stores/appStore'
import { es } from '@/locales/es'

const STORAGE_KEY = 'carpetify-theme'

function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * AppHeader provides top-level app chrome.
 * Manages dark mode with a manual toggle that persists in localStorage (D-13).
 * Falls back to system preference when no override is stored.
 * Shows user avatar and sign-out button when authenticated.
 */
export function AppHeader({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()

  // Initialize from localStorage / system pref (after mount to avoid SSR mismatch)
  useEffect(() => {
    const initial = getInitialDark()
    setDark(initial)
    document.documentElement.classList.toggle('dark', initial)

    // Listen for system preference changes (only when no manual override)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setDark(e.matches)
        document.documentElement.classList.toggle('dark', e.matches)
      }
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [])

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      return next
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    // Per Pitfall #14: clear Zustand stores on logout
    useAppStore.getState().resetStore()
    // Per Pitfall #15: clear React Query cache on logout
    queryClient.clear()
    await signOut()
  }, [queryClient, signOut])

  // User avatar fallback: first letter of displayName or email
  const avatarFallback = user?.displayName?.charAt(0) ?? user?.email?.charAt(0) ?? '?'

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Top-right controls — user + dark mode toggle */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        {/* User avatar & sign-out */}
        {user && (
          <>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? es.auth.userMenuLabel}
                className="h-7 w-7 rounded-full border border-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-foreground">
                {avatarFallback.toUpperCase()}
              </div>
            )}
            <button
              onClick={handleSignOut}
              title={es.auth.logoutButton}
              aria-label={es.auth.logoutButton}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          {dark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
      {children}
    </div>
  )
}
